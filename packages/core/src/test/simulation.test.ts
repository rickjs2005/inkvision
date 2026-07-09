import { beforeEach, describe, expect, it } from "vitest";
import { MockAiProvider } from "@inkvision/ai";
import type { Actor } from "../domain/actor";
import type {
  DesignRepository,
  DesignStatus,
  DesignVersion,
} from "../application/ports/design-repository";
import type {
  CreateSimulationData,
  Simulation,
  SimulationRepository,
  SimulationVariants,
} from "../application/ports/simulation-repository";
import type { AiUsageRepository, RealtimePublisher, SimulationQueue } from "../application/ports/ai-support";
import { ReviewDesignUseCase, SendDesignUseCase } from "../application/use-cases/simulation/design";
import {
  ApproveSimulationUseCase,
  ProcessSimulationUseCase,
  RequestSimulationUseCase,
} from "../application/use-cases/simulation/simulate";
import { InMemoryArtistRepo } from "./fakes-artist";
import { InMemoryNotificationRepo, InMemoryOrderRepo } from "./fakes-order";

class InMemoryDesignRepo implements DesignRepository {
  designs: DesignVersion[] = [];
  async create(orderId: string, imageUrl: string, notes: string | null) {
    const d: DesignVersion = {
      id: `d_${this.designs.length + 1}`,
      orderId,
      version: this.designs.filter((x) => x.orderId === orderId).length + 1,
      imageUrl,
      notes,
      status: "PENDING",
      feedback: null,
      createdAt: new Date(0),
    };
    this.designs.push(d);
    return d;
  }
  async getLatest(orderId: string) {
    return [...this.designs].reverse().find((d) => d.orderId === orderId) ?? null;
  }
  async getLatestApproved(orderId: string) {
    return [...this.designs].reverse().find((d) => d.orderId === orderId && d.status === "APPROVED") ?? null;
  }
  async listForOrder(orderId: string) {
    return this.designs.filter((d) => d.orderId === orderId);
  }
  async setStatus(id: string, status: DesignStatus, feedback: string | null) {
    const d = this.designs.find((x) => x.id === id)!;
    d.status = status;
    d.feedback = feedback;
    return d;
  }
}

class InMemorySimulationRepo implements SimulationRepository {
  sims: Simulation[] = [];
  async create(data: CreateSimulationData) {
    const s: Simulation = {
      id: `s_${this.sims.length + 1}`,
      ...data,
      composedImageUrl: data.composedImageUrl ?? null,
      composedMaskUrl: data.composedMaskUrl ?? null,
      variants: null,
      status: "QUEUED",
      errorMessage: null,
      createdAt: new Date(0),
    };
    this.sims.push(s);
    return s;
  }
  async findById(id: string) {
    return this.sims.find((s) => s.id === id) ?? null;
  }
  async getLatestForOrder(orderId: string) {
    return [...this.sims].reverse().find((s) => s.orderId === orderId) ?? null;
  }
  async markProcessing(id: string) {
    this.sims.find((s) => s.id === id)!.status = "PROCESSING";
  }
  async markDone(id: string, variants: SimulationVariants, provider: string) {
    const s = this.sims.find((x) => x.id === id)!;
    s.status = "DONE";
    s.variants = variants;
    s.provider = provider;
    return s;
  }
  async markFailed(id: string, errorMessage: string) {
    const s = this.sims.find((x) => x.id === id)!;
    s.status = "FAILED";
    s.errorMessage = errorMessage;
  }
}

const STUDIO = "studio_1";
const client: Actor = { userId: "u_client", platformRole: "USER", memberships: [] };
const artistActor: Actor = { userId: "u_artist", platformRole: "USER", memberships: [{ studioId: STUDIO, role: "ARTIST" }] };

describe("fluxo de arte + simulação", () => {
  let orders: InMemoryOrderRepo;
  let designs: InMemoryDesignRepo;
  let sims: InMemorySimulationRepo;
  let artists: InMemoryArtistRepo;
  let notifications: InMemoryNotificationRepo;
  let aiUsage: AiUsageRepository & { calls: number };
  let realtimeEvents: string[];
  let queued: string[];
  let orderId: string;

  beforeEach(async () => {
    orders = new InMemoryOrderRepo();
    designs = new InMemoryDesignRepo();
    sims = new InMemorySimulationRepo();
    artists = new InMemoryArtistRepo();
    notifications = new InMemoryNotificationRepo();
    realtimeEvents = [];
    queued = [];
    aiUsage = { calls: 0, async log() { this.calls++; } };
    const artist = artists.seed({ userId: "u_artist", studioId: STUDIO });
    const order = await orders.create({
      studioId: STUDIO,
      clientId: "u_client",
      artistId: artist.id,
      bodyPart: "braço",
      briefing: "x".repeat(12),
      references: [],
    });
    order.status = "DEPOSIT_PAID";
    orderId = order.id;
  });

  const queue: SimulationQueue = { async enqueue(id) { queued.push(id); } };
  const realtime: RealtimePublisher = { async toUser(_u, event) { realtimeEvents.push(event); } };
  const deps = () => ({
    orders,
    designs,
    simulations: sims,
    aiUsage,
    queue,
    provider: new MockAiProvider(),
    realtime,
    artists,
    notifications,
  });

  it("tatuador envia arte → DESIGN_REVIEW", async () => {
    await new SendDesignUseCase(deps()).execute(artistActor, STUDIO, orderId, { imageUrl: "https://cdn/art.png" });
    expect(orders.orders[0]!.status).toBe("DESIGN_REVIEW");
    expect(designs.designs).toHaveLength(1);
    expect(await notifications.countUnread("u_client")).toBe(1);
  });

  it("fluxo completo até simulação aprovada", async () => {
    await new SendDesignUseCase(deps()).execute(artistActor, STUDIO, orderId, { imageUrl: "https://cdn/art.png" });
    await new ReviewDesignUseCase(deps()).execute(client, orderId, { approve: true });
    expect(orders.orders[0]!.status).toBe("DESIGN_APPROVED");

    const { simulationId } = await new RequestSimulationUseCase(deps()).execute(client, orderId, {
      bodyPhotoUrl: "https://cdn/body.jpg",
      placement: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    });
    expect(orders.orders[0]!.status).toBe("SIMULATING");
    expect(queued).toEqual([simulationId]);

    await new ProcessSimulationUseCase(deps()).execute(simulationId);
    expect(sims.sims[0]!.status).toBe("DONE");
    expect(orders.orders[0]!.status).toBe("SIMULATION_REVIEW");
    expect(aiUsage.calls).toBe(1);
    expect(realtimeEvents).toContain("simulation:done");

    await new ApproveSimulationUseCase(deps()).execute(client, orderId);
    expect(orders.orders[0]!.status).toBe("SIMULATION_APPROVED");
  });

  it("quando o provider falha, marca FAILED, reverte o pedido e RELANÇA (BullMQ precisa ver a falha)", async () => {
    await new SendDesignUseCase(deps()).execute(artistActor, STUDIO, orderId, { imageUrl: "https://cdn/art.png" });
    await new ReviewDesignUseCase(deps()).execute(client, orderId, { approve: true });
    const { simulationId } = await new RequestSimulationUseCase(deps()).execute(client, orderId, {
      bodyPhotoUrl: "https://cdn/body.jpg",
      placement: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    });

    const failingProvider = { name: "fal", simulate: () => Promise.reject(new Error("Fal fora do ar")) };
    await expect(
      new ProcessSimulationUseCase({ ...deps(), provider: failingProvider }).execute(simulationId),
    ).rejects.toThrow("Fal fora do ar");

    expect(sims.sims[0]!.status).toBe("FAILED");
    expect(sims.sims[0]!.errorMessage).toBe("Fal fora do ar");
    expect(orders.orders[0]!.status).toBe("AWAITING_BODY_PHOTO");
    expect(realtimeEvents).toContain("simulation:failed");
  });

  it("processamento é idempotente", async () => {
    await new SendDesignUseCase(deps()).execute(artistActor, STUDIO, orderId, { imageUrl: "https://cdn/art.png" });
    await new ReviewDesignUseCase(deps()).execute(client, orderId, { approve: true });
    const { simulationId } = await new RequestSimulationUseCase(deps()).execute(client, orderId, {
      bodyPhotoUrl: "https://cdn/body.jpg",
      placement: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    });
    await new ProcessSimulationUseCase(deps()).execute(simulationId);
    await new ProcessSimulationUseCase(deps()).execute(simulationId); // no-op
    expect(aiUsage.calls).toBe(1);
  });

  it("solicitar mudanças volta para CHANGES_REQUESTED", async () => {
    await new SendDesignUseCase(deps()).execute(artistActor, STUDIO, orderId, { imageUrl: "https://cdn/art.png" });
    await new ReviewDesignUseCase(deps()).execute(client, orderId, { approve: false, feedback: "menor" });
    expect(orders.orders[0]!.status).toBe("CHANGES_REQUESTED");
  });

  it("rejeita placement fora dos limites", async () => {
    await new SendDesignUseCase(deps()).execute(artistActor, STUDIO, orderId, { imageUrl: "https://cdn/art.png" });
    await new ReviewDesignUseCase(deps()).execute(client, orderId, { approve: true });
    await expect(
      new RequestSimulationUseCase(deps()).execute(client, orderId, {
        bodyPhotoUrl: "https://cdn/body.jpg",
        placement: { x: 1.8, y: 0.5, scale: 1, rotation: 0 },
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

import { prisma, type Prisma } from "@inkvision/db";
import type {
  CreateSimulationData,
  Simulation,
  SimulationJobStatus,
  SimulationPlacement,
  SimulationRepository,
  SimulationVariants,
} from "@inkvision/core";

function toDomain(s: {
  id: string;
  orderId: string;
  studioId: string;
  designVersionId: string;
  designUrl: string;
  bodyPhotoUrl: string;
  composedImageUrl: string | null;
  placement: Prisma.JsonValue;
  variants: Prisma.JsonValue;
  provider: string;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
}): Simulation {
  return {
    id: s.id,
    orderId: s.orderId,
    studioId: s.studioId,
    designVersionId: s.designVersionId,
    designUrl: s.designUrl,
    bodyPhotoUrl: s.bodyPhotoUrl,
    composedImageUrl: s.composedImageUrl,
    placement: s.placement as unknown as SimulationPlacement,
    variants: (s.variants as unknown as SimulationVariants | null) ?? null,
    provider: s.provider,
    status: s.status as SimulationJobStatus,
    errorMessage: s.errorMessage,
    createdAt: s.createdAt,
  };
}

/** Simulation é order-scoped (sem RLS). Guarda studioId denormalizado. */
export class PrismaSimulationRepository implements SimulationRepository {
  async create(data: CreateSimulationData): Promise<Simulation> {
    const created = await prisma.simulation.create({
      data: {
        orderId: data.orderId,
        studioId: data.studioId,
        designVersionId: data.designVersionId,
        designUrl: data.designUrl,
        bodyPhotoUrl: data.bodyPhotoUrl,
        composedImageUrl: data.composedImageUrl ?? null,
        placement: data.placement as unknown as Prisma.InputJsonValue,
        provider: data.provider,
        status: "QUEUED",
      },
    });
    return toDomain(created);
  }

  async findById(id: string): Promise<Simulation | null> {
    const s = await prisma.simulation.findUnique({ where: { id } });
    return s ? toDomain(s) : null;
  }

  async getLatestForOrder(orderId: string): Promise<Simulation | null> {
    const s = await prisma.simulation.findFirst({ where: { orderId }, orderBy: { createdAt: "desc" } });
    return s ? toDomain(s) : null;
  }

  async markProcessing(id: string): Promise<void> {
    await prisma.simulation.update({ where: { id }, data: { status: "PROCESSING" } });
  }

  async markDone(id: string, variants: SimulationVariants, provider: string): Promise<Simulation> {
    const s = await prisma.simulation.update({
      where: { id },
      data: { status: "DONE", variants: variants as unknown as Prisma.InputJsonValue, provider },
    });
    return toDomain(s);
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    await prisma.simulation.update({ where: { id }, data: { status: "FAILED", errorMessage } });
  }
}

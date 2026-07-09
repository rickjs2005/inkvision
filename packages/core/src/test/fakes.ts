import type { StudioRole } from "@inkvision/shared";
import type {
  CreateStudioData,
  ListStudiosParams,
  Studio,
  StudioRepository,
  StudioStatus,
  UpdateStudioData,
} from "../application/ports/studio-repository";
import type { BasicUser, UserRepository } from "../application/ports/user-repository";
import type { AuditEntry, AuditLogger } from "../application/ports/audit-logger";
import type { EmailMessage, EmailService } from "../application/ports/email-service";

let seq = 0;
const id = (p: string) => `${p}_${(++seq).toString(36)}`;

export class InMemoryStudioRepo implements StudioRepository {
  studios: Studio[] = [];
  members: { studioId: string; userId: string; role: StudioRole }[] = [];

  async create(data: CreateStudioData): Promise<Studio> {
    const studio: Studio = {
      id: id("studio"),
      slug: data.slug,
      name: data.name,
      description: data.description ?? null,
      address: {},
      status: "PENDING",
      createdAt: new Date(0),
    };
    this.studios.push(studio);
    return studio;
  }
  async update(sid: string, data: UpdateStudioData): Promise<Studio> {
    const s = this.studios.find((x) => x.id === sid)!;
    Object.assign(s, data);
    return s;
  }
  async findById(sid: string) {
    return this.studios.find((x) => x.id === sid) ?? null;
  }
  async findBySlug(slug: string) {
    return this.studios.find((x) => x.slug === slug) ?? null;
  }
  async slugExists(slug: string) {
    return this.studios.some((x) => x.slug === slug);
  }
  async list(params: ListStudiosParams) {
    let items = this.studios;
    if (params.status) items = items.filter((s) => s.status === params.status);
    if (params.query) items = items.filter((s) => s.name.includes(params.query!));
    const total = items.length;
    return { items: items.slice(params.skip ?? 0, (params.skip ?? 0) + (params.take ?? 20)), total };
  }
  async setStatus(sid: string, status: StudioStatus) {
    const s = this.studios.find((x) => x.id === sid)!;
    s.status = status;
    return s;
  }
  async setStripeAccount(sid: string, accountId: string) {
    const s = this.studios.find((x) => x.id === sid)!;
    s.stripeAccountId = accountId;
    return s;
  }
  async delete(sid: string) {
    this.studios = this.studios.filter((x) => x.id !== sid);
  }
  async addMember(studioId: string, userId: string, role: StudioRole) {
    this.members.push({ studioId, userId, role });
  }
  async findPendingByOwner(userId: string) {
    const ownedIds = this.members.filter((m) => m.userId === userId && m.role === "OWNER").map((m) => m.studioId);
    return this.studios.find((s) => ownedIds.includes(s.id) && s.status === "PENDING") ?? null;
  }
}

export class InMemoryUserRepo implements UserRepository {
  constructor(private users: BasicUser[] = []) {}
  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async findById(uid: string) {
    return this.users.find((u) => u.id === uid) ?? null;
  }
}

export class InMemoryAudit implements AuditLogger {
  entries: AuditEntry[] = [];
  async log(entry: AuditEntry) {
    this.entries.push(entry);
  }
}

export class InMemoryEmailService implements EmailService {
  sent: EmailMessage[] = [];
  async send(message: EmailMessage) {
    this.sent.push(message);
  }
}

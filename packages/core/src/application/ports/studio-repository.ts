import type { StudioRole } from "@inkvision/shared";

export type StudioStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export interface StudioAddress {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

export interface Studio {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  address: StudioAddress;
  phone?: string | null;
  socials?: Record<string, string> | null;
  openingHours?: unknown;
  status: StudioStatus;
  stripeAccountId?: string | null;
  createdAt: Date;
}

export interface CreateStudioData {
  slug: string;
  name: string;
  description?: string | null;
}

export interface UpdateStudioData {
  name?: string;
  logoUrl?: string | null;
  description?: string | null;
  address?: StudioAddress;
  phone?: string | null;
  socials?: Record<string, string> | null;
  openingHours?: unknown;
}

export interface ListStudiosParams {
  status?: StudioStatus;
  query?: string;
  skip?: number;
  take?: number;
}

export interface StudioRepository {
  create(data: CreateStudioData): Promise<Studio>;
  update(id: string, data: UpdateStudioData): Promise<Studio>;
  findById(id: string): Promise<Studio | null>;
  findBySlug(slug: string): Promise<Studio | null>;
  slugExists(slug: string): Promise<boolean>;
  list(params: ListStudiosParams): Promise<{ items: Studio[]; total: number }>;
  setStatus(id: string, status: StudioStatus): Promise<Studio>;
  setStripeAccount(id: string, accountId: string): Promise<Studio>;
  delete(id: string): Promise<void>;
  addMember(studioId: string, userId: string, role: StudioRole): Promise<void>;
}

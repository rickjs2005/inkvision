import { parseInput } from "../../validate";
import type { Actor } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
import type { AvailabilityRule } from "../../../domain/scheduling";
import {
  addTimeOffSchema,
  setAvailabilitySchema,
  type AddTimeOffInput,
  type SetAvailabilityInput,
} from "../../dtos/schedule.dto";
import type { TimeOffItem } from "../../ports/schedule-repository";
import { assertCanManageArtist } from "../artist/deps";
import type { ScheduleUseCaseDeps } from "./deps";

type Deps = Pick<ScheduleUseCaseDeps, "schedule" | "artists">;

async function loadArtist(deps: Deps, actor: Actor, artistId: string) {
  const artist = await deps.artists.findById(artistId);
  if (!artist) throw new NotFoundError("Tatuador");
  assertCanManageArtist(actor, artist);
  return artist;
}

/** Tatuador/gerente define a disponibilidade semanal. */
export class SetAvailabilityUseCase {
  constructor(private readonly deps: Deps) {}
  async execute(actor: Actor, artistId: string, rawInput: SetAvailabilityInput): Promise<void> {
    await loadArtist(this.deps, actor, artistId);
    const { rules } = parseInput(setAvailabilitySchema, rawInput);
    await this.deps.schedule.setAvailability(artistId, rules as AvailabilityRule[]);
  }
}

export class GetAvailabilityUseCase {
  constructor(private readonly deps: Deps) {}
  async execute(actor: Actor, artistId: string): Promise<AvailabilityRule[]> {
    await loadArtist(this.deps, actor, artistId);
    return this.deps.schedule.getAvailability(artistId);
  }
}

export class AddTimeOffUseCase {
  constructor(private readonly deps: Deps) {}
  async execute(actor: Actor, artistId: string, rawInput: AddTimeOffInput): Promise<TimeOffItem> {
    await loadArtist(this.deps, actor, artistId);
    const input = parseInput(addTimeOffSchema, rawInput);
    return this.deps.schedule.addTimeOff(artistId, input);
  }
}

export class ListTimeOffUseCase {
  constructor(private readonly deps: Deps) {}
  async execute(actor: Actor, artistId: string): Promise<TimeOffItem[]> {
    await loadArtist(this.deps, actor, artistId);
    return this.deps.schedule.listTimeOff(artistId);
  }
}

export class RemoveTimeOffUseCase {
  constructor(private readonly deps: Deps) {}
  async execute(actor: Actor, artistId: string, id: string): Promise<void> {
    await loadArtist(this.deps, actor, artistId);
    await this.deps.schedule.removeTimeOff(artistId, id);
  }
}

import { prisma } from "@inkvision/db";
import type { BasicUser, UserRepository } from "@inkvision/core";

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<BasicUser | null> {
    const u = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true },
    });
    return u;
  }

  async findById(id: string): Promise<BasicUser | null> {
    const u = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });
    return u;
  }
}

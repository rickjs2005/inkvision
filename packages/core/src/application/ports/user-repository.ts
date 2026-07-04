export interface BasicUser {
  id: string;
  name: string;
  email: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<BasicUser | null>;
  findById(id: string): Promise<BasicUser | null>;
}

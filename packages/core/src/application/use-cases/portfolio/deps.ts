import type { ArtistRepository } from "../../ports/artist-repository";
import type { PortfolioRepository } from "../../ports/portfolio-repository";
import type { StyleRepository } from "../../ports/style-repository";
import type { AuditLogger } from "../../ports/audit-logger";

export interface PortfolioUseCaseDeps {
  portfolio: PortfolioRepository;
  artists: Pick<ArtistRepository, "findById">;
  styles: Pick<StyleRepository, "countByIds">;
  audit: AuditLogger;
}

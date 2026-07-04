export interface Style {
  id: string;
  slug: string;
  name: string;
}

export interface StyleRepository {
  listAll(): Promise<Style[]>;
  /** Retorna quantos dos ids existem — usado para validar seleção de estilos. */
  countByIds(ids: string[]): Promise<number>;
}

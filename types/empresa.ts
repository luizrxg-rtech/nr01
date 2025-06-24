interface Empresa {
  id: string;
  razao_social: string;
  cnpj: string;
  nome_fantasia: string;
  telefone: string;
  email: string;
  celular: string;
  responsavel_legal: string;
  cpf_responsavel: string;
  nome_tecnico: string;
  cpf_tecnico: string;
  mte: string;
  user_id?: string; // nullable
  created_at?: Timestamp; // nullable
  updated_at?: Timestamp; // nullable
}

type CreateEmpresa = Omit<Empresa, 'id' | 'created_at' | 'updated_at'>;

type UpdateEmpresa = Partial<Omit<Empresa, 'id'>> & { id: string };
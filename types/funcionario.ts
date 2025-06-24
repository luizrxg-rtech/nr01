import {Empresa} from "@/lib/supabase";

interface Funcionario {
  id: string;
  empresa_id: string;
  nome: string;
  cargo: string;
  setor: string;
  cpf: string;
  email: string;
  status: string;
  created_at?: Timestamp; // nullable
  updated_at?: Timestamp; // nullable
}

type CreateFuncionario = Omit<Funcionario, 'id' | 'created_at' | 'updated_at'>;

type UpdateFuncionario = Partial<Omit<Funcionario, 'id'>> & { id: string };

interface FuncionarioComEmpresa extends Funcionario {
  empresa: Empresa;
}

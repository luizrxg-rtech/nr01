import {Pergunta} from "@/lib/supabase";

interface Formulario {
  id: string;
  empresa_id: string;
  nome: string;
  status: string;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

type CreateFormulario = Omit<Formulario, 'id' | 'created_at' | 'updated_at'>;

type UpdateFormulario = Partial<Omit<Formulario, 'id'>> & { id: string };

interface FormularioComPerguntas extends Formulario {
  perguntas: Pergunta[];
}
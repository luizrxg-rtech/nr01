import {Formulario, Funcionario, Pergunta} from "@/lib/supabase";

interface Resposta {
  id: string;
  formulario_id: string;
  funcionario_id: string;
  pergunta_id: string;
  valor: number;
  created_at?: Timestamp; // nullable
}

interface RespostaCompleta extends Resposta {
  funcionario: Funcionario;
  pergunta: Pergunta;
  formulario: Formulario;
}

type CreateResposta = Omit<Resposta, 'id' | 'created_at'>;

type UpdateResposta = Partial<Omit<Resposta, 'id'>> & { id: string };
interface Pergunta {
  id: string;
  formulario_id: string;
  texto: string;
  ordem: number;
  created_at?: Timestamp; // nullable
}

type CreatePergunta = Omit<Pergunta, 'id' | 'created_at'>;

type UpdatePergunta = Partial<Omit<Pergunta, 'id'>> & { id: string };


import {Database, type Pergunta, supabase} from "@/lib/supabase";

export const perguntaService = {
  async create(pergunta: Database['public']['Tables']['perguntas']['Insert']) {
    const { data, error } = await supabase
      .from('perguntas')
      .insert(pergunta)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createMany(perguntas: Database['public']['Tables']['perguntas']['Insert'][]) {
    const { data, error } = await supabase
      .from('perguntas')
      .insert(perguntas)
      .select();

    if (error) throw error;
    return data;
  },

  async getByFormularioId(formularioId: string): Promise<Pergunta[]> {
    const { data, error } = await supabase
      .from('perguntas')
      .select('*')
      .eq('formulario_id', formularioId)
      .order('ordem');

    if (error) throw error;
    return data || [];
  },

  async update(id: string, updates: Database['public']['Tables']['perguntas']['Update']) {
    const { data, error } = await supabase
      .from('perguntas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('perguntas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteByFormularioId(formularioId: string) {
    const { error } = await supabase
      .from('perguntas')
      .delete()
      .eq('formulario_id', formularioId);

    if (error) throw error;
  },
};
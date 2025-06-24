import {Database, type Formulario, supabase} from "@/lib/supabase";

export const formularioService = {
  async create(formulario: Database['public']['Tables']['formularios']['Insert']) {
    const { data, error } = await supabase
      .from('formularios')
      .insert(formulario)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAll(): Promise<Formulario[]> {
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByEmpresaId(empresaId: string): Promise<Formulario[]> {
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Formulario | null> {
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async update(id: string, updates: Database['public']['Tables']['formularios']['Update']) {
    const { data, error } = await supabase
      .from('formularios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('formularios')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
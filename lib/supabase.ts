import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wmjzlvchlvfvhlvzggpo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtanpsdmNobHZmdmhsdnpnZ3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTEzMzMsImV4cCI6MjA2NjI2NzMzM30.eROeV0l-SziEVyTlZ821t1c8rhCbT1fjCFyHp20PDK4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos TypeScript para o banco de dados
export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
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
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          razao_social?: string;
          cnpj?: string;
          nome_fantasia?: string;
          telefone?: string;
          email?: string;
          celular?: string;
          responsavel_legal?: string;
          cpf_responsavel?: string;
          nome_tecnico?: string;
          cpf_tecnico?: string;
          mte?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      funcionarios: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          cargo: string;
          cpf: string;
          email: string;
          status: 'ativo' | 'inativo';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          cargo: string;
          cpf: string;
          email: string;
          status?: 'ativo' | 'inativo';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          cargo?: string;
          cpf?: string;
          email?: string;
          status?: 'ativo' | 'inativo';
          created_at?: string;
          updated_at?: string;
        };
      };
      formularios: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          status: 'ativo' | 'inativo';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          status?: 'ativo' | 'inativo';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          status?: 'ativo' | 'inativo';
          created_at?: string;
          updated_at?: string;
        };
      };
      perguntas: {
        Row: {
          id: string;
          formulario_id: string;
          texto: string;
          ordem: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          formulario_id: string;
          texto: string;
          ordem?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          formulario_id?: string;
          texto?: string;
          ordem?: number;
          created_at?: string;
        };
      };
      respostas: {
        Row: {
          id: string;
          formulario_id: string;
          funcionario_id: string;
          pergunta_id: string;
          valor: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          formulario_id: string;
          funcionario_id: string;
          pergunta_id: string;
          valor: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          formulario_id?: string;
          funcionario_id?: string;
          pergunta_id?: string;
          valor?: number;
          created_at?: string;
        };
      };
    };
  };
}

export type Empresa = Database['public']['Tables']['empresas']['Row'];
export type Funcionario = Database['public']['Tables']['funcionarios']['Row'];
export type Formulario = Database['public']['Tables']['formularios']['Row'];
export type Pergunta = Database['public']['Tables']['perguntas']['Row'];
export type Resposta = Database['public']['Tables']['respostas']['Row'];
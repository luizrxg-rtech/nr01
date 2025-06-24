/*
  # Schema inicial do sistema de controle de formulários

  1. Novas Tabelas
    - `empresas`
      - `id` (uuid, primary key)
      - `razao_social` (text)
      - `cnpj` (text, unique)
      - `nome_fantasia` (text)
      - `telefone` (text)
      - `email` (text)
      - `celular` (text)
      - `responsavel_legal` (text)
      - `cpf_responsavel` (text)
      - `nome_tecnico` (text)
      - `cpf_tecnico` (text)
      - `mte` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `funcionarios`
      - `id` (uuid, primary key)
      - `empresa_id` (uuid, foreign key)
      - `nome` (text)
      - `cargo` (text)
      - `setor` (text)
      - `cpf` (text)
      - `email` (text)
      - `status` (text, default 'ativo')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `formularios`
      - `id` (uuid, primary key)
      - `empresa_id` (uuid, foreign key)
      - `nome` (text)
      - `status` (text, default 'ativo')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `perguntas`
      - `id` (uuid, primary key)
      - `formulario_id` (uuid, foreign key)
      - `texto` (text)
      - `ordem` (integer)
      - `created_at` (timestamp)

    - `respostas`
      - `id` (uuid, primary key)
      - `formulario_id` (uuid, foreign key)
      - `funcionario_id` (uuid, foreign key)
      - `pergunta_id` (uuid, foreign key)
      - `valor` (integer, 1-5)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados acessarem apenas dados de suas empresas
*/

-- Criar tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  cnpj text UNIQUE NOT NULL,
  nome_fantasia text NOT NULL,
  telefone text NOT NULL,
  email text NOT NULL,
  celular text NOT NULL,
  responsavel_legal text NOT NULL,
  cpf_responsavel text NOT NULL,
  nome_tecnico text NOT NULL,
  cpf_tecnico text NOT NULL,
  mte text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  cargo text NOT NULL,
  setor text NOT NULL,
  cpf text NOT NULL,
  email text NOT NULL,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de formulários
CREATE TABLE IF NOT EXISTS formularios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de perguntas
CREATE TABLE IF NOT EXISTS perguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id uuid REFERENCES formularios(id) ON DELETE CASCADE NOT NULL,
  texto text NOT NULL,
  ordem integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de respostas
CREATE TABLE IF NOT EXISTS respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id uuid REFERENCES formularios(id) ON DELETE CASCADE NOT NULL,
  funcionario_id uuid REFERENCES funcionarios(id) ON DELETE CASCADE NOT NULL,
  pergunta_id uuid REFERENCES perguntas(id) ON DELETE CASCADE NOT NULL,
  valor integer NOT NULL CHECK (valor >= 1 AND valor <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(funcionario_id, pergunta_id)
);

-- Habilitar RLS
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;
ALTER TABLE perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;

-- Políticas para empresas
CREATE POLICY "Usuários podem ver suas próprias empresas"
  ON empresas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias empresas"
  ON empresas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias empresas"
  ON empresas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para funcionários
CREATE POLICY "Usuários podem ver funcionários de suas empresas"
  ON funcionarios FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM empresas 
      WHERE empresas.id = funcionarios.empresa_id 
      AND empresas.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir funcionários em suas empresas"
  ON funcionarios FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM empresas 
      WHERE empresas.id = funcionarios.empresa_id 
      AND empresas.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar funcionários de suas empresas"
  ON funcionarios FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM empresas 
      WHERE empresas.id = funcionarios.empresa_id 
      AND empresas.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar funcionários de suas empresas"
  ON funcionarios FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM empresas 
      WHERE empresas.id = funcionarios.empresa_id 
      AND empresas.user_id = auth.uid()
    )
  );

-- Políticas para formulários
CREATE POLICY "Usuários podem ver formulários de suas empresas"
  ON formularios FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM empresas 
      WHERE empresas.id = formularios.empresa_id 
      AND empresas.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir formulários em suas empresas"
  ON formularios FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM empresas 
      WHERE empresas.id = formularios.empresa_id 
      AND empresas.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar formulários de suas empresas"
  ON formularios FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM empresas 
      WHERE empresas.id = formularios.empresa_id 
      AND empresas.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar formulários de suas empresas"
  ON formularios FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM empresas 
      WHERE empresas.id = formularios.empresa_id 
      AND empresas.user_id = auth.uid()
    )
  );

-- Políticas para perguntas
CREATE POLICY "Usuários podem ver perguntas de formulários de suas empresas"
  ON perguntas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM formularios f
      JOIN empresas e ON e.id = f.empresa_id
      WHERE f.id = perguntas.formulario_id 
      AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir perguntas em formulários de suas empresas"
  ON perguntas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM formularios f
      JOIN empresas e ON e.id = f.empresa_id
      WHERE f.id = perguntas.formulario_id 
      AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar perguntas de formulários de suas empresas"
  ON perguntas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM formularios f
      JOIN empresas e ON e.id = f.empresa_id
      WHERE f.id = perguntas.formulario_id 
      AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar perguntas de formulários de suas empresas"
  ON perguntas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM formularios f
      JOIN empresas e ON e.id = f.empresa_id
      WHERE f.id = perguntas.formulario_id 
      AND e.user_id = auth.uid()
    )
  );

-- Políticas para respostas
CREATE POLICY "Usuários podem ver respostas de formulários de suas empresas"
  ON respostas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM formularios f
      JOIN empresas e ON e.id = f.empresa_id
      WHERE f.id = respostas.formulario_id 
      AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Funcionários podem inserir suas próprias respostas"
  ON respostas FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Permitir inserção para funcionários respondendo formulários

CREATE POLICY "Usuários podem ver todas as respostas de seus formulários"
  ON respostas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM formularios f
      JOIN empresas e ON e.id = f.empresa_id
      WHERE f.id = respostas.formulario_id 
      AND e.user_id = auth.uid()
    )
  );

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_funcionarios_empresa_id ON funcionarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_formularios_empresa_id ON formularios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_perguntas_formulario_id ON perguntas(formulario_id);
CREATE INDEX IF NOT EXISTS idx_respostas_formulario_id ON respostas(formulario_id);
CREATE INDEX IF NOT EXISTS idx_respostas_funcionario_id ON respostas(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_respostas_pergunta_id ON respostas(pergunta_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON funcionarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formularios_updated_at BEFORE UPDATE ON formularios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
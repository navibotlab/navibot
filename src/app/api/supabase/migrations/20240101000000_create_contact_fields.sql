-- Criar tabela para campos de contato
CREATE TABLE IF NOT EXISTS contact_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  required BOOLEAN DEFAULT FALSE,
  options TEXT[] DEFAULT NULL,
  placeholder TEXT DEFAULT NULL,
  default_value TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar comentários à tabela
COMMENT ON TABLE contact_fields IS 'Campos personalizados para contatos';
COMMENT ON COLUMN contact_fields.id IS 'ID único do campo';
COMMENT ON COLUMN contact_fields.name IS 'Nome do campo';
COMMENT ON COLUMN contact_fields.type IS 'Tipo do campo (text, number, date, select, checkbox, textarea)';
COMMENT ON COLUMN contact_fields.required IS 'Indica se o campo é obrigatório';
COMMENT ON COLUMN contact_fields.options IS 'Lista de opções para campos do tipo select';
COMMENT ON COLUMN contact_fields.placeholder IS 'Texto de placeholder para o campo';
COMMENT ON COLUMN contact_fields.default_value IS 'Valor padrão para o campo';
COMMENT ON COLUMN contact_fields.description IS 'Descrição do campo';
COMMENT ON COLUMN contact_fields.order IS 'Ordem de exibição do campo';
COMMENT ON COLUMN contact_fields.created_at IS 'Data de criação do campo';
COMMENT ON COLUMN contact_fields.updated_at IS 'Data da última atualização do campo';

-- Criar função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o timestamp de updated_at
CREATE TRIGGER update_contact_fields_updated_at
BEFORE UPDATE ON contact_fields
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 
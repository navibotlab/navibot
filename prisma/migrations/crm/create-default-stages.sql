-- Script para adicionar estágios padrão a todas as workspaces existentes
-- Executar diretamente no banco de dados via pgAdmin

-- Função para criar estágios padrão para um workspace específico
CREATE OR REPLACE FUNCTION create_default_stages_for_workspace(workspace_id TEXT) 
RETURNS VOID AS $$
DECLARE
    stage_exists INTEGER;
BEGIN
    -- Verificar se já existem estágios para este workspace
    SELECT COUNT(*) INTO stage_exists FROM stages WHERE "workspaceId" = workspace_id;
    
    -- Se não existirem estágios, criar os padrão
    IF stage_exists = 0 THEN
        -- Entrada do Lead
        INSERT INTO stages (id, name, description, color, "order", "workspaceId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Entrada do Lead', 'Leads recém-adicionados ao sistema', '#3498db', 1, workspace_id, NOW(), NOW());
        
        -- Prospecção
        INSERT INTO stages (id, name, description, color, "order", "workspaceId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Prospecção', 'Leads em processo de prospecção', '#f39c12', 2, workspace_id, NOW(), NOW());
        
        -- Conectados
        INSERT INTO stages (id, name, description, color, "order", "workspaceId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Conectados', 'Leads que já estabeleceram contato', '#9b59b6', 3, workspace_id, NOW(), NOW());
        
        -- Desinteressados
        INSERT INTO stages (id, name, description, color, "order", "workspaceId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Desinteressados', 'Leads que demonstraram desinteresse', '#e74c3c', 4, workspace_id, NOW(), NOW());
        
        -- Sem Contato
        INSERT INTO stages (id, name, description, color, "order", "workspaceId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Sem Contato', 'Leads que não responderam às tentativas de contato', '#7f8c8d', 5, workspace_id, NOW(), NOW());
        
        -- Aguardando
        INSERT INTO stages (id, name, description, color, "order", "workspaceId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Aguardando', 'Leads que estão aguardando algum processamento ou decisão', '#f1c40f', 6, workspace_id, NOW(), NOW());
        
        -- Fechado
        INSERT INTO stages (id, name, description, color, "order", "workspaceId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Fechado', 'Negócios finalizados (ganhos ou perdidos)', '#2ecc71', 7, workspace_id, NOW(), NOW());
        
        RAISE NOTICE 'Estágios padrão criados para workspace %', workspace_id;
    ELSE
        RAISE NOTICE 'Workspace % já possui estágios. Nenhum estágio criado.', workspace_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Executar a função para cada workspace existente
DO $$
DECLARE
    workspace_record RECORD;
BEGIN
    FOR workspace_record IN SELECT id, name FROM workspaces LOOP
        RAISE NOTICE 'Processando workspace: % (ID: %)', workspace_record.name, workspace_record.id;
        PERFORM create_default_stages_for_workspace(workspace_record.id);
    END LOOP;
END;
$$;

-- Função para executar automaticamente quando um novo workspace for criado
CREATE OR REPLACE FUNCTION trigger_create_default_stages()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_default_stages_for_workspace(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger para novas workspaces
DROP TRIGGER IF EXISTS create_default_stages_trigger ON workspaces;
CREATE TRIGGER create_default_stages_trigger
AFTER INSERT ON workspaces
FOR EACH ROW
EXECUTE FUNCTION trigger_create_default_stages(); 
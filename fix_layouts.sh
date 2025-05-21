#!/bin/bash

# Encontrar todos os arquivos de layout com o padrão problemático
echo "Procurando arquivos com problemas de sintaxe JSX..."

FILES=$(grep -r 'return *(' --include="*.tsx" src/ | grep -B 1 '<\s*{/\*' | grep "\.tsx:" | cut -d':' -f1 | sort | uniq)

if [ -z "$FILES" ]; then
  echo "Usando método alternativo de busca..."
  FILES=$(find src -name "*.tsx" -type f -exec grep -l "return *(" {} \; | xargs grep -l "<[[:space:]]*$" 2>/dev/null)
fi

if [ -z "$FILES" ]; then
  echo "Não foram encontrados arquivos com o padrão problemático."
  exit 0
fi

echo "Arquivos encontrados com possíveis problemas:"
echo "$FILES"
echo ""

# Perguntar se deseja prosseguir com a correção
echo "Deseja corrigir estes arquivos? (s/n)"
read CONFIRM

if [ "$CONFIRM" != "s" ]; then
  echo "Operação cancelada."
  exit 0
fi

# Processar cada arquivo
for FILE in $FILES; do
  echo "Processando: $FILE"
  
  # Fazer backup do arquivo original
  cp "$FILE" "${FILE}.bak"
  
  # Corrigir o padrão problemático
  # Substitui 'return (<' seguido por linha com comentário/meta
  sed -i 's/return *(\s*<\s*$/return (/g' "$FILE"
  sed -i 's/^(\s*<\s*$/<div>/g' "$FILE"
  sed -i 's/<\(\s*{\/\*/<div>\n        {\/\*/g' "$FILE"
  
  echo "Arquivo corrigido: $FILE"
done

echo "Processo de correção concluído. Backups foram criados com extensão .bak"
EOL
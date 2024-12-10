#!/bin/bash

echo "🔍 Diagnóstico do Ambiente"

echo "1. Processos Node em execução:"
ps aux | grep node

echo -e "\n2. Portas em uso:"
sudo netstat -tuln | grep 3000

echo -e "\n3. Matando processos Node:"
pkill -9 node

echo -e "\n4. Verificando variáveis de ambiente:"
env | grep -E "PORT|NODE_ENV"

echo -e "\n5. Verificando versões:"
node --version
npm --version
ts-node --version

echo -e "\n6. Listando dependências:"
npm list --depth=1

#!/bin/bash

# Definir cores para saída de terminal
VERDE='\033[0;32m'
AMARELO='\033[1;33m'
VERMELHO='\033[0;31m'
RESET='\033[0m'

# Função para exibir mensagens formatadas
mensagem() {
    echo -e "${VERDE}[FINANCE-API]${RESET} $1"
}

erro() {
    echo -e "${VERMELHO}[ERRO]${RESET} $1"
}

aviso() {
    echo -e "${AMARELO}[AVISO]${RESET} $1"
}

# Verificar dependências
verificar_dependencias() {
    mensagem "Verificando dependências..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        erro "Node.js não encontrado. Por favor, instale o Node.js versão 14 ou superior."
        exit 1
    fi

    # Verificar npm
    if ! command -v npm &> /dev/null; then
        erro "npm não encontrado. Por favor, instale o npm."
        exit 1
    fi

    # Verificar PostgreSQL
    if ! command -v psql &> /dev/null; then
        aviso "PostgreSQL não encontrado. Certifique-se de instalar e configurar antes de iniciar a aplicação."
    fi

    mensagem "Todas as dependências básicas estão presentes."
}

# Instalar dependências do projeto
instalar_dependencias() {
    mensagem "Instalando dependências do projeto..."
    npm install
    
    if [ $? -eq 0 ]; then
        mensagem "Dependências instaladas com sucesso!"
    else
        erro "Falha na instalação das dependências."
        exit 1
    fi
}

# Configurar banco de dados
configurar_banco() {
    mensagem "Configurando banco de dados..."
    
    # Verificar se .env existe
    if [ ! -f .env ]; then
        erro "Arquivo .env não encontrado. Por favor, configure suas variáveis de ambiente."
        exit 1
    fi

    # Executar migrations
    npm run db:migrate
    
    if [ $? -eq 0 ]; then
        mensagem "Banco de dados configurado com sucesso!"
    else
        erro "Falha na configuração do banco de dados."
        exit 1
    fi
}

# Iniciar aplicação em desenvolvimento
dev() {
    verificar_dependencias
    instalar_dependencias
    configurar_banco
    
    mensagem "Iniciando servidor em modo de desenvolvimento..."
    npm run dev
}

# Iniciar aplicação em produção
start() {
    verificar_dependencias
    
    mensagem "Iniciando servidor em modo de produção..."
    npm start
}

# Executar testes
testar() {
    mensagem "Executando testes..."
    npm test
}

# Limpar logs e dependências
limpar() {
    mensagem "Limpando logs e dependências..."
    
    # Limpar logs
    rm -rf logs/*
    
    # Limpar dependências
    rm -rf node_modules
    rm -f package-lock.json
    
    mensagem "Limpeza concluída."
}

# Menu de ajuda
ajuda() {
    echo "Uso: ./comandos.sh [COMANDO]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  dev       - Iniciar servidor em modo de desenvolvimento"
    echo "  start     - Iniciar servidor em modo de produção"
    echo "  test      - Executar testes"
    echo "  db        - Configurar banco de dados"
    echo "  deps      - Instalar dependências"
    echo "  clean     - Limpar logs e dependências"
    echo "  help      - Exibir esta mensagem de ajuda"
}

# Processar comando
case "$1" in
    "dev")
        dev
        ;;
    "start")
        start
        ;;
    "test")
        testar
        ;;
    "db")
        configurar_banco
        ;;
    "deps")
        instalar_dependencias
        ;;
    "clean")
        limpar
        ;;
    "help" | *)
        ajuda
        ;;
esac

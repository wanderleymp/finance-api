#!/bin/bash

# Definir cores para saída de terminal
VERDE='\033[0;32m'
VERMELHO='\033[0;31m'
RESET='\033[0m'

# Função de log
log() {
    echo -e "${VERDE}[DEPLOY]${RESET} $1"
}

# Função de erro
erro() {
    echo -e "${VERMELHO}[ERRO]${RESET} $1"
    exit 1
}

# Obter branch atual
BRANCH_ATUAL=$(git rev-parse --abbrev-ref HEAD)

# Verificar se não está na main
verificar_branch() {
    if [[ "$BRANCH_ATUAL" == "main" || "$BRANCH_ATUAL" == "master" ]]; then
        erro "Não pode fazer deploy diretamente da branch main/master. Use uma branch de feature."
    fi
}

# Atualizar repositório local
atualizar_repositorio() {
    log "Atualizando repositório local..."
    git fetch origin
    git pull origin "$BRANCH_ATUAL"
}

# Enviar branch atual para remoto
enviar_branch() {
    log "Enviando branch ${BRANCH_ATUAL} para o repositório remoto..."
    git push -u origin "$BRANCH_ATUAL"
}

# Fazer merge para main
merge_main() {
    log "Fazendo merge da branch ${BRANCH_ATUAL} para main..."
    
    # Trocar para main
    git checkout main
    
    # Atualizar main
    git pull origin main
    
    # Fazer merge
    git merge "$BRANCH_ATUAL"
    
    # Enviar merge para remoto
    git push origin main
}

# Construir imagem Docker
construir_docker() {
    log "Construindo imagem Docker..."
    npm run docker:build
}

# Fazer push da imagem Docker
push_docker() {
    log "Fazendo push da imagem Docker..."
    docker push wanderleymp/finance-api:1.0.3
}

# Atualizar versão após deploy bem-sucedido
atualizar_versao() {
    log "Atualizando versão no package.json..."
    npm run release
}

# Função principal de deploy
main() {
    verificar_branch
    atualizar_repositorio
    enviar_branch
    merge_main
    construir_docker
    push_docker
    atualizar_versao

    log "Deploy concluído com sucesso! 🚀"
}

# Executar deploy
main

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

# Atualizar CHANGELOG
atualizar_changelog() {
    log "Atualizando CHANGELOG.md..."
    
    # Obter a versão atual
    VERSAO_ATUAL=$(node -p "require('./package.json').version")
    DATA_ATUAL=$(date +%Y-%m-%d)
    
    # Adicionar nova entrada no CHANGELOG
    sed -i '' "1,/## \[Não Lançado\]/c\## [Não Lançado]\n\n## [${VERSAO_ATUAL}] - ${DATA_ATUAL}\n### Adicionado\n- Deploy da versão ${VERSAO_ATUAL}\n" CHANGELOG.md
}

# Commitar alterações pendentes
commitar_alteracoes() {
    log "Commitando alterações pendentes..."
    git add .
    git commit -m "Preparando para deploy da versão $(node -p "require('./package.json').version")" || true
}

# Atualizar repositório online
atualizar_repositorio() {
    log "Atualizando repositório online..."
    git push origin HEAD
}

# Atualizar branches develop e main
atualizar_branches() {
    log "Atualizando branches develop e main..."
    
    # Atualizar main
    git checkout main
    git pull origin main
    git merge --no-ff HEAD@{1}
    git push origin main
    
    # Atualizar develop
    git checkout develop
    git pull origin develop
    git merge --no-ff main
    git push origin develop
    
    # Voltar para branch original
    git checkout HEAD@{2}
}

# Construir e atualizar imagem Docker
atualizar_docker() {
    log "Atualizando imagem Docker..."
    git checkout main
    npm run docker:build:latest
    docker push wanderleymp/finance-api:latest
}

# Criar nova versão
criar_nova_versao() {
    log "Criando nova versão..."
    
    # Incrementar versão patch
    npm version patch
    
    # Capturar nova versão
    NOVA_VERSAO=$(node -p "require('./package.json').version")
    
    # Criar nova branch de release
    git checkout -b "release/v${NOVA_VERSAO}"
    git push -u origin "release/v${NOVA_VERSAO}"
}

# Função principal de deploy
main() {
    atualizar_changelog
    commitar_alteracoes
    atualizar_repositorio
    atualizar_branches
    atualizar_docker
    criar_nova_versao

    log "Deploy concluído com sucesso! 🚀"
}

# Executar deploy
main

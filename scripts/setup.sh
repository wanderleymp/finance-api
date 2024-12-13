#!/bin/bash

# Script de inicialização e configuração do ambiente para Finance API

# Definir variáveis
BACKUP_DIR="/var/backups/finance-api"
LOGS_DIR="/var/log/finance-api"
CONFIG_DIR="/etc/finance-api"

# Função para criar diretórios necessários
create_directories() {
    echo "🔧 Criando diretórios necessários..."
    
    # Diretórios de backup
    mkdir -p "$BACKUP_DIR"
    chmod 755 "$BACKUP_DIR"
    chown postgres:postgres "$BACKUP_DIR"
    
    # Diretórios de logs
    mkdir -p "$LOGS_DIR"
    chmod 755 "$LOGS_DIR"
    
    # Diretórios de configuração
    mkdir -p "$CONFIG_DIR"
    chmod 755 "$CONFIG_DIR"
}

# Função para configurar limpeza de backups
setup_backup_cleanup() {
    echo "🧹 Configurando limpeza automática de backups..."
    
    # Criar script de limpeza
    CLEANUP_SCRIPT="$BACKUP_DIR/clean_backups.sh"
    
    cat > "$CLEANUP_SCRIPT" << EOL
#!/bin/bash

# Diretório de backups
BACKUP_DIR="$BACKUP_DIR"

# Número de dias para manter backups
DAYS_TO_KEEP=30

# Limpar backups com mais de 30 dias
find "\$BACKUP_DIR" -type f -name "*.sql" -mtime +\$DAYS_TO_KEEP -delete

# Registrar limpeza em log
echo "Backups antigos removidos. Mantidos backups dos últimos \$DAYS_TO_KEEP dias." >> "\$BACKUP_DIR/backup_cleanup.log"
EOL

    chmod +x "$CLEANUP_SCRIPT"
    
    # Adicionar tarefa ao crontab
    (crontab -l 2>/dev/null; echo "0 0 * * * $CLEANUP_SCRIPT") | crontab -
}

# Função para verificar dependências
check_dependencies() {
    echo "🔍 Verificando dependências..."
    
    # Lista de dependências necessárias
    DEPENDENCIES=("postgresql" "pg_dump" "node" "npm")
    
    for dep in "${DEPENDENCIES[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            echo "❌ Dependência não encontrada: $dep"
            exit 1
        fi
    done
}

# Função principal
main() {
    echo "🚀 Inicializando Finance API..."
    
    # Verificar e instalar dependências
    check_dependencies
    
    # Criar diretórios
    create_directories
    
    # Configurar limpeza de backups
    setup_backup_cleanup
    
    echo "✅ Configuração concluída com sucesso!"
}

# Executar script
main

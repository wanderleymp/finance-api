#!/bin/bash

# Caminho do flag de inicialização
INIT_FLAG="/var/lib/finance-api/initialized"

# Verificar se já foi inicializado
if [ -f "$INIT_FLAG" ]; then
    echo "🚫 Sistema já foi inicializado anteriormente. Saindo..."
    exit 0
fi

# Criar diretórios necessários
mkdir -p /var/backups/finance-api
mkdir -p /var/log/finance-api
mkdir -p /etc/finance-api
mkdir -p /var/lib/finance-api

# Definir permissões
chmod 755 /var/backups/finance-api
chmod 755 /var/log/finance-api
chmod 755 /etc/finance-api
chmod 755 /var/lib/finance-api

# Definir proprietário para postgres (para backups de banco)
chown postgres:postgres /var/backups/finance-api

# Criar script de limpeza de backups
cat > /var/backups/finance-api/clean_backups.sh << EOL
#!/bin/bash
BACKUP_DIR="/var/backups/finance-api"
DAYS_TO_KEEP=30
find "\$BACKUP_DIR" -type f -name "*.sql" -mtime +\$DAYS_TO_KEEP -delete
echo "Backups antigos removidos. Mantidos backups dos últimos \$DAYS_TO_KEEP dias." >> "\$BACKUP_DIR/backup_cleanup.log"
EOL

chmod +x /var/backups/finance-api/clean_backups.sh

# Adicionar tarefa de limpeza ao crontab
(crontab -l 2>/dev/null; echo "0 0 * * * /var/backups/finance-api/clean_backups.sh") | crontab -

# Executar script de setup do banco de dados
PGPASSWORD=$(echo $SYSTEM_DATABASE_URL | cut -d':' -f2 | cut -d'@' -f1) \
psql -h $(echo $SYSTEM_DATABASE_URL | cut -d'@' -f2 | cut -d':' -f1) \
     -p $(echo $SYSTEM_DATABASE_URL | cut -d':' -f3 | cut -d'/' -f1) \
     -U $(echo $SYSTEM_DATABASE_URL | cut -d'/' -f3 | cut -d':' -f1) \
     -d $(echo $SYSTEM_DATABASE_URL | cut -d'/' -f4 | cut -d'?' -f1) \
     -c "DROP TABLE IF EXISTS system_config CASCADE; DROP TABLE IF EXISTS migrations CASCADE;"

/root/finance-api/src/scripts/setupDatabase.sh

# Criar flag de inicialização
mkdir -p "$(dirname "$INIT_FLAG")"
touch "$INIT_FLAG"

echo "✅ Configuração inicial concluída com sucesso!"

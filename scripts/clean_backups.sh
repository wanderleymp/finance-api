#!/bin/bash

# Diretório de backups
BACKUP_DIR="/var/backups/finance-api"

# Número de dias para manter backups
DAYS_TO_KEEP=30

# Limpar backups com mais de 30 dias
find "$BACKUP_DIR" -type f -name "*.sql" -mtime +$DAYS_TO_KEEP -delete

# Opcional: Registrar limpeza em log
echo "Backups antigos removidos. Mantidos backups dos últimos $DAYS_TO_KEEP dias." >> "$BACKUP_DIR/backup_cleanup.log"

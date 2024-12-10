#!/bin/bash

# Função para liberar a porta
free_port() {
    local PORT=$1
    echo "Tentando liberar porta $PORT..."
    
    # Encontrar o PID usando a porta
    PID=$(sudo lsof -t -i:$PORT)
    
    if [ ! -z "$PID" ]; then
        echo "Processo encontrado na porta $PORT. PID: $PID"
        sudo kill -9 $PID
        echo "Processo $PID finalizado."
    else
        echo "Nenhum processo encontrado na porta $PORT."
    fi
}

# Liberar porta 3000
free_port 3000

echo "Porta 3000 liberada."

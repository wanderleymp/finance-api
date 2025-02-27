#!/bin/bash

# Desabilitar verificação de certificado SSL
export CURL_INSECURE="-k"

# Token de autenticação
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImlhdCI6MTc0MDY1MjczMiwiZXhwIjoxNzQwNjY3MTMyfQ.Nv09Q-6_bRqy4QmGcHC2rJJQfdK2fmN9dWEzZwQ_rP0"

# Gerar chave WebSocket aleatória
WEBSOCKET_KEY=$(openssl rand -base64 16)

# Comando curl detalhado
curl $CURL_INSECURE -v \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: dev.agilefinance.com.br" \
  -H "Origin: https://dev.agilefinance.com.br" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: $WEBSOCKET_KEY" \
  -H "Sec-WebSocket-Extensions: permessage-deflate; client_max_window_bits" \
  https://dev.agilefinance.com.br/chats 2>&1 | tee /root/finance-api/websocket-curl-full-test.log

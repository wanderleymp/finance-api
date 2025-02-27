#!/bin/bash

# Desabilitar verificação de certificado SSL
export CURL_INSECURE="-k"

curl $CURL_INSECURE -v \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: dev.agilefinance.com.br" \
  -H "Origin: https://dev.agilefinance.com.br" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImlhdCI6MTc0MDY1MjczMiwiZXhwIjoxNzQwNjY3MTMyfQ.Nv09Q-6_bRqy4QmGcHC2rJJQfdK2fmN9dWEzZwQ_rP0" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  https://dev.agilefinance.com.br/chats 2>&1 | tee /root/finance-api/websocket-curl-test.log

#!/bin/bash

# Criar diretório para certificados
mkdir -p certs
cd certs

# Gerar chave privada
openssl genrsa -out server.key 2048

# Gerar certificado auto-assinado
openssl req -new -x509 -key server.key -out server.cert -days 365 -subj "/CN=localhost"

# Ajustar permissões
chmod 600 server.key server.cert

echo "Certificados de desenvolvimento criados em ./certs/"
echo "  - Chave privada: ./certs/server.key"
echo "  - Certificado: ./certs/server.cert"

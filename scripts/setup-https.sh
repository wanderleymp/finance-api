#!/bin/bash

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]
  then echo "Por favor, execute como root (sudo)"
  exit
fi

# Instalar certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Obter certificado
domain="api.agilefinance.com.br"
email="wanderley@agilegestao.com"

certbot certonly --standalone \
    -d $domain \
    --email $email \
    --agree-tos \
    --non-interactive \
    --http-01-port=80

# Configurar renovação automática
certbot renew --dry-run

# Criar diretório para certificados
mkdir -p /etc/ssl/agilefinance
chmod 700 /etc/ssl/agilefinance

# Copiar certificados
cp /etc/letsencrypt/live/$domain/fullchain.pem /etc/ssl/agilefinance/
cp /etc/letsencrypt/live/$domain/privkey.pem /etc/ssl/agilefinance/

# Ajustar permissões
chmod 600 /etc/ssl/agilefinance/*

echo "Certificados instalados em /etc/ssl/agilefinance/"
echo "Agora você pode configurar o servidor para usar:"
echo "  - Certificado: /etc/ssl/agilefinance/fullchain.pem"
echo "  - Chave Privada: /etc/ssl/agilefinance/privkey.pem"

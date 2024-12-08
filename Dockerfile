# Usar uma imagem base mais recente e segura
FROM node:20-slim

# Definir variáveis de ambiente para melhor segurança e performance
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=2048" \
    NPM_CONFIG_LOGLEVEL=warn \
    HOME=/app

# Instalar OpenSSL e criar usuário não-root com UID/GID específicos
RUN apt-get update -y && apt-get install -y openssl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nodeuser \
    && mkdir -p /app \
    && chown -R nodeuser:nodejs /app

# Definir diretório de trabalho
WORKDIR /app

# Copiar apenas os arquivos necessários para instalar dependências
COPY --chown=nodeuser:nodejs package*.json ./

# Instalar dependências com flags de segurança e performance
RUN npm ci --only=production --no-optional --no-audit \
    && npm cache clean --force \
    && rm -rf /root/.npm \
    && chown -R nodeuser:nodejs /app

# Copiar o resto dos arquivos (exceto os definidos no .dockerignore)
COPY --chown=nodeuser:nodejs . .

# Criar diretório .npm e ajustar permissões
RUN mkdir -p /app/.npm \
    && mkdir -p /app/node_modules/.prisma \
    && chown -R nodeuser:nodejs /app/.npm \
    && chown -R nodeuser:nodejs /app/node_modules

# Mudar para usuário não-root e gerar prisma client
USER nodeuser
RUN npx prisma generate

# Healthcheck mais robusto
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Expor porta
EXPOSE 3000

# Definir comando de inicialização com flags de segurança
CMD ["node", "src/server.js"]

# Usar uma imagem base mais recente e segura
FROM node:20-slim

# Definir variáveis de ambiente para melhor segurança e performance
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=2048" \
    NPM_CONFIG_LOGLEVEL=warn

# Criar usuário não-root com UID/GID específicos
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nodeuser

# Definir diretório de trabalho
WORKDIR /app

# Copiar apenas os arquivos necessários para instalar dependências
COPY package*.json ./

# Instalar dependências com flags de segurança e performance
RUN npm ci --only=production --no-optional --no-audit \
    && npm cache clean --force \
    && rm -rf /root/.npm

# Copiar o resto dos arquivos (exceto os definidos no .dockerignore)
COPY --chown=nodeuser:nodejs . .

# Gerar prisma client com usuário não-root
USER nodeuser
RUN npx prisma generate

# Healthcheck mais robusto
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Expor porta
EXPOSE 3000

# Definir comando de inicialização com flags de segurança
CMD ["node", "--no-deprecation", "src/server.js"]

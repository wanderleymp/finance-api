FROM node:18-slim

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nodeuser

WORKDIR /app

# Copiar apenas os arquivos necessários para instalar dependências
COPY package*.json ./

# Instalar dependências e limpar cache
RUN npm ci --only=production \
    && npm cache clean --force

# Copiar o resto dos arquivos (exceto os definidos no .dockerignore)
COPY . .

# Gerar prisma client
RUN npx prisma generate

# Mudar para usuário não-root
USER nodeuser

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Expor porta
EXPOSE 3000

CMD ["npm", "run", "start"]

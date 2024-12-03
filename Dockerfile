FROM node:18
WORKDIR /app

# Copiar apenas os arquivos necessários para instalar dependências
COPY package*.json ./
RUN npm install

# Copiar o arquivo .env primeiro
COPY .env ./

# Copiar o resto dos arquivos
COPY . .

# Verificar se o .env foi copiado
RUN ls -la .env

CMD ["npm", "run", "start"]

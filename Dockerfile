FROM node:18

# Cria a pasta de trabalho
WORKDIR /app

# Copia apenas o package.json do backend primeiro (para otimizar o cache do Docker)
COPY backend/package*.json ./backend/

# Instala as dependências do backend
RUN cd backend && npm install --production

# Copia todo o código do backend
COPY backend ./backend/

# Define o diretório de trabalho como o backend
WORKDIR /app/backend

# Expõe a porta que o Express vai rodar (embora o Render injete a própria variável PORT)
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"]

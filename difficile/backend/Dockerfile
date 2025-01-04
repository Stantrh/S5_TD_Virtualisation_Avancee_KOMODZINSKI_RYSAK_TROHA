# On se base sur l'image officielle de node
FROM node:18-slim

# On mettra notre application dans /app
WORKDIR /app

# On importe les fichiers de dépendances
COPY package*.json ./
RUN npm install

# Copie le reste du code source
COPY . .

# Puis on démarre le serveur
CMD ["node", "index.js"]
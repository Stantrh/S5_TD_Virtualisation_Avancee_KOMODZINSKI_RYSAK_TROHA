# On se base sur l'image officielle de node
FROM node:18

# On mettra notre application dans /app
WORKDIR /app

# On importe les fichiers de dépendances
COPY package*.json ./
RUN npm install

# Copie le reste du code source
COPY . .

# Expose le port utilisé par le backend
EXPOSE 3000

# Puis on démarre le serveur
CMD ["node", "index.js"]
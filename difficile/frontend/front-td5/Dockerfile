# Utilise une image Node.js officielle
FROM node:18-slim

# Définit le répertoire de travail
WORKDIR /app

# Copie les fichiers nécessaires
COPY package*.json ./
RUN npm install

# Copie le reste du code source
COPY . .

# Commande pour démarrer l'application
CMD ["npm", "run", "dev"]

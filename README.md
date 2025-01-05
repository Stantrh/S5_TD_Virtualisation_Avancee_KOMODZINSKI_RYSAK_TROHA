# TD Virtualisation Avancee

## TD 5 : Image avec un DockerFile

Pour commencer ce TD, on construit notre [Dockerfile](Dockerfile) (*commenté*) : 
```docker
# On utilise une image d'ubuntu en tant que base pour la notre
FROM ubuntu:latest

# Ensuite on lance la mise à jour des paquets pour ensuite installer apache et php
RUN apt-get update && apt-get install -y apache2 php && apt-get clean

# On crée notre fichier index.php qui contient la commande phpinfo(). Lorsqu'on se rendra sur notre serveur sur index.php, la commande sera exécutée.
COPY <<EOF /var/www/html/index.php
<?php
phpinfo();
?>
EOF

# Puis, on lance apache sans service en utilisant CMD (qui permet d'exécuter une commande et ses arguments en les passant via un tableau)
CMD ["apachectl", "-D", "FOREGROUND"]
```

A partir de ce [Dockerfile](Dockerfile) on peut construire notre image, puis l'instancier.  
``ubuntu-apache-php`` étant le nom de notre image, et ``.`` le répertoire dans lequel se trouve le ``dockerfile`` à partir duquel l'image est créée.
```bash
docker build -t ubuntu-apache-php .
```
Une fois notre image construite, instancions la avec un conteneur.

```bash
docker run -d -p 8000:80 --name apache-php-td5 ubuntu-apache-php
```
- ``-d`` : Lance le conteneur en arrière plan.
- ``-p`` : Mappe le port de la machine hôte au port du conteneur exécutant le service.

On peut bel et bien accéder à la page par défaut d'apache2 !
![alt text](ressources/apache.png)

Ainsi qu'à ``index.php`` :  
![alt text](ressources/indexphp.png)


****
## TD 5 : Docker Compose

> Docker Compose est un outil qui permet d’orchestrer plusieurs conteneurs Docker à l’aide d’un fichier de configuration ``compose.yml``. Il est particulièrement utile pour gérer des environnements de développement complexes avec plusieurs services (par exemple, un backend, une base de données, et un frontend).

### Difficile
Pour cette configuration, on a 3 services : 
- **Node.js** : Serveur backend.
- **Vue.js** : Service frontend interactif.
- **MongoDB** : Service de base de données.

On sait déjà qu'on aura donc trois services différents dans notre docker compose.
> Par défaut, Docker Compose crée un réseau où les services communiquent par leur nom. C'est à dire que nos trois services pourront communiquer entre eux, grâce au nom qu'on leur donne dans le fichier ``docker-compose.yml``.


Avant de passer au ``docker-compose.yml`` on doit mettre en place nos fichiers pour le frontend et le backend, pour ensuite pouvoir les monter.

#### Backend
##### Node.js
On crée un dossier [backend/](difficile/backend/) puis on y initialise un projet Node.
```bash
npm init -y
```
Puis on installe [Express.js](https://expressjs.com/fr/) qui est un framework minimaliste pour créer des applications web avec Node.js.
```bash
npm install express
```

Enfin, on crée le point d'entrée du serveur avec un [index.js](difficile/backend/index.js)

On a donc cette architecture : 
```
backend/
├── index.js
├── node_modules/
├── package.json
└── package-lock.json
```
#### Frontend
##### Vue.js
On crée un dossier [frontend/](difficile/frontend/) pour y installer [Vue.js](https://vuejs.org/). 
```bash
npx create-vue@latest
```
Ensuite, on navigue dans le projet créé, dans [front-td5](difficile/frontend/front-td5/) pour installer les dépendances nécessaires.
```bash
➜  front-td5 git:(TD5) ✗ npm install
```

Puis, pour vérifier que cela fonctionne, on utilise cette commande.
```bash
➜  front-td5 git:(TD5) ✗ npm run dev
```
> En production, on utiliserait plutôt ``npm run build`` pour avoir une version minifiée et compilée.

![alt text](ressources/vue.png)


Maintenant, il faut faire en sorte que notre service de frontend, auquel on accédera plus tard, sache où trouver le backend. 

> Pour ce faire, nous n'allons pas utiliser le **réseau** créé par **docker compose** entre les différents conteneurs mais **localhost**. Lorsque notre navigateur, sur notre machine hôte accèdera au service de **frontend**, ce dernier enverra une requête au **backend** afin d'obtenir un message de retour. Mais cette requête, c'est notre **navigateur** qui va la faire. Notre navigateur **n'étant pas dans le réseau créé** par docker compose, nous allons devoir rendre accessible le serveur **backend** sur **localhost** (port mapping) pour que le **frontend** puisse y accéder depuis notre **machine hôte**.

On installe donc [Axios](https://axios-http.com/fr/docs/intro) pour les appels API : 
```bash
➜  front-td5 git:(TD5) ✗ npm install axios
```

Pour l'utiliser, on crée un fichier [api.js](difficile/frontend/front-td5/src/api.js) dans ``front-td5/src/`` :  
```js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // On utilise donc localhost car notre machine hôte ne pourra pas trouver backend (ne faisant pas partie du réseau docker)
});

export default api;
```

Et on utilise donc l'API du backend récupérée grâce à Axios dans la vue principale [App.vue](difficile/frontend/front-td5/src/App.vue).

On finit juste par configurer le serveur Vite pour qu'il soit accessible de l'extérieur. Cela se fait dans [front-td5/vite.config.js](difficile/frontend/front-td5/vite.config.js) via l'ajout d'une section ``server``:  
```js
server: {
    host: '0.0.0.0', // Pour l'exposer sur toutes les interfaces réseau
    port: 5173,      // port de base 
    strictPort: true,
  },
```


##### Dockerfile
On pourrait simplement monter tous les fichiers de chaque service grâce aux volumes, mais cela voudrait dire que les conteneurs dépendraient de fichiers de configurations extérieures (celles de l'hôte).

Donc il vaut mieux, pour le backend et le frontend, créer un Dockerfile pour chaque, afin d'installer les dépendances au lancement, et seulement monter le code source.

###### Backend
```dockerfile
# On se base sur l'image officielle de node
FROM node:18

# On mettra notre application dans /app
WORKDIR /app

# On importe les fichiers de dépendances pour les installer sur le conteneur
COPY package*.json ./
RUN npm install

# Puis on cpie le reste du code source
COPY . .

# Enfin, on démarre le serveur
CMD ["node", "index.js"]
```

###### Frontend
```dockerfile
# On se base sur l'image officielle de node
FROM node:18

# On mettra également le front dans /app
WORKDIR /app

# On importe les fichiers de dépendances pour les installer sur le conteneur
COPY package*.json ./
RUN npm install

# Reste du code source, vues, js etc.
COPY . .

# Et on lance le frontend
CMD ["npm", "run", "dev"]
```

#### Database
##### MongoDB
Pour la base de données, on crée un dossier [mongo-data](difficile/mongo-data/) que l'on monte via un volume dans le [docker-compose.yml](difficile/docker-compose.yml). On doit également définir deux variables d'environnement correspondant aux identifiants de connexion d'un admin du service.

Pour ce service, nous allons encore utiliser le backend pour justement faire en sorte que la base de données soit interrogée par ce dernier.

Pour commencer, en se rendant dans [backend/](difficile/backend/), on installe une nouvelle dépendance :  
```bash
npm install mongoose
```

Puis on ajoute ceci dans [index.js](difficile/backend/index.js) pour importer et créer une connexion à MongoDB :  
```js
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
// URL de connexion avec les identifiants qu'on a défini dans le docker compose. On utilise le nom du service "database" pour le contacter.
const mongoUrl = 'mongodb://admin:secret@database:27017/TD5?authSource=admin';

// Connexion avec Mongoose
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// Route de test pour voir les bases de données
app.get('/databases', async (req, res) => {
  try {
    const client = new MongoClient(mongoUrl);
    await client.connect(); // Connexion au serveur MongoDB
    const databases = await client.db().admin().listDatabases(); // Liste les bases
    res.json(databases);
    await client.close(); // Ferme la connexion
  } catch (err) {
    console.error('Failed to list databases:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Coucou du backend, bien connecté à MongoDB !');
});
```

Maintenant, si on teste et qu'on se rend à l'endpoint ``/databases``, on peut voir qu'on récupère bien les différentes bases de données existantes sur notre service MongoDB !
![alt text](ressources/databasesendpoint.png)

Il ne nous reste plus qu'à ajouter un dernier intermédiaire, entre le frontend et le backend, afin qu'en tant que client, on ait seulement à accéder au front pour avoir également les informations en lien avec la base de données.

Pour cela, j'ai modifié le fichier [App.vue](difficile/frontend/front-td5/src/App.vue).

![alt text](ressources/frontendbdd.png)



#### Docker Compose : Le fichier
Le fichier est disponible dans [difficile/docker-compose.yml](difficile/docker-compose.yml). Le voici commenté afin d'expliquer l'utilité de chaque paramètre.
```yml
services: # on définit donc nos 3 services différents
  backend:  # Définition du service backend
    build:  # Pour construire l'image à partir du Dockerfile qui contient les installations des packages et le lancement du point d'entrée du serveur.
      context: ./backend  # Dossier contenant le Dockerfile.
    ports:
      - "3000:3000"  # Mapping pour qu'on puisse accéder au backend sur notre hôte sur localhost:3000
    depends_on:
      - database  # On utilise depends pour s'assurer que database soit démarré pour que le backend puisse également démarrer à son tour.
    volumes:
      - ./backend:/app  # Pour monter le code source dans le conteneur.

  frontend:  # Définition du service frontend
    build:  # Pour construire l'image à partir du Dockerfile qui contient les installations des packages et le lancement du point d'entrée du frontend.
      context: ./frontend/front-td5  # Dossier contenant le Dockerfile.
    ports:
      - "5173:5173"  # Le point d'entrée de l'app web pour notre hôte est le frontend, on le rend donc disponible au port 5173 (port de base de Vue.js)
    depends_on:
      - backend  # Comme ci-dessus, là il faut que le backend soit prêt pour que le frontend soit lancé.
    volumes:
      - ./frontend/front-td5:/app  # On monte également le code source et les configurations, mais l'installation des dépendances s'installent grâce au dockerfile

  database:  # Définition du service MongoDB
    image: mongo:latest  # on utilise donc l'image mongodb
    ports:
      - "27017:27017"  # On fait le mapping entre note hôte et le conteneur pour pouvoir accéder au service
    volumes:
      - ./mongo-data:/data/db  # Pour garder les mêmes données peu importe les instances de cette image
    environment:  # et on définit nos logins pour se connecter à la bdd
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=secret
```

> Grâce à l'utilisation de volumes pour le frontend et le backend, cela permet un développement interactif. Pas besoin de redémarrer ou de reconstruire les conteneurs lorsqu'on modifie le code source. Le code source est directement **partagé** entre la machine hôte et les conteneurs.

Ensuite, il suffit juste d'utiliser cette commande, en se plaçant dans [difficile](difficile/) :  
```bash
➜  difficile git:(TD5) ✗ docker compose up -d --build
```

Et on peut accéder aux trois services, puisque chacun d'entre eux sont mappés sur un port de la machine hôte.



#### Bonus
##### Le serveur peut contacter la base de données par son nom
Comme vu dans la partie MongoDB, le backend initie la connexion à MongoDB via une url utilisant le nom qu'on lui a donné : ``database``. [index.js](difficile/backend/index.js) : 
```js
// URL de connexion avec identifiants
const mongoUrl = 'mongodb://admin:secret@database:27017/mydb?authSource=admin';
```
Et ensuite, le backend réussit à récupérer les bases de données présentes sur le service mongoDB et à les afficher (en les retournant au frontend qui lui fait appel) : 

![alt text](ressources/bonusbdd.png)

##### Le frontend peut contacter le serveur via localhost
C'est de cette façon que fonctionne l'application web. Le code javascript du frontend, avec Vue.js, est exécuté par le navigateur du client (donc le navigateur de notre machine hôte). Et le client n'étant pas dans le réseau créé par défaut par docker compose, il a fallu rendre disponible le serveur sur le réseau local de l'hôte.

Cela s'est fait via le [docker-compose.yml](difficile/docker-compose.yml) :  
```yml
backend:  # Définition du service backend
    build:  # Pour construire l'image à partir du Dockerfile qui contient les installations des packages et le lancement du point d'entrée du serveur.
      context: ./backend  # Dossier contenant le Dockerfile.
    ports:
      - "3000:3000"  # Mapping pour qu'on puisse accéder au backend sur notre hôte sur localhost:3000
    depends_on:
      - database  # On utilise depends pour s'assurer que database soit démarré pour que le backend puisse également démarrer à son tour.
    volumes:
      - ./backend:/app  # Pour monter le code source dans le conteneur.
```
Grâce à la section ports, on peut faire le port mapping pour que le serveur web soit accessible depuis l'hôte.
![alt text](ressources/backendhote.png)

Ensuite, il suffit de faire en sorte que le frontend communique avec le backend via localhost. App.vue : 
```html
<template>
  <div>
    <h1>Frontend</h1>
    <p>Message du backend: {{ message }}</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      message: '',
    };
  },
  async mounted() {
    try {
      const response = await axios.get('http://localhost:3000'); // adresse du backend
      this.message = response.data;
    } catch (error) {
      console.error('Failed to fetch message from backend:', error);
    }
  },
};
</script>
```

Et si on se rend sur le frontend, à l'adresse ``http://localhost:5173``, on obtient bien la réponse du serveur avec la requête faite depuis notre navigateur au backend sur ``http://localhost:3000``.
![alt text](ressources/requetebackend.png)


<u>*A noter qu'il a fallu activer les en-têtes CORS dans le backend  afin que les requêtes envoyées depuis notre navigateur depuis le front end soient autorisées.*</u> [index.js](difficile/backend/index.js) : 
```js
const cors = require('cors');
// Middleware CORS pour autoriser le frontend
app.use(cors({
   origin: 'http://localhost:5173',
 }));
```


##### On peut se connecter à la base de données depuis l'hôte
Puisque nous avons utilisé MongoDB, on pourra se connecter avec le client ``mongosh``.  On utilise donc les identifiants définis dans le fichier de configuration [docker-compose.yml](difficile/docker-compose.yml) :  
```yml
database:  # Définition du service MongoDB
    image: mongo:latest  # Utilise l'image officielle de MongoDB.
    ports:
      - "27017:27017"  # On fait le mapping de port pour pouvoir contacter la bdd depuis l'host
    volumes:
      - mongo-data:/data/db  # Utilise un volume pour persister les données.
    environment:  # Définit les variables d'environnement pour MongoDB.
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=secret
```

Puisqu'on expose le port 27017 du conteneur via le port 27017 de notre machine hôte, il suffit de faire :  
```bash
➜  difficile git:(TD5) ✗ mongosh --username admin --password secret --host 127.0.0.1 --port 27017
```
Et on obtient bien une connexion à la base de données !
![alt text](ressources/mongodbfromhost.png)


On peut créer une base de données TD5 qu'on retrouvera dans chaque conteneur instanciant ``database`` grâce au volume défini.
![alt text](ressources/mongodbbdd.png)

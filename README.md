# TD_Virtualisation_Avancee

## TD 1

### Installation de docker
```
sudo apt-get update
sudo apt-get install ./docker-desktop-amd64.deb
```


### Exemple d'utilisation
Pour l'exemple, nous avons choisi le service [Angular](https://angular.dev/).
Le projet a la structure suivante :
```
.
├── angular
│   ├── Dockerfile
│   ├── ...
│   ├── ...
│   ....
└── compose.yaml
```

Le compose.yaml se décrit comme suit :
```yaml
services:
  web:
    build:
      context: angular
      target: builder
    ports:
      - 4200:4200
    volumes:
      - ./angular:/project
      - /project/node_modules
```
Ce fichier définit une application avec un service angular. L'image pour le service est construite grâce au [Dockerfile](Ressources/files/Dockerfile) qui se trouve dans le dossier ``angular``.
La section ``ports`` sert à établir une correspondance entre le port du conteneur (ici 4200) et le port de la machine hôte (également 4200). Bien sûr, si le port est déjà utilisé, il faut modifier la valeur.

La section ``volumes`` permet de monter des volumes dans le conteneur. Un volume est une méthode utilisée pour partager des données entre la machine hôte et le conteneur ou pour persister des données au-delà du cycle de vie du conteneur. 

La première ligne signifie que tout ce qui se trouve dans le dossier ``./angular`` de la machine hôte sera accessible dans le conteneur à l'emplacement ``/project``. Cela permet de développer en temps réel, toute modification faite dans ./angular sur l'hôte sera automatiquement reflétée dans le conteneur.

Pour la deuxième ligne, seul le chemin dans le conteneur est spécifié. C'est donc un "volume anonyme". Docker va créer un volume interne à cet emplacement dans le conteneur. Ainsi, on évite que les fichiers du dossier ``node_modules`` de l'application soient écrasés ou interférent avec ceux du système hôte. Les dépendances npm installées resteront isolées dans ce volume.

Et maintenant, on utilise ``docker compose up -d`` pour créer et démarrer le conteneur spécifié dans le fichier ``compose.yaml``. Le ``-d`` permet l'exécution en arrière-plan, sans cette option, les logs du conteneur s'afficheront directement dans le terminal.

![alt text](Ressources/img/composeUp.png)

On peut vérifier que le conteneur est bien en cours d'exécution avec ``docker ps``.

![alt text](Ressources/img/dockerPs.png)

Maintenant que l'application est lancée, on peut y accéder depuis notre navigateur avec l'URL : ``http://localhost:4200``.

![alt text](Ressources/img/visuelAngular.png)

Tout fonctionne ! On peut désormais stopper et supprimer le conteneur avec ``docker compose down``.

![alt text](Ressources/img/composeDown.png)

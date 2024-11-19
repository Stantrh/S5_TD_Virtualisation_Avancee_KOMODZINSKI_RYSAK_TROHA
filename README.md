# TD Virtualisation Avancee

## TD 2 : Namespaces

Les namespaces sont très utiles pour isoler des **ressources** dans un "conteneur".
Ces **ressources** peuvent être, par exemple : 
- Des utilisateurs.
- Des réseaux.
- Des processus. 
- Des disques.


Unshare isole vraiment les ressources les unes des autres.
Quand un espace isolé. chaque processus est isolé dans son environnement.
Donc lorsqu'on isole la ressource pour le container, elle n'est même plus accessible par la machine hôte.


### Mount
loop device déjà monter sur la machine
loop device monter ensuite sur le conteneur.
Mount permet de à chaque conteneur d'avoir son propre système de fichiers.
Puisqu'on est sur Ubuntu, on doit le faire en sudo.
### UTS 

### IPC

### PID

### User 

### Time


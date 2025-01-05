# TD_Virtualisation_Avancee

## TD 3 : Cgroups

Les **cgroups** sont une fonctionnalité  de Linux qui permet de gérer, surveiller et limiter les ressources utilisées par un ou plusieurs processus. Ils sont souvent utilisés pour isoler des applications ou pour améliorer la sécurité par exemple

*****

### Comment fonctionnent les cgroups ?

Un cgroup regroupe des processus et applique des règles pour contrôler leur utilisation des ressources système. Ces règles peuvent inclure des limites sur :

* **Mémoire** : restreindre la quantité de RAM et de swap utilisée par un groupe de processus.
* **CPU** : limiter le temps CPU qu’un groupe peut utiliser.
* **PIDs** : limiter le nombre de processus enfant pouvant être créés.
* **I/O** : contrôler la vitesse de lecture/écriture sur les disques.
* **Réseau** : gérer la bande passante réseau attribuée aux processus.

Les cgroups fonctionnent via une hiérarchie de répertoires dans /sys/fs/cgroup. Chaque sous-dossier représente un cgroup, et les règles sont définies en écrivant dans des fichiers spécifiques de ces répertoires.


### Types de cgroups 

On peut noter qu'il existe deux types de cgroups, les v1 et les v2. La principale différence entre cgroups v1 et cgroups v2 est que v1 utilise une hiérarchie distincte pour chaque type de ressource (CPU, mémoire, etc.), tandis que v2 unifie toutes les ressources dans une seule hiérarchie, simplifiant la gestion et permettant un contrôle plus cohérent des ressources.


## 1. À l'aide des cgroups

### Lancer un processus donnant l'heure toutes les secondes

Dans le premier terminal nous entrons la commande : 

```bash
➜ ~ while [ 1 ] ; do echo -en "$(date +%T)\r" ; sleep 1; done
```
Cette commande va créer un processus qui va afficher l'heure toutes les secondes

```bash
16:03:00
```

Dans un deuxième terminal nous alloons mettre en place un cgroup limitant la mémoire pouvant être utilise par un processus 

### Etape 1 Installer les outils nécessaires

```bash 
➜ ~ sudo apt install cgroup-tools 
```

### Étape 2 : Créer un cgroup

Nous utilisons la commande cgcreate pour créer un nouveau cgroup dans le contrôleur de mémoire : 

```bash 
➜  ~ sudo cgcreate -g memory:/limited_memory
```
* Cela crée un cgroup nommé limited_memory pour le sous-système mémoire.
* Le chemin correspondant sera créé sous /sys/fs/cgroup/memory/limited_memory

**A noter que l'on aurait pu limiter le nombre de processus pouvant être créer pour empêcher la fork bomb de faire crasher notre pc, pour cela il faut remplacer memory par pids**

### Étape 3 : Configurer les limites de mémoire

Nous allons ensuite définir la limite mémoire à ne pas dépasser

```bash 
➜ ~ echo 100M | sudo tee /sys/fs/cgroup/memory/limited_memory/memory.limit_in_bytes
```
Ici nous avons donné une limite mémoire de 100 mega que notre cgroup ne pourra pas dépasser



### Étape 4 : Exécuter la forkbomb

Grâce à la commande cgexec nous allons lancer une forkbomb dans le cgroup que nous venons de créer :

```bash 
➜ ~ sudo cgexec -g memory:limited_memory bash -c ':(){ :|:& };:'
```
* **cgexec** nous permet d'exécuter un script ou programme dans un cgroup donnée, en l'occurence notre cgroup va être celui que nous avons créer juste avant et la script une forkbomb
* **-g** permet de spécifier le cgroup dans lequel exécuter la commande 
* **memory** précise que le cgroup correspond à la mémoire
* **limited_memory** le nom du cgroup dans lequel nous voulons exéctuter la forkbomb
* **bash** Lance une nouvelle instance de bash 
* **-c** indique que la commande qui suit est une chaine de charactère qui contient une commande à exécuter 
* **':(){ :|:& };:'** la commande à exécuter qui est notre forkbomb

### Étape 5 : Constater les résultats

Une fois la commande lancée, rien ne se passe.

Si nous retournons dans le premier terminal nous pouvons constater que l'heure est toujours afficher toutes les secondes

```bash
16:26:49
```

Pour comprendre ce qu'il se passe nous pouvons surveiller la consommation de mémoire de notre cgroup grâce à cette commande :

```bash 
➜ ~ cat /sys/fs/cgroup/memory/limited_memory/memory.usage_in_bytes
104857600
```
Comme nous pouvons le voir, une fois la mémoire totale qui lui a été alloué utilisé, la forkbomb ne peut créer de processus enfant car ils seront tuer par **l'OOM killer** garantissant ainsi que le pc ne crash pas
Sous Linux l'OOM killer est un mécanisme de gestion de mémoire. Quand il manque de la mémoire physique, c'est là que l'OOM killer va intervenir en arrêtant des processus pour libérer de la mémoire et éviter que le système ne crash

Si maintenant je décide d'augment la mémoire alloué à mon cgroup : 

```bash 
➜ ~ echo 200M | sudo tee /sys/fs/cgroup/memory/limited_memory/memory.limit_in_bytes
```
Nous pourrons cosntater que la forkbomb va immédiatement s'emparer de toute la mémoire libre disponible

```bash 
➜ ~ cat /sys/fs/cgroup/memory/limited_memory/memory.usage_in_bytes
209715200
```



## 2. Namespaces et Cgroups

### Objectif

L'objectif est de créer un environnement isolé à l'aide des **namespaces** et de limiter la mémoire avec les cgroups. Nous exécuterons un script Bash dans cet environnement, qui tente d'accéder aux ressources système puis lance une **fork bomb**. Seul le script Bash devrait planter, sans affecter le système.

*****

### Étapes

#### 1. Créer un cgroup pour limiter la mémoire

Nous commençons par créer un cgroup dans le contrôleur de mémoire :

```bash
sudo cgcreate -g memory:/limited_memory
```

Ensuite, nous limitons la mémoire à **100 Mo** :

```bash
echo 100M | sudo tee /sys/fs/cgroup/memory/limited_memory/memory.limit_in_bytes
```

*****

#### 2. Écrire le script Bash à exécuter dans l'environnement isolé

Nous écrivons un script [isolate_script.sh](Ressources/isolate_script.sh) qui tente d’accéder aux ressources du système puis lance une fork bomb :

```bash
#!/bin/bash

echo "Tentative d'accès aux ressources du système hôte"
cat /etc/passwd

echo "Lancement de la fork bomb..."
:(){ :|:& };:
```

*****

#### 3. Créer un namespace isolé et exécuter le script

Nous utilisons la commande ``unshare`` pour créer un nouveau namespace :

```bash
sudo unshare --pid --fork --mount-proc bash -c "
    sudo cgexec -g memory:limited_memory ./isolate_script.sh
"
```

- ``--pid`` : Crée un nouvel espace pour les PID.

- ``--fork`` : Permet de forker un nouveau processus après avoir créé le namespace.

- ``--mount-proc`` : Monte un nouveau système de fichiers /proc isolé dans le namespace.

Puis on exécute le script dans le cgroup.

*****

### Résultats

Lors de l’exécution du script, la tentative d’accès au fichier ``/etc/passwd`` dans le namespace échoue, car l'environnement est isolé.

Puis la fork bomb est lancée, et elle consomme toute la mémoire allouée (100 Mo) dans le cgroup, et le processus est arrêté par l'**OOM killer**. Ainsi, seul le script plante.

```bash
➜ ~ cat /sys/fs/cgroup/memory/limited_memory/memory.usage_in_bytes
104857600
```

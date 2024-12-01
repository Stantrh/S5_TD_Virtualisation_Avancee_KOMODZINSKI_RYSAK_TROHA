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

Si maintenant je décide d'augment la mémoire alloué à mon cgroup : 

```bash 
➜ ~ echo 200M | sudo tee /sys/fs/cgroup/memory/limited_memory/memory.limit_in_bytes
```
Nous pourrons cosntater que la forkbomb va immédiatement s'emparer de toute la mémoire libre disponible

```bash 
➜ ~ cat /sys/fs/cgroup/memory/limited_memory/memory.usage_in_bytes
209715200
```


### Conclusion

Dans cette première partie, nous avons pu mettre en place un cgroup qui limitait la mémoire totale pouvant être utilisé.
Nous avons ensuite executé une forkbomb sur ce cgroup, et avons pu constater que le cgroup empêchait la forkbomb d'utiliser plus de mémoire qu'il ne lui était alloué, empêchant ainsi la forkbomb de faire crasher le système



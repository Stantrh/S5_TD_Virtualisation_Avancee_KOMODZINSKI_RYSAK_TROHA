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
#!/bin/bash

# Tentatives d'accès aux ressources système
echo "Tentative d'accès aux ressources du système hôte"
cat /etc/passwd   # Accès à un fichier système (devrait échouer en namespace)

# Fork bomb
echo "Lancement de la fork bomb..."
:(){ :|:& };:

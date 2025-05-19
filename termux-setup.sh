#!/bin/bash

# Script d'installation pour FX-GOD WhatsApp Bot sur Termux
# Créateur: hhhisoka

echo "================================================"
echo "    Installation de FX-GOD WhatsApp Bot"
echo "================================================"

# Mise à jour des packages
echo "[*] Mise à jour des packages..."
pkg update -y && pkg upgrade -y

# Installation des dépendances
echo "[*] Installation des dépendances nécessaires..."
pkg install -y nodejs git ffmpeg imagemagick

# Vérification de l'installation de Node.js
node_version=$(node -v)
echo "[*] Version Node.js installée: $node_version"

# Clonage du dépôt (à remplacer par l'URL de votre dépôt)
echo "[*] Clonage du dépôt..."
git clone https://github.com/hhhisoka/
cd fx-god-whatsapp-bot

# Installation des packages npm
echo "[*] Installation des packages npm..."
npm install

# Configuration du fichier .env
echo "[*] Configuration du bot..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "[*] Fichier .env créé. Veuillez le modifier avec nano .env"
else
    echo "[*] Le fichier .env existe déjà."
fi

echo "================================================"
echo "    Installation terminée !"
echo "================================================"
echo ""
echo "Pour démarrer le bot, exécutez:"
echo "cd fx-god-whatsapp-bot && npm start"
echo ""
echo "Pour configurer le bot, modifiez le fichier .env:"
echo "nano .env"
echo ""
echo "Créé par hhhisoka - FX-GOD WhatsApp Bot"
echo "================================================"
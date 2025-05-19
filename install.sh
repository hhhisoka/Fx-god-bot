#!/bin/bash

# Script d'installation pour FX-GOD WhatsApp Bot
# Créateur: hhhisoka

echo "================================================"
echo "    Installation de FX-GOD WhatsApp Bot"
echo "================================================"

# Détection de la plateforme
if [ -d "/data/data/com.termux" ]; then
  # Termux
  echo "[*] Plateforme détectée: Termux"
  PLATFORM="termux"
  
  # Mise à jour des packages
  echo "[*] Mise à jour des packages..."
  pkg update -y && pkg upgrade -y
  
  # Installation des dépendances
  echo "[*] Installation des dépendances nécessaires..."
  pkg install -y nodejs-lts git ffmpeg imagemagick
else
  # Linux/macOS/autres
  echo "[*] Plateforme détectée: $(uname -s)"
  PLATFORM="standard"
  
  # Vérification de Node.js
  if ! command -v node &> /dev/null; then
    echo "[!] Node.js n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
  fi
  
  # Vérification de git
  if ! command -v git &> /dev/null; then
    echo "[!] Git n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
  fi
  
  # Vérification de ffmpeg
  if ! command -v ffmpeg &> /dev/null; then
    echo "[!] ffmpeg n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
  fi
fi

# Vérification de l'installation de Node.js
node_version=$(node -v)
echo "[*] Version Node.js installée: $node_version"

# Installation des packages npm
echo "[*] Installation des packages npm..."
npm install --legacy-peer-deps

# Configuration du fichier .env
echo "[*] Configuration du bot..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "[*] Fichier .env créé. Veuillez le modifier avec votre éditeur préféré"
    
    # Configuration guidée
    echo ""
    echo "Voulez-vous configurer le bot maintenant? (O/n): "
    read config_now
    
    if [[ "$config_now" == "O" || "$config_now" == "o" || "$config_now" == "" ]]; then
        echo "Entrez votre numéro WhatsApp (format international sans +, ex: 33612345678): "
        read owner_number
        
        echo "Entrez votre nom ou pseudo: "
        read owner_name
        
        echo "Préfixe des commandes (défaut: .): "
        read prefix
        prefix=${prefix:-"."}
        
        echo "Utiliser le code d'appairage au lieu du QR code? (o/N): "
        read use_pairing
        if [[ "$use_pairing" == "O" || "$use_pairing" == "o" ]]; then
            pairing="true"
        else
            pairing="false"
        fi
        
        # Mettre à jour .env
        sed -i "s/OWNER_NUMBER=.*/OWNER_NUMBER=$owner_number/" .env
        sed -i "s/OWNER_NAME=.*/OWNER_NAME=$owner_name/" .env
        sed -i "s/BOT_PREFIX=.*/BOT_PREFIX=$prefix/" .env
        sed -i "s/USE_PAIRING_CODE=.*/USE_PAIRING_CODE=$pairing/" .env
        
        echo "[*] Configuration de base terminée!"
    else
        echo "[*] Vous pourrez configurer le bot plus tard en modifiant le fichier .env"
    fi
else
    echo "[*] Le fichier .env existe déjà."
fi

# Création des dossiers nécessaires
mkdir -p sessions media temp data

echo "================================================"
echo "    Installation terminée !"
echo "================================================"
echo ""
echo "Pour démarrer le bot, exécutez:"
echo "node index.js"
echo ""
echo "Créé par hhhisoka - FX-GOD WhatsApp Bot"
echo "================================================"
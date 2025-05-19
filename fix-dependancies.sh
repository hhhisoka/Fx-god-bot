#!/bin/bash
# Script pour corriger les dépendances manquantes de Fx-god-bot

echo "🛠️ Installation des dépendances manquantes pour Fx-god-bot..."

# Vérification de l'existence du fichier package.json
if [ ! -f "package.json" ]; then
  echo "❌ Erreur: Le fichier package.json n'existe pas."
  echo "📋 Veuillez exécuter ce script dans le répertoire racine du projet Fx-god-bot."
  exit 1
fi

# Installation des dépendances principales
echo "📦 Installation de fs-extra..."
npm install fs-extra

# Installation des autres dépendances nécessaires
echo "📦 Installation des autres dépendances essentielles..."
npm install @adiwajshing/baileys@5.0.0 @adiwajshing/keyed-db@0.2.4 @hapi/boom@10.0.1 axios dotenv fluent-ffmpeg qrcode-terminal sharp uuid

echo "✅ Installation des dépendances terminée!"
echo "🚀 Vous pouvez maintenant lancer le bot avec 'npm start'"
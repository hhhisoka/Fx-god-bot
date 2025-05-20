# FX-GOD WhatsApp Bot

Un bot WhatsApp personnalisable basé sur Baileys avec multiples plugins.

## 🚀 Fonctionnalités

- 📊 Gestion de groupe (tagall, antilink)
- 🖼️ Traitement des médias (sticker, téléchargement)
- 👁️ Gestion des messages "vue unique" (vv, antiviewonce)
- 🟢 Options de statut (ghost, alwaysonline)
- 🌐 Rejoindre automatiquement des groupes
- 🔧 Facilement personnalisable

## 📋 Prérequis

- Node.js 14.0.0 ou plus récent
- Une connexion internet stable
- Un appareil pour scanner le code QR WhatsApp

## 🔧 Installation

### Installation locale

```bash
# Cloner le dépôt
git clone https://github.com/hhhisoka/fx-god-whatsapp-bot.git
cd fx-god-whatsapp-bot

# Installer les dépendances
npm install

# Configurer le bot
cp .env.example .env
# Modifier le fichier .env avec vos paramètres

# Démarrer le bot
npm start
```
### Interface Web 

Accédez à l'interface web de pairage pour une expérience simplifiée :

👉 [**Accéder à la page de pairage**](https://fx-god-bot.replit.app/pair)

L'interface web vous permet de :
- Scanner un code QR
- Utiliser un code de pairage numérique
- Gérer vos sessions existantes
- Obtenir facilement votre ID de session


### Installation sur Termux

```bash
# Installer Node.js et Git
pkg update && pkg upgrade
pkg install nodejs git

# Cloner le dépôt
git clone https://github.com/hhhisoka/fx-god-whatsapp-bot.git
cd fx-god-whatsapp-bot

# Installer les dépendances
npm install

# Configurer le bot
cp .env.example .env
# Modifier le fichier .env avec nano
nano .env

# Démarrer le bot
npm start
```

## 🚀 Déploiement

### Heroku

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/hhhisoka/fx-god-whatsapp-bot)

1. Cliquez sur le bouton ci-dessus
2. Remplissez les variables d'environnement
3. Déployez l'application
4. Activez le dyno dans l'onglet Resources
5. Consultez les logs pour scanner le code QR

### Replit

1. Créez un nouveau repl sur Replit
2. Choisissez "Import from GitHub" et entrez l'URL du dépôt
3. Configurez les variables d'environnement dans l'onglet Secrets
4. Lancez le repl et scannez le code QR

## ⚙️ Configuration

Le bot peut être configuré en modifiant le fichier `.env` :

```env
# Modifier le préfixe des commandes (par défaut: .)
BOT_PREFIX=!

# Activer/désactiver les fonctionnalités
GHOST_MODE=false
ALWAYS_ONLINE=true
AUTO_READ_STATUS=true
ANTI_LINK=true
ANTI_VIEW_ONCE=true

# Configuration de groupe automatique
AUTO_JOIN_GROUP=https://chat.whatsapp.com/votreliengroupe
```

## 📚 Commandes Disponibles

- `.help` - Affiche l'aide et la liste des commandes
- `.menu` - Affiche le menu principal
- `.tagall` - Mentionne tous les membres du groupe
- `.antilink [on/off]` - Active/désactive le blocage des liens
- `.ghost [on/off]` - Mode invisible
- `.alwaysonline [on/off]` - Mode toujours en ligne
- `.autoreadstatus [on/off]` - Lecture automatique des statuts
- `.vv` - Voir les messages "vue unique"
- `.antiviewonce [on/off]` - Convertir auto. les messages "vue unique"
- `.sticker` - Créer un sticker à partir d'une image/vidéo
- `.download` - Télécharger des médias

## 👨‍💻 Développeur

- **Créateur** : hhhisoka

## 📜 Licence

Ce projet est sous licence MIT.
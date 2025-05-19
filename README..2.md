# FX-GOD WhatsApp Bot - Guide complet

## Présentation
FX-GOD est un bot WhatsApp personnalisable basé sur la bibliothèque Baileys. Il offre plus de 20 plugins incluant la gestion de groupe, la manipulation de médias et une gestion de session personnalisée.

## Fonctionnalités
- 🤖 **Connexion WhatsApp** : Par code QR ou code d'appairage
- 🔧 **Préfixe personnalisable** : Changez le préfixe de commande (par défaut : ".")
- 👥 **Gestion de groupe** : Tagall, antilink, etc.
- 🖼️ **Manipulation de médias** : Création de stickers, téléchargement de médias
- 📊 **Options de statut** : Ghost mode, always online, autoread status
- 🔒 **Sécurité** : Système de blacklist et commandes réservées au propriétaire

## Structure du projet
```
fx-god-bot/
├── lib/                  # Bibliothèque core du bot
├── plugins/              # Plugins et commandes
│   ├── core/             # Commandes principales
│   ├── group/            # Commandes de gestion de groupe
│   ├── media/            # Commandes de manipulation de médias
│   ├── status/           # Commandes liées au statut
│   └── system/           # Commandes système
├── sessions/             # Données de session WhatsApp
├── media/                # Stockage pour les médias
├── temp/                 # Dossier temporaire
├── data/                 # Stockage des données du bot
├── config.js             # Configuration du bot
├── index.js              # Point d'entrée principal
├── package.json          # Dépendances npm
└── .env                  # Variables d'environnement
```

## Installation sur Termux

### Prérequis
- Termux installé sur votre Android
- Accès au stockage autorisé

### Étape 1 : Installation des dépendances
```bash
# Mettre à jour les packages
pkg update && pkg upgrade -y

# Installer les dépendances nécessaires
pkg install -y nodejs-lts git ffmpeg imagemagick
```

### Étape 2 : Accès au stockage et navigation
```bash
# Autoriser l'accès au stockage (nécessaire une seule fois)
termux-setup-storage

# Naviguer vers votre dossier (remplacer par votre chemin)
cd /storage/emulated/0/jj/
```

### Étape 3 : Créer les dossiers nécessaires
```bash
# Créer les dossiers essentiels s'ils n'existent pas
mkdir -p fx-god-bot/sessions fx-god-bot/temp fx-god-bot/media fx-god-bot/data
cd fx-god-bot
```

### Étape 4 : Installation des packages
```bash
# Installation des dépendances npm
npm install --legacy-peer-deps
```

### Étape 5 : Configuration de l'environnement
```bash
# Créer et configurer votre fichier .env
cp .env.example .env
```
Modifiez le fichier .env avec un éditeur de texte pour définir :
- Votre numéro WhatsApp (OWNER_NUMBER)
- Votre nom (OWNER_NAME)
- Le préfixe de commande (BOT_PREFIX)
- Méthode de connexion (USE_PAIRING_CODE)

### Étape 6 : Démarrage du bot
```bash
# Démarrer le bot
node index.js
```

## Connexion à WhatsApp
Le bot propose deux méthodes de connexion :
1. **Scanner un code QR** avec l'application WhatsApp
2. **Utiliser un code d'appairage** à entrer sur votre téléphone

## Commandes principales

| Commande | Description | Usage |
|----------|-------------|-------|
| `.menu` | Affiche la liste des commandes | `.menu` |
| `.help [cmd]` | Affiche l'aide pour une commande | `.help sticker` |
| `.setprefix [prefix]` | Change le préfixe des commandes | `.setprefix !` |
| `.tagall [message]` | Mentionne tous les membres du groupe | `.tagall Hello` |
| `.sticker` | Crée un sticker à partir d'une image | Envoyez une image avec la légende `.sticker` |
| `.vv` | Affiche un message "view once" | Répondez à un message view once avec `.vv` |
| `.ghost` | Active/désactive le mode invisible | `.ghost` |
| `.alwaysonline` | Reste toujours en ligne | `.alwaysonline` |

## Exécution en arrière-plan sur Termux
Pour garder le bot en fonctionnement même après avoir fermé Termux :

```bash
# Installer termux-services
pkg install termux-services

# Démarrer le bot en arrière-plan
node index.js &
```

## Dépannage

### Problèmes de connexion
- **Erreur QR Code** : Vérifiez que WhatsApp est à jour sur votre téléphone
- **Erreur de session** : Supprimez le dossier sessions et reconnectez-vous

### Erreurs d'installation
- **Erreurs npm** : Utilisez l'option `--legacy-peer-deps`
- **Erreurs ffmpeg** : Assurez-vous que ffmpeg est correctement installé

## Créé par
- **Auteur** : hhhisoka
- **Bot** : FX-GOD WhatsApp Bot

---

Pour toute question ou problème, consultez la documentation de Baileys ou les discussions du projet.
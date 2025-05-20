/**
 * FX-GOD WhatsApp Bot
 * Version améliorée avec interface web pour le pairage
 */

import { startBot } from './lib/baileys.js';
import { loadPlugins } from './lib/plugin-manager.js';
import fs from 'fs-extra';
import qrcode from 'qrcode-terminal';
import config from './config.js';
import createWebServer from './web/server.js';
import path from 'path';

// Créer les répertoires nécessaires s'ils n'existent pas
const initDirectories = async () => {
  const dirs = [
    './sessions',
    './media',
    './temp',
    './database',
    './plugins/core',
    './plugins/group',
    './plugins/media',
    './plugins/owner',
    './plugins/fun',
    './plugins/utils'
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(dir);
    console.log(`✅ Répertoire ${dir} prêt`);
  }
};

// Initialiser et démarrer le bot
const init = async () => {
  try {
    console.log('🤖 FX-GOD WhatsApp Bot - Initialisation...');
    
    // Initialiser les répertoires
    await initDirectories();
    
    // Démarrer le serveur web si activé
    const useWebInterface = process.env.WEB_INTERFACE !== "false";
    const webPort = process.env.WEB_PORT || 3000;
    
    if (useWebInterface) {
      const webServer = createWebServer();
      webServer.start(webPort);
    }
    
    // Charger tous les plugins
    await loadPlugins();
    
    // Démarrer la connexion WhatsApp
    const { conn, startConnection } = await startBot({
      printQR: (qr) => {
        if (!global.webSocket) {
          console.log('📱 Scannez le code QR ci-dessous pour vous connecter:');
          qrcode.generate(qr, { small: true });
        }
      },
      onConnectionUpdate: (update) => {
        if (update.connection === 'open') {
          console.log('🟢 Connexion établie avec succès!');
        }
        if (update.connection === 'close') {
          console.log('🔴 Connexion fermée. Tentative de reconnexion...');
          setTimeout(startConnection, 5000);
        }
      }
    });
    
    console.log('🚀 FX-GOD WhatsApp Bot est maintenant en cours d\'exécution!');
    console.log(`📝 Tapez ${config.prefix}help dans WhatsApp pour voir les commandes disponibles`);
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du bot:', error);
    process.exit(1);
  }
};

// Gérer les exceptions non capturées et les rejets non gérés
process.on('uncaughtException', (err) => {
  console.error('Exception non capturée:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rejet non géré à:', promise, 'raison:', reason);
});

// Démarrer le bot
init();
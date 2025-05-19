/**
 * FX-GOD WhatsApp Bot
 * A customizable WhatsApp bot based on Baileys with multiple plugins
 */

import { startBot } from './lib/baileys.js';
import { loadPlugins } from './lib/pluginLoader.js';
import config from './config.js';
import fs from 'fs-extra';
import qrcode from 'qrcode-terminal';

// Create necessary directories if they don't exist
const initDirectories = async () => {
  const dirs = ['./sessions', './media', './temp'];
  
  for (const dir of dirs) {
    await fs.ensureDir(dir);
    console.log(`✅ Directory ${dir} ready`);
  }
};

// Initialize and start the bot
const init = async () => {
  try {
    console.log('🤖 FX-GOD WhatsApp Bot Initializing...');
    
    // Initialize directories
    await initDirectories();
    
    // Load all plugins
    await loadPlugins();
    
    // Start the WhatsApp connection
    const { conn, startConnection } = await startBot({
      printQR: (qr) => {
        console.log('📱 Scan the QR code below to login:');
        qrcode.generate(qr, { small: true });
      },
      onConnectionUpdate: (update) => {
        if (update.connection === 'open') {
          console.log('🟢 Connection established successfully!');
        }
        if (update.connection === 'close') {
          console.log('🔴 Connection closed. Attempting to reconnect...');
          setTimeout(startConnection, 5000);
        }
      }
    });
    
    console.log('🚀 FX-GOD WhatsApp Bot is now running!');
    console.log('📝 Type .help in WhatsApp to see available commands');
    
  } catch (error) {
    console.error('❌ Error starting the bot:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the bot
init();

/**
 * FX-GOD WhatsApp Bot
 * Version améliorée avec système de plugins (style Levanter)
 */

import { startBot } from './lib/baileys.js';
import { loadPlugins, getCommand, getCommands, canExecute } from './lib/plugin-manager.js';
import fs from 'fs-extra';
import qrcode from 'qrcode-terminal';
import config from './config.js';
import path from 'path';
import { userDB, groupDB } from './lib/database.js';

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

// Enrichir le message avec des fonctionnalités utiles
const enhanceMessage = (sock, message) => {
  const msg = {
    key: message.key,
    id: message.key.id,
    from: message.key.remoteJid,
    sender: message.key.fromMe ? sock.user.id : message.key.participant || message.key.remoteJid,
    isGroup: message.key.remoteJid.endsWith('@g.us'),
    content: message.message?.conversation || message.message?.extendedTextMessage?.text || '',
    mentions: message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [],
    quotedMsg: message.message?.extendedTextMessage?.contextInfo?.quotedMessage,
    isStatus: message.key.remoteJid === 'status@broadcast',
    hasMedia: !!(message.message?.imageMessage || message.message?.videoMessage),
    type: Object.keys(message.message || {})[0]
  };
  
  // Déterminer si c'est une commande
  const prefix = config.prefix;
  
  if (msg.content.startsWith(prefix)) {
    const [cmd, ...args] = msg.content.slice(prefix.length).trim().split(' ');
    msg.command = cmd.toLowerCase();
    msg.args = args;
  }
  
  // Ajouter des méthodes utiles
  msg.reply = async (text) => {
    return await sock.sendMessage(msg.from, { text }, { quoted: message });
  };
  
  msg.react = async (emoji) => {
    return await sock.sendMessage(msg.from, {
      react: {
        text: emoji,
        key: msg.key
      }
    });
  };
  
  return msg;
};

// Traiter une commande
const handleCommand = async (sock, msg) => {
      const command = getCommand(msg.command);
      
      if (!command) return; // Commande inconnue
      
      // Vérifier si l'utilisateur est propriétaire
      const isOwner = config.owner.includes(msg.sender.split('@')[0]);
      
      // Vérifier si l'utilisateur est admin du groupe
      let isAdmin = false;
      let isBotAdmin = false;
      
      if (msg.isGroup) {
        try {
          const groupMetadata = await sock.groupMetadata(msg.from);
          const participant = groupMetadata.participants.find(p => p.id === msg.sender);
          isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
          
          const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
          const bot = groupMetadata.participants.find(p => p.id === botId);
          isBotAdmin = bot?.admin === 'admin' || bot?.admin === 'superadmin';
        } catch (error) {
          console.error('Erreur:', error);
        }
      }
      
      // Vérifier les permissions
      const canExecuteResult = canExecute(command, msg, isAdmin, isOwner);
      if (!canExecuteResult.success) {
        if (canExecuteResult.reason === 'owner_only') {
          return msg.reply('❌ Cette commande est réservée au propriétaire du bot.');
        } else if (canExecuteResult.reason === 'admin_only') {
          return msg.reply('❌ Cette commande est réservée aux administrateurs du groupe.');
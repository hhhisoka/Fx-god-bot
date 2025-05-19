/**
 * FX-GOD WhatsApp Bot
 * A customizable WhatsApp bot based on Baileys with multiple plugins
 */

const { startBot } = require('./lib/baileys');
const { loadPlugins } = require('./lib/pluginLoader');
const config = require('./config');
const fs = require('fs-extra');
const qrcode = require('qrcode-terminal');

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

/**
 * Autoreadstatus plugin to automatically read status updates
 */
const config = require('../../config');

// Store auto read status setting
let autoReadEnabled = config.autoReadStatus || false;

const handler = async (ctx) => {
  const { args, reply } = ctx;
  
  if (!args[0]) {
    return reply(`🔍 Auto read status is currently ${autoReadEnabled ? 'enabled' : 'disabled'}`);
  }
  
  const action = args[0].toLowerCase();
  
  if (action === 'on' || action === 'enable') {
    autoReadEnabled = true;
    reply('✅ Status auto-read enabled. Bot will automatically read all status updates.');
  } else if (action === 'off' || action === 'disable') {
    autoReadEnabled = false;
    reply('✅ Status auto-read disabled. Bot will not automatically read status updates.');
  } else {
    reply('❌ Invalid option. Use .autoreadstatus on/off');
  }
};

// Status event handler
const statusHandler = async (sock, message) => {
  try {
    if (!autoReadEnabled) return;
    
    // Check if it's a status message
    if (message.key.remoteJid === 'status@broadcast') {
      // Mark as read
      await sock.readMessages([message.key]);
    }
  } catch (error) {
    console.error('Error in autoreadstatus handler:', error);
  }
};

module.exports = {
  command: 'autoreadstatus',
  aliases: ['readstatus', 'ars'],
  category: 'status',
  help: 'Automatically read all status updates',
  usage: '.autoreadstatus [on/off]',
  owner: true,
  handler,
  statusHandler,
  isEnabled: () => autoReadEnabled
};

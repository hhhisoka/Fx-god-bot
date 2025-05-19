/**
 * Alwaysonline plugin to keep bot always online
 */
const config = require('../../config');

// Store always online status
let alwaysOnlineEnabled = config.alwaysOnline || false;
let intervalId = null;

/**
 * Update presence to online
 * @param {Object} sock Baileys connection
 */
const updatePresence = async (sock) => {
  try {
    if (alwaysOnlineEnabled) {
      await sock.sendPresenceUpdate('available');
    }
  } catch (error) {
    console.error('Error updating presence:', error);
  }
};

/**
 * Start the always online interval
 * @param {Object} sock Baileys connection
 */
const startAlwaysOnline = (sock) => {
  // Clear existing interval if any
  if (intervalId) clearInterval(intervalId);
  
  if (alwaysOnlineEnabled) {
    // Update presence initially
    updatePresence(sock);
    
    // Set interval to update presence every 5 minutes
    intervalId = setInterval(() => updatePresence(sock), 5 * 60 * 1000);
  }
};

const handler = async (ctx) => {
  const { sock, args, reply } = ctx;
  
  if (!args[0]) {
    return reply(`🔍 Always online is currently ${alwaysOnlineEnabled ? 'enabled' : 'disabled'}`);
  }
  
  const action = args[0].toLowerCase();
  
  if (action === 'on' || action === 'enable') {
    alwaysOnlineEnabled = true;
    startAlwaysOnline(sock);
    reply('✅ Always online enabled. Bot will appear online at all times.');
  } else if (action === 'off' || action === 'disable') {
    alwaysOnlineEnabled = false;
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    reply('✅ Always online disabled. Bot will appear online normally.');
  } else {
    reply('❌ Invalid option. Use .alwaysonline on/off');
  }
};

// Connection event handler
const connectionHandler = async (sock, update) => {
  if (update.connection === 'open' && alwaysOnlineEnabled) {
    startAlwaysOnline(sock);
  }
};

module.exports = {
  command: 'alwaysonline',
  aliases: ['online', 'ao'],
  category: 'status',
  help: 'Keep the bot always online',
  usage: '.alwaysonline [on/off]',
  owner: true,
  handler,
  connectionHandler,
  isEnabled: () => alwaysOnlineEnabled
};

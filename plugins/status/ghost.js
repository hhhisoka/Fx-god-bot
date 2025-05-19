/**
 * Ghost plugin to keep bot offline/invisible
 */
const config = require('../../config');

// Store ghost mode status
let ghostModeEnabled = config.ghostMode || false;

/**
 * Update connection presence based on ghost mode
 * @param {Object} sock Baileys connection
 */
const updatePresence = async (sock) => {
  try {
    if (ghostModeEnabled) {
      // Set offline presence
      await sock.presenceSubscribe;
      await sock.updateProfileStatus('unavailable');
    }
  } catch (error) {
    console.error('Error updating presence:', error);
  }
};

const handler = async (ctx) => {
  const { sock, args, reply } = ctx;
  
  if (!args[0]) {
    return reply(`🔍 Ghost mode is currently ${ghostModeEnabled ? 'enabled' : 'disabled'}`);
  }
  
  const action = args[0].toLowerCase();
  
  if (action === 'on' || action === 'enable') {
    ghostModeEnabled = true;
    await updatePresence(sock);
    reply('👻 Ghost mode enabled. Bot will appear offline.');
  } else if (action === 'off' || action === 'disable') {
    ghostModeEnabled = false;
    reply('👻 Ghost mode disabled. Bot will appear online normally.');
  } else {
    reply('❌ Invalid option. Use .ghost on/off');
  }
};

// Connection event handler
const connectionHandler = async (sock, update) => {
  if (update.connection === 'open' && ghostModeEnabled) {
    // Apply ghost mode when connection opens
    await updatePresence(sock);
  }
};

module.exports = {
  command: 'ghost',
  category: 'status',
  help: 'Make the bot appear offline',
  usage: '.ghost [on/off]',
  owner: true,
  handler,
  connectionHandler,
  updatePresence,
  isEnabled: () => ghostModeEnabled
};

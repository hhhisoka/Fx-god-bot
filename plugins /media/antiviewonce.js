/**
 * Antiviewonce plugin to automatically reveal view once messages
 */
const { convertViewOnceToRegular } = require('../../lib/mediaHandler');
const { downloadMedia } = require('../../lib/utils');
const config = require('../../config');

// Store anti-viewonce status
let antiViewOnceEnabled = config.antiViewOnce || false;

const handler = async (ctx) => {
  const { args, reply } = ctx;
  
  if (!args[0]) {
    return reply(`🔍 Anti-view once is currently ${antiViewOnceEnabled ? 'enabled' : 'disabled'}`);
  }
  
  const action = args[0].toLowerCase();
  
  if (action === 'on' || action === 'enable') {
    antiViewOnceEnabled = true;
    reply('✅ Anti-view once enabled. Bot will automatically reveal view once messages.');
  } else if (action === 'off' || action === 'disable') {
    antiViewOnceEnabled = false;
    reply('✅ Anti-view once disabled. Bot will not reveal view once messages.');
  } else {
    reply('❌ Invalid option. Use .antiviewonce on/off');
  }
};

// Message event handler
const messageHandler = async (sock, message) => {
  try {
    if (!antiViewOnceEnabled) return;
    
    const from = message.key.remoteJid;
    if (!from) return;
    
    // Check if it's a view once message
    const msgType = Object.keys(message.message || {})[0];
    if (msgType !== 'viewOnceMessage') return;
    
    // Convert view once to regular message
    const convertedMsg = await convertViewOnceToRegular(sock, message);
    
    if (!convertedMsg) return;
    
    // Download and send the media
    const buffer = await downloadMedia(sock, convertedMsg);
    
    if (!buffer) return;
    
    // Determine media type
    const mediaType = Object.keys(convertedMsg.message)[0];
    
    if (mediaType === 'imageMessage') {
      // Get original caption if any
      const caption = convertedMsg.message.imageMessage.caption || '⚠️ View once image auto-revealed';
      
      await sock.sendMessage(from, {
        image: buffer,
        caption: caption + ' 👁️'
      });
    } else if (mediaType === 'videoMessage') {
      // Get original caption if any
      const caption = convertedMsg.message.videoMessage.caption || '⚠️ View once video auto-revealed';
      
      await sock.sendMessage(from, {
        video: buffer,
        caption: caption + ' 👁️'
      });
    }
  } catch (error) {
    console.error('Error in antiviewonce handler:', error);
  }
};

module.exports = {
  command: 'antiviewonce',
  aliases: ['avo', 'antivo'],
  category: 'media',
  help: 'Automatically reveal "view once" messages',
  usage: '.antiviewonce [on/off]',
  owner: true,
  handler,
  messageHandler,
  isEnabled: () => antiViewOnceEnabled
};

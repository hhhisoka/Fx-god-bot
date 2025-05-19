/**
 * VV plugin to view "view once" messages
 */
const { convertViewOnceToRegular } = require('../../lib/mediaHandler');
const { downloadMedia } = require('../../lib/utils');

const handler = async (ctx) => {
  const { sock, message, reply, from, quotedMsg } = ctx;
  
  if (!quotedMsg) {
    return reply('❌ Reply to a "view once" message to use this command.');
  }
  
  // Check if quoted message is view once
  const keys = Object.keys(quotedMsg);
  const isViewOnce = keys.includes('viewOnceMessage') || (
    (keys.includes('imageMessage') && quotedMsg.imageMessage?.viewOnce) ||
    (keys.includes('videoMessage') && quotedMsg.videoMessage?.viewOnce)
  );
  
  if (!isViewOnce) {
    return reply('❌ This is not a "view once" message.');
  }
  
  try {
    // Convert view once to regular message
    const convertedMsg = await convertViewOnceToRegular(sock, {
      message: quotedMsg,
      key: message.message.extendedTextMessage.contextInfo.quotedMessage
    });
    
    if (!convertedMsg) {
      return reply('❌ Failed to process "view once" message.');
    }
    
    // Download and send the media
    const buffer = await downloadMedia(sock, convertedMsg);
    
    if (!buffer) {
      return reply('❌ Failed to download media.');
    }
    
    // Determine media type
    const mediaType = Object.keys(convertedMsg.message)[0];
    
    if (mediaType === 'imageMessage') {
      // Get original caption if any
      const caption = convertedMsg.message.imageMessage.caption || 'View once image revealed 👁️';
      
      await sock.sendMessage(from, {
        image: buffer,
        caption
      }, { quoted: message });
    } else if (mediaType === 'videoMessage') {
      // Get original caption if any
      const caption = convertedMsg.message.videoMessage.caption || 'View once video revealed 👁️';
      
      await sock.sendMessage(from, {
        video: buffer,
        caption
      }, { quoted: message });
    } else {
      reply('❌ Unsupported media type.');
    }
  } catch (error) {
    console.error('Error in VV command:', error);
    reply('❌ An error occurred while processing the "view once" message.');
  }
};

module.exports = {
  command: 'vv',
  aliases: ['viewonce', 'view'],
  category: 'media',
  help: 'Reveal "view once" messages',
  usage: '.vv (reply to a view once message)',
  handler
};

/**
 * Sticker plugin for creating stickers from media
 */
const { createSticker } = require('../../lib/mediaHandler');
const { downloadMedia } = require('../../lib/utils');

const handler = async (ctx) => {
  const { sock, message, reply, from, args, msgType, quotedMsg } = ctx;
  
  try {
    // Check if media is in message or quoted message
    let buffer;
    let stickerName = 'FX-GOD';
    let stickerAuthor = 'Bot';
    
    // Parse sticker metadata if provided in args
    if (args.length >= 1) {
      const parts = args.join(' ').split('|').map(arg => arg.trim());
      if (parts[0]) stickerName = parts[0];
      if (parts[1]) stickerAuthor = parts[1];
    }
    
    // Check if message contains media
    if (msgType === 'imageMessage' || msgType === 'videoMessage') {
      // Media is in the message
      buffer = await downloadMedia(sock, message);
    } else if (quotedMsg) {
      // Media is in quoted message
      const quotedMsgType = Object.keys(quotedMsg)[0];
      if (
        quotedMsgType === 'imageMessage' || 
        quotedMsgType === 'videoMessage' ||
        quotedMsgType === 'stickerMessage'
      ) {
        // Create message object for the quoted message
        const quotedMessage = {
          message: quotedMsg,
          key: message.message.extendedTextMessage.contextInfo.quotedMessage
        };
        
        buffer = await downloadMedia(sock, quotedMessage);
      }
    }
    
    if (!buffer) {
      return reply('❌ No media found. Send or reply to an image or video to convert to sticker.');
    }
    
    // Send processing message
    await reply('⏳ Creating sticker...');
    
    // Create sticker
    const stickerBuffer = await createSticker(buffer, {
      pack: stickerName,
      author: stickerAuthor
    });
    
    // Send sticker
    await sock.sendMessage(from, {
      sticker: stickerBuffer
    }, { quoted: message });
    
  } catch (error) {
    console.error('Error creating sticker:', error);
    reply('❌ Failed to create sticker. Try again with a different image or video.');
  }
};

module.exports = {
  command: 'sticker',
  aliases: ['s', 'stiker'],
  category: 'media',
  help: 'Create a sticker from image or video',
  usage: '.sticker [name|author] (reply to media)',
  handler
};

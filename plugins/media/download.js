/**
 * Download plugin for downloading and saving media
 */
const { saveMedia } = require('../../lib/mediaHandler');
const { downloadMedia } = require('../../lib/utils');
const path = require('path');
const fs = require('fs-extra');
const config = require('../../config');

const handler = async (ctx) => {
  const { sock, message, reply, from, msgType, quotedMsg } = ctx;
  
  try {
    // Check if media is in message or quoted message
    let targetMessage = null;
    
    // Check if message contains media
    if (msgType === 'imageMessage' || msgType === 'videoMessage' || 
        msgType === 'audioMessage' || msgType === 'documentMessage' ||
        msgType === 'stickerMessage') {
      // Media is in the message
      targetMessage = message;
    } else if (quotedMsg) {
      // Media is in quoted message
      const quotedMsgType = Object.keys(quotedMsg)[0];
      if (
        quotedMsgType === 'imageMessage' || 
        quotedMsgType === 'videoMessage' ||
        quotedMsgType === 'audioMessage' ||
        quotedMsgType === 'documentMessage' ||
        quotedMsgType === 'stickerMessage'
      ) {
        // Create message object for the quoted message
        targetMessage = {
          message: quotedMsg,
          key: message.message.extendedTextMessage.contextInfo.quotedMessage
        };
      } else if (quotedMsgType === 'viewOnceMessage') {
        // View once message, handle specially
        const viewOnceType = Object.keys(quotedMsg.viewOnceMessage.message)[0];
        if (viewOnceType === 'imageMessage' || viewOnceType === 'videoMessage') {
          targetMessage = {
            message: {
              [viewOnceType]: quotedMsg.viewOnceMessage.message[viewOnceType]
            },
            key: message.message.extendedTextMessage.contextInfo.quotedMessage
          };
        }
      }
    }
    
    if (!targetMessage) {
      return reply('❌ No media found. Send or reply to media to download it.');
    }
    
    // Send processing message
    await reply('⏳ Downloading media...');
    
    // Save media to file
    const filePath = await saveMedia(sock, targetMessage);
    
    if (!filePath) {
      return reply('❌ Failed to download media. Try again with a different media.');
    }
    
    // Get file info
    const fileStats = await fs.stat(filePath);
    const fileSize = (fileStats.size / (1024 * 1024)).toFixed(2); // Size in MB
    const fileName = path.basename(filePath);
    
    // Send success message
    await reply(`✅ Media downloaded successfully!\n\n*File:* ${fileName}\n*Size:* ${fileSize} MB\n*Saved to:* ${filePath}`);
    
  } catch (error) {
    console.error('Error downloading media:', error);
    reply('❌ Failed to download media. Try again with a different media.');
  }
};

module.exports = {
  command: 'download',
  aliases: ['dl', 'save'],
  category: 'media',
  help: 'Download and save media files',
  usage: '.download (reply to media)',
  handler
};

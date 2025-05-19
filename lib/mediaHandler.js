/**
 * Media handler for FX-GOD WhatsApp Bot
 */
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

/**
 * Create a sticker from image or video buffer
 * @param {Buffer} buffer Image or video buffer
 * @param {Object} options Sticker options
 * @returns {Buffer} Sticker buffer
 */
const createSticker = async (buffer, options = {}) => {
  try {
    const tempFile = path.join(config.tempDir, `${uuidv4()}`);
    const outputFile = `${tempFile}.webp`;
    
    await fs.writeFile(tempFile, buffer);
    
    // Check if buffer is video or image
    const fileType = await getFileType(buffer);
    const isVideo = fileType?.mime?.startsWith('video/');
    
    if (isVideo) {
      await new Promise((resolve, reject) => {
        ffmpeg(tempFile)
          .inputFormat(fileType.ext)
          .on('error', reject)
          .on('end', resolve)
          .addOutputOptions([
            '-vf', `scale=512:512:force_original_aspect_ratio=decrease,fps=10,crop=512:512`,
            '-loop', '0',
            '-ss', '0',
            '-t', '3',
            '-preset', 'default',
            '-an',
            '-vsync', '0',
            '-s', '512x512'
          ])
          .toFormat('webp')
          .save(outputFile);
      });
    } else {
      // Image processing
      await sharp(buffer)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 95 })
        .toFile(outputFile);
    }
    
    const stickerBuffer = await fs.readFile(outputFile);
    
    // Clean up temp files
    await fs.unlink(tempFile).catch(() => {});
    await fs.unlink(outputFile).catch(() => {});
    
    return stickerBuffer;
  } catch (error) {
    console.error('Error creating sticker:', error);
    throw error;
  }
};

/**
 * Get file type based on buffer
 * @param {Buffer} buffer File buffer
 * @returns {Object} File type information
 */
const getFileType = async (buffer) => {
  // Simple file type detection based on magic numbers
  const header = buffer.slice(0, 4);
  
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  } else if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    return { mime: 'image/png', ext: 'png' };
  } else if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
    return { mime: 'image/gif', ext: 'gif' };
  } else if (header[0] === 0x00 && header[1] === 0x00 && header[2] === 0x00 && header[3] === 0x18) {
    return { mime: 'video/mp4', ext: 'mp4' };
  } else if (header[0] === 0x1A && header[1] === 0x45 && header[2] === 0xDF && header[3] === 0xA3) {
    return { mime: 'video/webm', ext: 'webm' };
  }
  
  return { mime: 'application/octet-stream', ext: 'bin' };
};

/**
 * Convert view once media to regular media
 * @param {Object} sock Baileys connection object
 * @param {Object} message Message object containing view once
 * @returns {Object} Message with viewOnce converted to regular media
 */
const convertViewOnceToRegular = async (sock, message) => {
  try {
    if (!message.message?.viewOnceMessage) return null;
    
    const viewOnceMsg = message.message.viewOnceMessage.message;
    const type = Object.keys(viewOnceMsg)[0];
    
    if (type === 'imageMessage') {
      return {
        ...message,
        message: {
          imageMessage: {
            ...viewOnceMsg.imageMessage,
            viewOnce: false
          }
        }
      };
    } else if (type === 'videoMessage') {
      return {
        ...message,
        message: {
          videoMessage: {
            ...viewOnceMsg.videoMessage,
            viewOnce: false
          }
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error converting view once media:', error);
    return null;
  }
};

/**
 * Save media from message
 * @param {Object} sock Baileys connection object
 * @param {Object} message Message object
 * @param {string} [filename] Optional filename, generates UUID if not provided
 * @returns {string|null} Path to saved media or null
 */
const saveMedia = async (sock, message, filename) => {
  try {
    const buffer = await sock.downloadMediaMessage(message);
    if (!buffer) return null;
    
    const msgType = Object.keys(message.message || {})[0];
    let fileExt = 'bin';
    
    // Determine file extension
    if (msgType === 'imageMessage') {
      fileExt = 'jpg';
    } else if (msgType === 'videoMessage') {
      fileExt = 'mp4';
    } else if (msgType === 'audioMessage') {
      fileExt = message.message.audioMessage.ptt ? 'ogg' : 'mp3';
    } else if (msgType === 'stickerMessage') {
      fileExt = 'webp';
    } else if (msgType === 'documentMessage') {
      fileExt = message.message.documentMessage.fileName.split('.').pop() || 'bin';
    }
    
    // Generate filename if not provided
    if (!filename) {
      filename = `${uuidv4()}.${fileExt}`;
    }
    
    const filePath = path.join(config.mediaDir, filename);
    await fs.writeFile(filePath, buffer);
    
    return filePath;
  } catch (error) {
    console.error('Error saving media:', error);
    return null;
  }
};

module.exports = {
  createSticker,
  getFileType,
  convertViewOnceToRegular,
  saveMedia
};

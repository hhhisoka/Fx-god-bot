/**
 * Advanced image editing plugin for FX-GOD WhatsApp Bot
 */
const { downloadMedia } = require('../../lib/utils');
const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');

/**
 * Apply filter to image
 * @param {Buffer} buffer Image buffer
 * @param {string} filter Filter type
 * @returns {Promise<Buffer>} Edited image buffer
 */
const applyFilter = async (buffer, filter) => {
  let sharpImage = sharp(buffer);
  
  switch (filter.toLowerCase()) {
    case 'grayscale':
      sharpImage = sharpImage.grayscale();
      break;
    case 'sepia':
      sharpImage = sharpImage.sepia();
      break;
    case 'negative':
      sharpImage = sharpImage.negate();
      break;
    case 'blur':
      sharpImage = sharpImage.blur(10);
      break;
    case 'sharpen':
      sharpImage = sharpImage.sharpen();
      break;
    case 'vintage':
      sharpImage = sharpImage.tint({ r: 255, g: 240, b: 192 }).gamma(0.87);
      break;
    case 'brightness':
      sharpImage = sharpImage.modulate({ brightness: 1.5 });
      break;
    case 'contrast':
      sharpImage = sharpImage.modulate({ contrast: 1.5 });
      break;
    default:
      return buffer; // Return original if filter not recognized
  }
  
  return await sharpImage.toBuffer();
};

/**
 * Resize image with specific dimensions
 * @param {Buffer} buffer Image buffer
 * @param {number} width Target width
 * @param {number} height Target height
 * @returns {Promise<Buffer>} Resized image buffer
 */
const resizeImage = async (buffer, width, height) => {
  return await sharp(buffer)
    .resize(width, height, { fit: 'cover' })
    .toBuffer();
};

/**
 * Crop image to specific dimensions
 * @param {Buffer} buffer Image buffer
 * @param {number} left Left position
 * @param {number} top Top position
 * @param {number} width Width
 * @param {number} height Height
 * @returns {Promise<Buffer>} Cropped image buffer
 */
const cropImage = async (buffer, left, top, width, height) => {
  return await sharp(buffer)
    .extract({ left, top, width, height })
    .toBuffer();
};

/**
 * Rotate image by degrees
 * @param {Buffer} buffer Image buffer
 * @param {number} angle Rotation angle in degrees
 * @returns {Promise<Buffer>} Rotated image buffer
 */
const rotateImage = async (buffer, angle) => {
  return await sharp(buffer)
    .rotate(angle)
    .toBuffer();
};

/**
 * Add border to image
 * @param {Buffer} buffer Image buffer
 * @param {number} width Border width in pixels
 * @param {string} color Border color in hex
 * @returns {Promise<Buffer>} Image with border
 */
const addBorder = async (buffer, width, color) => {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  
  return await sharp({
    create: {
      width: metadata.width + (width * 2),
      height: metadata.height + (width * 2),
      channels: 4,
      background: color || '#FFFFFF'
    }
  })
    .composite([{
      input: buffer,
      top: width,
      left: width
    }])
    .toBuffer();
};

/**
 * Add watermark text to image
 * @param {Buffer} buffer Image buffer
 * @param {string} text Watermark text
 * @returns {Promise<Buffer>} Image with watermark
 */
const addWatermark = async (buffer, text) => {
  // Create temporary files for ffmpeg processing
  const tempInput = path.join(config.tempDir, `${uuidv4()}.jpg`);
  const tempOutput = path.join(config.tempDir, `${uuidv4()}_wm.jpg`);
  
  try {
    // Save input buffer to temp file
    await fs.writeFile(tempInput, buffer);
    
    // Use sharp to process the image and add text directly
    const metadata = await sharp(buffer).metadata();
    const fontSize = Math.floor(metadata.width / 20); // Proportional font size
    
    // Use SVG to create text overlay
    const svgText = `
      <svg width="${metadata.width}" height="${metadata.height}">
        <style>
          .text {
            fill: rgba(255, 255, 255, 0.5);
            font-family: sans-serif;
            font-size: ${fontSize}px;
            font-weight: bold;
          }
        </style>
        <text x="50%" y="90%" text-anchor="middle" class="text">${text}</text>
      </svg>
    `;
    
    const processedBuffer = await sharp(buffer)
      .composite([{
        input: Buffer.from(svgText),
        gravity: 'southeast'
      }])
      .toBuffer();
    
    // Clean up temp files
    await fs.unlink(tempInput).catch(() => {});
    
    return processedBuffer;
  } catch (error) {
    console.error('Error adding watermark:', error);
    // Clean up if error occurs
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    throw error;
  }
};

/**
 * Apply specific edit operation to image
 * @param {Buffer} buffer Image buffer
 * @param {string} operation Edit operation
 * @param {string} params Operation parameters
 * @returns {Promise<Buffer>} Edited image buffer
 */
const editImage = async (buffer, operation, params) => {
  try {
    switch (operation.toLowerCase()) {
      case 'filter':
        return await applyFilter(buffer, params);
      case 'resize':
        const [width, height] = params.split('x').map(dim => parseInt(dim));
        return await resizeImage(buffer, width, height);
      case 'crop':
        const [left, top, w, h] = params.split(',').map(dim => parseInt(dim));
        return await cropImage(buffer, left, top, w, h);
      case 'rotate':
        const angle = parseInt(params);
        return await rotateImage(buffer, angle);
      case 'border':
        const [borderWidth, borderColor] = params.split(',');
        return await addBorder(buffer, parseInt(borderWidth), borderColor);
      case 'watermark':
        return await addWatermark(buffer, params);
      default:
        return buffer; // Return original if operation not recognized
    }
  } catch (error) {
    console.error(`Error in edit operation ${operation}:`, error);
    throw error;
  }
};

const handler = async (ctx) => {
  const { sock, message, reply, args, from, msgType, quotedMsg } = ctx;
  
  if (!args[0]) {
    // Send help message if no arguments provided
    return await reply(`*🖼️ Image Edit Commands:*\n\n` +
      `*Filters:*\n` +
      `.imageedit filter grayscale\n` +
      `.imageedit filter sepia\n` +
      `.imageedit filter negative\n` +
      `.imageedit filter blur\n` +
      `.imageedit filter sharpen\n` +
      `.imageedit filter vintage\n` +
      `.imageedit filter brightness\n` +
      `.imageedit filter contrast\n\n` +
      `*Transformations:*\n` +
      `.imageedit resize [width]x[height]\n` +
      `.imageedit crop [left],[top],[width],[height]\n` +
      `.imageedit rotate [angle]\n\n` +
      `*Decorations:*\n` +
      `.imageedit border [width],[color]\n` +
      `.imageedit watermark [text]\n\n` +
      `_Reply to an image to apply edits_`);
  }
  
  // Check for quoted message with image
  let targetMessage = null;
  
  if (quotedMsg) {
    const quotedMsgType = Object.keys(quotedMsg)[0];
    if (quotedMsgType === 'imageMessage') {
      targetMessage = {
        message: quotedMsg,
        key: message.message.extendedTextMessage.contextInfo.quotedMessage
      };
    }
  } else if (msgType === 'imageMessage') {
    targetMessage = message;
  }
  
  if (!targetMessage) {
    return await reply('❌ Veuillez répondre à une image pour utiliser cette commande!');
  }
  
  try {
    // Send processing message
    await reply('⌛ Traitement de l\'image en cours...');
    
    // Download the media
    const mediaBuffer = await downloadMedia(sock, targetMessage);
    if (!mediaBuffer) {
      return await reply('❌ Impossible de télécharger l\'image!');
    }
    
    const operation = args[0].toLowerCase();
    const params = args.slice(1).join(' ');
    
    // Apply edits based on operation
    const editedImageBuffer = await editImage(mediaBuffer, operation, params);
    
    // Send edited image
    await sock.sendMessage(from, { 
      image: editedImageBuffer,
      caption: `✅ Image éditée avec succès.\n*Opération:* ${operation}\n*Paramètres:* ${params}`
    }, { quoted: message });
    
  } catch (error) {
    console.error('Error in image edit command:', error);
    await reply(`❌ Erreur lors de l'édition de l'image: ${error.message}`);
  }
};

module.exports = {
  command: 'imageedit',
  aliases: ['iedit', 'editimg'],
  category: 'media',
  help: 'Fonctionnalités avancées d\'édition d\'images',
  usage: '.imageedit [operation] [params] (en réponse à une image)',
  handler
};
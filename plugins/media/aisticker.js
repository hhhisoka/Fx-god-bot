/**
 * AI Sticker plugin to generate custom stickers from text descriptions
 */
const { createSticker } = require('../../lib/mediaHandler');
const { downloadFile } = require('../../lib/utils');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');

const handler = async (ctx) => {
  const { sock, message, reply, args, from } = ctx;
  
  if (!args.length) {
    return reply(`⚠️ Veuillez fournir une description pour générer un sticker.
Exemple: ${config.prefix}aisticker un chat mignon qui joue avec une balle`);
  }
  
  // Get the prompt from args
  const prompt = args.join(' ');
  
  // Send processing message
  const processingMsg = await reply('⏳ Génération du sticker en cours...');
  
  try {
    // Use Unsplash API for image search based on prompt
    // Note: This could be replaced with an actual AI image generator API in a real implementation
    const response = await axios.get('https://source.unsplash.com/featured/', {
      params: { query: prompt },
      responseType: 'arraybuffer'
    });
    
    if (!response.data) {
      return reply('❌ Échec de la génération d\'image. Veuillez réessayer avec une autre description.');
    }
    
    // Save image to temp directory
    const imagePath = path.join(config.tempDir, `${Date.now()}.jpg`);
    await fs.writeFile(imagePath, Buffer.from(response.data));
    
    // Create sticker from image
    const imageBuffer = await fs.readFile(imagePath);
    const stickerBuffer = await createSticker(imageBuffer, {
      pack: 'FX-GOD',
      author: 'AI Sticker'
    });
    
    // Send sticker
    await sock.sendMessage(from, {
      sticker: stickerBuffer
    }, { quoted: message });
    
    // Delete temp file
    await fs.unlink(imagePath);
    
  } catch (error) {
    console.error('Error generating AI sticker:', error);
    reply('❌ Une erreur est survenue lors de la génération du sticker. Veuillez réessayer.');
  }
};

module.exports = {
  command: 'aisticker',
  aliases: ['ais', 'aistick'],
  category: 'media',
  help: 'Générer un sticker à partir d\'une description textuelle',
  usage: '.aisticker [description]',
  handler
};
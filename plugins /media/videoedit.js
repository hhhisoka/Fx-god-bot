/**
 * Advanced video editing plugin for FX-GOD WhatsApp Bot
 */
const { downloadMedia } = require('../../lib/utils');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const config = require('../../config');

/**
 * Trim video to specified start and end times
 * @param {Buffer} buffer Video buffer
 * @param {number} startTime Start time in seconds
 * @param {number} endTime End time in seconds
 * @returns {Promise<Buffer>} Trimmed video buffer
 */
const trimVideo = async (buffer, startTime, endTime) => {
  const tempInput = path.join(config.tempDir, `${uuidv4()}.mp4`);
  const tempOutput = path.join(config.tempDir, `${uuidv4()}_trim.mp4`);
  
  try {
    await fs.writeFile(tempInput, buffer);
    
    await new Promise((resolve, reject) => {
      ffmpeg(tempInput)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(tempOutput)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    
    const outputBuffer = await fs.readFile(tempOutput);
    
    // Clean up temp files
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    
    return outputBuffer;
  } catch (error) {
    console.error('Error trimming video:', error);
    // Clean up if error occurs
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    throw error;
  }
};

/**
 * Change video speed
 * @param {Buffer} buffer Video buffer
 * @param {number} speed Speed multiplier (0.5 for half speed, 2 for double speed)
 * @returns {Promise<Buffer>} Speed-adjusted video buffer
 */
const changeSpeed = async (buffer, speed) => {
  const tempInput = path.join(config.tempDir, `${uuidv4()}.mp4`);
  const tempOutput = path.join(config.tempDir, `${uuidv4()}_speed.mp4`);
  
  try {
    await fs.writeFile(tempInput, buffer);
    
    await new Promise((resolve, reject) => {
      ffmpeg(tempInput)
        .videoFilters(`setpts=${1/speed}*PTS`)
        .audioFilters(`atempo=${speed}`)
        .output(tempOutput)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    
    const outputBuffer = await fs.readFile(tempOutput);
    
    // Clean up temp files
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    
    return outputBuffer;
  } catch (error) {
    console.error('Error changing video speed:', error);
    // Clean up if error occurs
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    throw error;
  }
};

/**
 * Add text overlay to video
 * @param {Buffer} buffer Video buffer
 * @param {string} text Text to add
 * @param {string} position Position (top, bottom, center)
 * @returns {Promise<Buffer>} Video with text overlay
 */
const addTextOverlay = async (buffer, text, position) => {
  const tempInput = path.join(config.tempDir, `${uuidv4()}.mp4`);
  const tempOutput = path.join(config.tempDir, `${uuidv4()}_text.mp4`);
  
  try {
    await fs.writeFile(tempInput, buffer);
    
    let positionValue = '';
    switch (position.toLowerCase()) {
      case 'top':
        positionValue = '(w-text_w)/2:10';
        break;
      case 'bottom':
        positionValue = '(w-text_w)/2:h-th-10';
        break;
      case 'center':
      default:
        positionValue = '(w-text_w)/2:(h-text_h)/2';
        break;
    }
    
    await new Promise((resolve, reject) => {
      ffmpeg(tempInput)
        .videoFilters({
          filter: 'drawtext',
          options: {
            text: text,
            fontsize: 24,
            fontcolor: 'white',
            x: positionValue.split(':')[0],
            y: positionValue.split(':')[1],
            shadowcolor: 'black',
            shadowx: 2,
            shadowy: 2
          }
        })
        .output(tempOutput)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    
    const outputBuffer = await fs.readFile(tempOutput);
    
    // Clean up temp files
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    
    return outputBuffer;
  } catch (error) {
    console.error('Error adding text overlay:', error);
    // Clean up if error occurs
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    throw error;
  }
};

/**
 * Convert video to GIF
 * @param {Buffer} buffer Video buffer
 * @param {number} fps Frames per second for the GIF
 * @returns {Promise<Buffer>} GIF buffer
 */
const convertToGif = async (buffer, fps) => {
  const tempInput = path.join(config.tempDir, `${uuidv4()}.mp4`);
  const tempOutput = path.join(config.tempDir, `${uuidv4()}.gif`);
  
  try {
    await fs.writeFile(tempInput, buffer);
    
    await new Promise((resolve, reject) => {
      ffmpeg(tempInput)
        .outputOptions([
          `-vf fps=${fps || 10},scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`
        ])
        .output(tempOutput)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    
    const outputBuffer = await fs.readFile(tempOutput);
    
    // Clean up temp files
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    
    return outputBuffer;
  } catch (error) {
    console.error('Error converting to GIF:', error);
    // Clean up if error occurs
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    throw error;
  }
};

/**
 * Extract audio from video
 * @param {Buffer} buffer Video buffer
 * @returns {Promise<Buffer>} Audio buffer
 */
const extractAudio = async (buffer) => {
  const tempInput = path.join(config.tempDir, `${uuidv4()}.mp4`);
  const tempOutput = path.join(config.tempDir, `${uuidv4()}.mp3`);
  
  try {
    await fs.writeFile(tempInput, buffer);
    
    await new Promise((resolve, reject) => {
      ffmpeg(tempInput)
        .noVideo()
        .audioCodec('libmp3lame')
        .output(tempOutput)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    
    const outputBuffer = await fs.readFile(tempOutput);
    
    // Clean up temp files
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    
    return outputBuffer;
  } catch (error) {
    console.error('Error extracting audio:', error);
    // Clean up if error occurs
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    throw error;
  }
};

/**
 * Apply filter to video
 * @param {Buffer} buffer Video buffer
 * @param {string} filter Filter type
 * @returns {Promise<Buffer>} Filtered video buffer
 */
const applyVideoFilter = async (buffer, filter) => {
  const tempInput = path.join(config.tempDir, `${uuidv4()}.mp4`);
  const tempOutput = path.join(config.tempDir, `${uuidv4()}_filter.mp4`);
  
  try {
    await fs.writeFile(tempInput, buffer);
    
    let filterValue = '';
    switch (filter.toLowerCase()) {
      case 'grayscale':
        filterValue = 'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3';
        break;
      case 'sepia':
        filterValue = 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131';
        break;
      case 'negative':
        filterValue = 'negate';
        break;
      case 'blur':
        filterValue = 'boxblur=5:1';
        break;
      case 'sharpen':
        filterValue = 'unsharp=5:5:1.5:5:5:1.5';
        break;
      case 'contrast':
        filterValue = 'eq=contrast=1.5';
        break;
      case 'vintage':
        filterValue = 'curves=vintage';
        break;
      default:
        // Return original if filter not recognized
        return buffer;
    }
    
    await new Promise((resolve, reject) => {
      ffmpeg(tempInput)
        .videoFilters(filterValue)
        .output(tempOutput)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    
    const outputBuffer = await fs.readFile(tempOutput);
    
    // Clean up temp files
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    
    return outputBuffer;
  } catch (error) {
    console.error('Error applying video filter:', error);
    // Clean up if error occurs
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    throw error;
  }
};

/**
 * Process video with specified operation
 * @param {Buffer} buffer Video buffer
 * @param {string} operation Operation type
 * @param {string} params Operation parameters
 * @returns {Promise<Buffer>} Processed video buffer
 */
const editVideo = async (buffer, operation, params) => {
  try {
    switch (operation.toLowerCase()) {
      case 'trim':
        const [startTime, endTime] = params.split(',').map(t => parseFloat(t));
        return await trimVideo(buffer, startTime, endTime);
      case 'speed':
        const speed = parseFloat(params);
        return await changeSpeed(buffer, speed);
      case 'text':
        const [text, position] = params.split('|');
        return await addTextOverlay(buffer, text, position || 'bottom');
      case 'gif':
        const fps = parseInt(params) || 10;
        return await convertToGif(buffer, fps);
      case 'audio':
        return await extractAudio(buffer);
      case 'filter':
        return await applyVideoFilter(buffer, params);
      default:
        return buffer; // Return original if operation not recognized
    }
  } catch (error) {
    console.error(`Error in video edit operation ${operation}:`, error);
    throw error;
  }
};

const handler = async (ctx) => {
  const { sock, message, reply, args, from, msgType, quotedMsg } = ctx;
  
  if (!args[0]) {
    // Send help message if no arguments provided
    return await reply(`*🎬 Video Edit Commands:*\n\n` +
      `*Transformations:*\n` +
      `.videoedit trim [start_sec],[end_sec]\n` +
      `.videoedit speed [multiplier]\n` +
      `.videoedit text [text]|[position]\n` +
      `_Positions: top, bottom, center_\n\n` +
      `*Conversions:*\n` +
      `.videoedit gif [fps]\n` +
      `.videoedit audio\n\n` +
      `*Filters:*\n` +
      `.videoedit filter grayscale\n` +
      `.videoedit filter sepia\n` +
      `.videoedit filter negative\n` +
      `.videoedit filter blur\n` +
      `.videoedit filter sharpen\n` +
      `.videoedit filter contrast\n` +
      `.videoedit filter vintage\n\n` +
      `_Reply to a video to apply edits_`);
  }
  
  // Check for quoted message with video
  let targetMessage = null;
  
  if (quotedMsg) {
    const quotedMsgType = Object.keys(quotedMsg)[0];
    if (quotedMsgType === 'videoMessage') {
      targetMessage = {
        message: quotedMsg,
        key: message.message.extendedTextMessage.contextInfo.quotedMessage
      };
    }
  } else if (msgType === 'videoMessage') {
    targetMessage = message;
  }
  
  if (!targetMessage) {
    return await reply('❌ Veuillez répondre à une vidéo pour utiliser cette commande!');
  }
  
  try {
    // Send processing message
    await reply('⌛ Traitement de la vidéo en cours... Cela peut prendre un moment.');
    
    // Download the media
    const mediaBuffer = await downloadMedia(sock, targetMessage);
    if (!mediaBuffer) {
      return await reply('❌ Impossible de télécharger la vidéo!');
    }
    
    const operation = args[0].toLowerCase();
    const params = args.slice(1).join(' ');
    
    // Apply edits based on operation
    const editedVideoBuffer = await editVideo(mediaBuffer, operation, params);
    
    // Define message type based on operation
    let messageContent = {};
    if (operation === 'gif') {
      messageContent = { 
        video: editedVideoBuffer,
        gifPlayback: true,
        caption: `✅ Vidéo convertie en GIF.\n*FPS:* ${params || '10'}`
      };
    } else if (operation === 'audio') {
      messageContent = { 
        audio: editedVideoBuffer,
        mimetype: 'audio/mp3',
        caption: `✅ Audio extrait de la vidéo.`
      };
    } else {
      messageContent = { 
        video: editedVideoBuffer,
        caption: `✅ Vidéo éditée avec succès.\n*Opération:* ${operation}\n*Paramètres:* ${params}`
      };
    }
    
    // Send edited video
    await sock.sendMessage(from, messageContent, { quoted: message });
    
  } catch (error) {
    console.error('Error in video edit command:', error);
    await reply(`❌ Erreur lors de l'édition de la vidéo: ${error.message}`);
  }
};

module.exports = {
  command: 'videoedit',
  aliases: ['vedit', 'editvid'],
  category: 'media',
  help: 'Fonctionnalités avancées d\'édition vidéo',
  usage: '.videoedit [operation] [params] (en réponse à une vidéo)',
  handler
};
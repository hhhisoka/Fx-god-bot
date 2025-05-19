/**
 * Utility functions for FX-GOD WhatsApp Bot
 */
import fs from 'fs-extra';
import axios from 'axios';
import { jidDecode } from '@adiwajshing/baileys';
import config from '../config';

/**
 * Extract command and arguments from message text
 * @param {string} text The message text
 * @param {string} prefix Command prefix
 * @returns {Object} Object containing command and arguments
 */
const extractCommandAndArgs = (text, prefix = config.prefix) => {
  const [commandWithPrefix, ...args] = text.trim().split(' ');
  const command = commandWithPrefix.slice(prefix.length).toLowerCase();
  return { command, args };
};

/**
 * Check if a user is a group admin
 * @param {Object} sock Baileys connection object
 * @param {string} groupId The group JID
 * @param {string} userId The user JID
 * @returns {boolean} True if user is admin
 */
const isGroupAdmin = async (sock, groupId, userId) => {
  try {
    if (!groupId.endsWith('@g.us')) return false;
    
    const { participants } = await sock.groupMetadata(groupId);
    const groupAdmins = participants
      .filter(p => p.admin)
      .map(p => p.id);
    
    return groupAdmins.includes(userId);
  } catch (error) {
    console.error('Error checking group admin:', error);
    return false;
  }
};

/**
 * Check if the bot is a group admin
 * @param {Object} sock Baileys connection object
 * @param {string} groupId The group JID
 * @returns {boolean} True if bot is admin
 */
const isBotAdmin = async (sock, groupId) => {
  try {
    if (!groupId.endsWith('@g.us')) return false;
    
    const botJid = sock.user.id;
    return await isGroupAdmin(sock, groupId, botJid);
  } catch (error) {
    console.error('Error checking bot admin status:', error);
    return false;
  }
};

/**
 * Get all participants in a group
 * @param {Object} sock Baileys connection object
 * @param {string} groupId The group JID
 * @returns {Array} Array of participant objects
 */
const getGroupParticipants = async (sock, groupId) => {
  try {
    if (!groupId.endsWith('@g.us')) return [];
    
    const { participants } = await sock.groupMetadata(groupId);
    return participants;
  } catch (error) {
    console.error('Error getting group participants:', error);
    return [];
  }
};

/**
 * Download media from a message
 * @param {Object} sock Baileys connection object
 * @param {Object} message The message object
 * @returns {Buffer|null} Buffer containing the media or null
 */
const downloadMedia = async (sock, message) => {
  try {
    const msgType = Object.keys(message.message || {})[0];
    if (!msgType) return null;
    
    let mediaMessage;
    if (msgType === 'imageMessage') {
      mediaMessage = message.message.imageMessage;
    } else if (msgType === 'videoMessage') {
      mediaMessage = message.message.videoMessage;
    } else if (msgType === 'audioMessage') {
      mediaMessage = message.message.audioMessage;
    } else if (msgType === 'stickerMessage') {
      mediaMessage = message.message.stickerMessage;
    } else if (msgType === 'documentMessage') {
      mediaMessage = message.message.documentMessage;
    } else if (msgType === 'viewOnceMessage') {
      const viewOnceType = Object.keys(message.message.viewOnceMessage.message)[0];
      if (viewOnceType === 'imageMessage') {
        mediaMessage = message.message.viewOnceMessage.message.imageMessage;
      } else if (viewOnceType === 'videoMessage') {
        mediaMessage = message.message.viewOnceMessage.message.videoMessage;
      }
    } else {
      return null;
    }
    
    if (!mediaMessage) return null;
    
    const buffer = await sock.downloadMediaMessage(message);
    return buffer;
  } catch (error) {
    console.error('Error downloading media:', error);
    return null;
  }
};

/**
 * Download file from URL
 * @param {string} url The URL to download
 * @param {string} [path=null] Optional path to save file
 * @returns {Buffer|boolean} Buffer or true if saved to path, false on error
 */
const downloadFile = async (url, path = null) => {
  try {
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'arraybuffer'
    });
    
    if (path) {
      await fs.writeFile(path, response.data);
      return true;
    }
    
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error downloading file:', error);
    return false;
  }
};

/**
 * Format a phone number to a JID
 * @param {string} phoneNumber The phone number
 * @returns {string} Formatted JID
 */
const formatJid = (phoneNumber) => {
  if (phoneNumber.startsWith('+')) {
    phoneNumber = phoneNumber.slice(1);
  }
  
  phoneNumber = phoneNumber.replace(/[- ]/g, '');
  
  return `${phoneNumber}@s.whatsapp.net`;
};

/**
 * Get JID from participant or JID string
 * @param {string} jid The JID string
 * @returns {string} Normalized JID
 */
const getJID = (jid) => {
  if (!jid) return '';
  return jidDecode(jid)?.user || jid;
};

/**
 * Send a typing indicator
 * @param {Object} sock Baileys connection object
 * @param {string} jid Chat JID
 * @param {number} duration Duration in ms
 */
const sendTyping = async (sock, jid, duration = 1000) => {
  await sock.presenceSubscribe(jid);
  await sock.sendPresenceUpdate('composing', jid);
  
  setTimeout(async () => {
    await sock.sendPresenceUpdate('paused', jid);
  }, duration);
};

/**
 * Check if a URL is a valid link
 * @param {string} text Text to check
 * @returns {boolean} True if it's a valid link
 */
const isUrl = (text) => {
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi;
  return urlRegex.test(text);
};

/**
 * Format seconds to HH:MM:SS
 * @param {number} seconds Number of seconds
 * @returns {string} Formatted time
 */
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
};

export default {
  extractCommandAndArgs,
  isGroupAdmin,
  isBotAdmin,
  getGroupParticipants,
  downloadMedia,
  downloadFile,
  formatJid,
  getJID,
  sendTyping,
  isUrl,
  formatTime,
};
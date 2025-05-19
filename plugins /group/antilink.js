/**
 * Antilink plugin to block links in groups
 */
const { isUrl, isGroupAdmin } = require('../../lib/utils');
const config = require('../../config');

// Store for groups with antilink enabled
const antiLinkGroups = new Set();

// If global setting is enabled, add it by default
if (config.antiLink) {
  // This will populate when groups are loaded
}

const handler = async (ctx) => {
  const { sock, from, args, reply } = ctx;
  
  // Check if in group
  if (!from.endsWith('@g.us')) {
    return reply('❌ This command can only be used in groups.');
  }
  
  if (!args[0]) {
    const status = antiLinkGroups.has(from) ? 'enabled' : 'disabled';
    return reply(`🔗 Antilink is currently ${status} in this group.\n\nUse .antilink on/off to change.`);
  }
  
  const action = args[0].toLowerCase();
  
  if (action === 'on' || action === 'enable') {
    antiLinkGroups.add(from);
    reply('✅ Antilink is now enabled. Links will be blocked.');
  } else if (action === 'off' || action === 'disable') {
    antiLinkGroups.delete(from);
    reply('✅ Antilink is now disabled. Links are allowed.');
  } else {
    reply('❌ Invalid option. Use .antilink on/off.');
  }
};

// Message event handler for checking links
const messageHandler = async (sock, message) => {
  try {
    // Check if it's a group message
    const from = message.key.remoteJid;
    if (!from || !from.endsWith('@g.us')) return;
    
    // Check if antilink is enabled for this group
    if (!antiLinkGroups.has(from)) return;
    
    // Skip messages from self
    if (message.key.fromMe) return;
    
    // Get message content
    const msgType = Object.keys(message.message || {})[0];
    if (!msgType) return;
    
    // Get message text
    let messageText;
    if (msgType === 'conversation') {
      messageText = message.message.conversation;
    } else if (msgType === 'extendedTextMessage') {
      messageText = message.message.extendedTextMessage.text;
    } else if (msgType === 'imageMessage' && message.message.imageMessage.caption) {
      messageText = message.message.imageMessage.caption;
    } else if (msgType === 'videoMessage' && message.message.videoMessage.caption) {
      messageText = message.message.videoMessage.caption;
    } else {
      return;
    }
    
    // Check if message contains a URL
    if (!isUrl(messageText)) return;
    
    // Get sender JID
    const sender = message.key.participant || message.key.remoteJid;
    
    // Skip if sender is admin
    if (await isGroupAdmin(sock, from, sender)) return;
    
    // Reply warning
    await sock.sendMessage(from, {
      text: `⚠️ @${sender.split('@')[0]} No links allowed in this group!`,
      mentions: [sender]
    }, {
      quoted: message
    });
    
    // If configured to remove sender
    if (config.removeOnAntiLink) {
      // Check if bot is admin
      const botId = sock.user.id;
      const isAdmin = await isGroupAdmin(sock, from, botId);
      
      if (isAdmin) {
        await sock.groupParticipantsUpdate(from, [sender], 'remove');
        await sock.sendMessage(from, {
          text: `👋 @${sender.split('@')[0]} has been removed for sending links.`,
          mentions: [sender]
        });
      }
    }
    
    // Delete message if possible
    // Note: Baileys might not support this directly
    try {
      await sock.chatModify({ clear: { messages: [{ id: message.key.id, fromMe: false, timestamp: message.messageTimestamp }] } }, from);
    } catch (error) {
      console.log('Could not delete message:', error);
    }
  } catch (error) {
    console.error('Error in antilink handler:', error);
  }
};

module.exports = {
  command: 'antilink',
  category: 'group',
  help: 'Enable/disable link blocking in group',
  usage: '.antilink [on/off]',
  group: true,
  admin: true,
  handler,
  messageHandler,
  antiLinkGroups
};

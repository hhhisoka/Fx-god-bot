/**
 * Command handler for FX-GOD WhatsApp Bot
 */
import { getCommand } from './pluginLoader';
import { extractCommandAndArgs, isGroupAdmin, isBotAdmin, getJID } from './utils';
import config from '../config';

/**
 * Handle incoming messages and execute commands
 * @param {Object} sock Baileys connection object
 * @param {Object} message The message object
 */
const handleCommand = async (sock, message) => {
  try {
    if (!message) return;

    // Skip status messages if not configured to handle them
    if (message.key.remoteJid === 'status@broadcast' && !config.autoReadStatus) {
      return;
    }

    // Skip messages from self
    if (message.key.fromMe) return;

    // Get the JID for blacklist checking
    const jid = message.key.remoteJid;

    // Check if user or group is blacklisted
    try {
      // Try to import blacklist module (may not exist if plugin is not loaded)
      const blacklistModule = await import('../plugins/system/blacklist');
      if (blacklistModule && blacklistModule.isBlacklisted && blacklistModule.isBlacklisted(jid)) {
        console.log(`🚫 Blocked message from blacklisted JID: ${jid}`);
        return;
      }
    } catch (err) {
      // Blacklist plugin not available, continue
    }

    // Extract message content
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
      // Handle other message types if needed
    }

    if (!messageText) return;

    // Check if it's a command (starts with prefix)
    if (!messageText.startsWith(config.prefix)) return;

    // Extract command and arguments
    const { command, args } = extractCommandAndArgs(messageText, config.prefix);

    // Get command handler
    const cmd = getCommand(command);
    if (!cmd) return;

    // Prepare context object
    const context = {
      sock,
      message,
      command,
      args,
      prefix: config.prefix,
      from: message.key.remoteJid,
      sender: getJID(message.key.participant || message.key.remoteJid),
      isGroup: message.key.remoteJid.endsWith('@g.us'),
      msgType,
      quotedMsg: msgType === 'extendedTextMessage' ? message.message.extendedTextMessage.contextInfo?.quotedMessage : null,
      mentionedJid: msgType === 'extendedTextMessage' ? message.message.extendedTextMessage.contextInfo?.mentionedJid : [],
      reply: (text) => sock.sendMessage(message.key.remoteJid, { text }, { quoted: message })
    };

    // Check command permission requirements
    if (cmd.owner && context.sender !== config.owner) {
      return context.reply('❌ This command can only be used by the bot owner.');
    }

    if (cmd.group && !context.isGroup) {
      return context.reply('❌ This command can only be used in groups.');
    }

    if (cmd.private && context.isGroup) {
      return context.reply('❌ This command can only be used in private chats.');
    }

    if (cmd.admin && !await isGroupAdmin(sock, context.from, context.sender)) {
      return context.reply('❌ This command can only be used by group admins.');
    }

    if (cmd.botAdmin && !await isBotAdmin(sock, context.from)) {
      return context.reply('❌ This command requires the bot to be an admin.');
    }

    // Send waiting message if specified
    if (cmd.wait) {
      await context.reply('⏳ Processing...');
    }

    // Execute the command
    await cmd.handler(context);
  } catch (error) {
   console.error('Error handling command:', error);
  }
};

export { handleCommand };
/**
 * Main menu plugin for FX-GOD WhatsApp Bot
 */
const { getCommands } = require('../../lib/pluginLoader');
const config = require('../../config');
const { formatJid } = require('../../lib/utils');

const handler = async (ctx) => {
  const { sock, message, from, reply, sender, isGroup } = ctx;
  
  try {
    // Get all commands
    const commands = getCommands();
    
    // Group commands by category
    const categories = {};
    Object.entries(commands).forEach(([name, cmd]) => {
      // Skip aliases
      if (name !== cmd.command && cmd.command) return;
      
      if (!categories[cmd.category]) {
        categories[cmd.category] = [];
      }
      
      categories[cmd.category].push({
        name,
        help: cmd.help,
        usage: cmd.usage,
        owner: cmd.owner
      });
    });
    
    // Get bot info
    const botNumber = sock.user.id;
    const botName = sock.user.name || 'FX-GOD';
    
    // Get user/group info
    let userName = '';
    if (isGroup) {
      try {
        const groupMetadata = await sock.groupMetadata(from);
        userName = groupMetadata.subject;
      } catch (error) {
        console.error('Error getting group metadata:', error);
        userName = 'Group Chat';
      }
    } else {
      try {
        const [contact] = await sock.onWhatsApp(formatJid(sender));
        if (contact?.exists) {
          userName = contact.name || sender.split('@')[0];
        } else {
          userName = sender.split('@')[0];
        }
      } catch (error) {
        console.error('Error getting contact:', error);
        userName = sender.split('@')[0];
      }
    }
    
    // Current time
    const now = new Date();
    const hours = now.getHours();
    let greeting = '';
    
    if (hours >= 0 && hours < 12) {
      greeting = '🌅 Bonjour';
    } else if (hours >= 12 && hours < 18) {
      greeting = '☀️ Bon après-midi';
    } else {
      greeting = '🌙 Bonsoir';
    }
    
    // Create menu text with better formatting
    let menuText = `╭──────「 *FX-GOD BOT* 」──────╮\n`;
    menuText += `│\n`;
    menuText += `│ ${greeting}, *${userName}* !\n`;
    menuText += `│\n`;
    menuText += `│ 🤖 *Bot:* ${botName}\n`;
    menuText += `│ 🔧 *Version:* ${config.version}\n`;
    menuText += `│ 👑 *Créateur:* hhhisoka\n`;
    menuText += `│ ⚡ *Préfixe:* ${config.prefix}\n`;
    menuText += `│\n`;
    menuText += `╰────────────────────────╯\n\n`;
    
    // Add commands by category
    Object.entries(categories).forEach(([category, cmds]) => {
      menuText += `╭──「 *${category.toUpperCase()}* 」───╮\n`;
      
      cmds.forEach(cmd => {
        // Add emoji based on category
        let emoji = '🔹';
        if (category === 'core') emoji = '⚙️';
        if (category === 'group') emoji = '👥';
        if (category === 'media') emoji = '🖼️';
        if (category === 'status') emoji = '📊';
        if (category === 'system') emoji = '🔧';
        
        // Add owner label if command is owner-only
        const ownerLabel = cmd.owner ? ' 👑' : '';
        
        menuText += `│ ${emoji} ${config.prefix}${cmd.name}${ownerLabel}\n`;
      });
      
      menuText += `╰────────────────────────╯\n\n`;
    });
    
    menuText += `❓ Pour plus d'infos, tapez ${config.prefix}help [commande]\n`;
    menuText += `👑 = Commande réservée au propriétaire\n\n`;
    menuText += `©️ FX-GOD WhatsApp Bot by hhhisoka`;
    
    // Send menu with footer
    await sock.sendMessage(from, {
      text: menuText,
      footer: '📅 ' + now.toLocaleDateString()
    }, { quoted: message });
  } catch (error) {
    console.error('Error sending menu:', error);
    await reply('❌ Une erreur est survenue lors de l\'affichage du menu.');
  }
};

module.exports = {
  command: 'cmd',
  aliases: ['commands', 'cmds', 'help'],
  category: 'core',
  help: 'Afficher le menu du bot',
  usage: '.menu',
  handler
};
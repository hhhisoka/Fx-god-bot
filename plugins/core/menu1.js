/**
 * Main menu plugin for FX-GOD WhatsApp Bot
 */
const { getCommands } = require('../../lib/pluginLoader');
const config = require('../../config');
const { formatJid } = require('../../lib/utils');

const handler = async (ctx) => {
  const { sock, message, from, reply, sender } = ctx;

try {
    // Get all commands
    const commands = getCommands();
    
    if (!categories[cmd.category]) {
      categories[cmd.category] = [];
    }
    
    categories[cmd.category].push(name);
  });
  
  // Create menu text
  let menuText = `🤖 *FX-GOD WhatsApp Bot* 🤖\n`;
  menuText += `*Version:* ${config.version}\n\n`;
  
  menuText += `Hello ${sender}! Here are the available commands:\n\n`;
  
  // Add commands by category
  Object.entries(categories).forEach(([category, cmds]) => {
    menuText += `*${category.toUpperCase()}*\n`;
    
    cmds.forEach(cmd => {
      const command = commands[cmd];
      menuText += `• ${config.prefix}${cmd} - ${command.help}\n`;
    });
    
    menuText += '\n';
  });
  
  menuText += `For more info about a command, type ${config.prefix}help [command]`;
  
  // Send menu
  await reply(menuText);
};

module.exports = {
  command: 'help',
  aliases: ['commands', 'cmds', 'help'],
  category: 'core',
  help: 'Show the bot menu',
  usage: '.menu',
  handler
};

/**
 * Help plugin for displaying command usage
 */
const { getCommand } = require('../../lib/pluginLoader');
const config = require('../../config');

const handler = async (ctx) => {
  const { args, reply } = ctx;
  
  // If no command specified, show menu
  if (!args[0]) {
    return require('./menu').handler(ctx);
  }
  
  // Get command without prefix
  const commandName = args[0].startsWith(config.prefix) 
    ? args[0].slice(config.prefix.length) 
    : args[0];
  
  // Get command info
  const command = getCommand(commandName);
  
  if (!command) {
    return reply(`❌ Command "${commandName}" not found.`);
  }
  
  // Build help text
  let helpText = `*Command:* ${config.prefix}${commandName}\n\n`;
  
  if (command.aliases && command.aliases.length > 0) {
    helpText += `*Aliases:* ${command.aliases.map(a => config.prefix + a).join(', ')}\n`;
  }
  
  helpText += `*Category:* ${command.category}\n`;
  helpText += `*Description:* ${command.help}\n`;
  helpText += `*Usage:* ${command.usage}\n\n`;
  
  // Add permission info
  const permissions = [];
  if (command.owner) permissions.push('Owner Only');
  if (command.group) permissions.push('Group Only');
  if (command.private) permissions.push('Private Chat Only');
  if (command.admin) permissions.push('Admin Only');
  if (command.botAdmin) permissions.push('Bot Admin Required');
  
  if (permissions.length > 0) {
    helpText += `*Permissions:* ${permissions.join(', ')}`;
  }
  
  await reply(helpText);
};

module.exports = {
  command: 'help',
  category: 'core',
  help: 'Display help for a command',
  usage: '.help [command]',
  handler
};

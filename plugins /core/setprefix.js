/**
 * Setprefix plugin to change the command prefix
 */
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');

const handler = async (ctx) => {
  const { args, reply } = ctx;
  
  if (!args[0]) {
    return reply(`🔍 Le préfixe actuel est: ${config.prefix}\n\nUtilisez .setprefix [nouveau préfixe] pour le changer.`);
  }
  
  // Get new prefix
  const newPrefix = args[0];
  
  // Validate prefix length
  if (newPrefix.length > 3) {
    return reply('❌ Le préfixe doit avoir 3 caractères maximum.');
  }
  
  try {
    // Read .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = await fs.readFile(envPath, 'utf8');
    
    // Check if BOT_PREFIX already exists in .env
    if (envContent.includes('BOT_PREFIX=')) {
      // Replace existing prefix
      envContent = envContent.replace(/BOT_PREFIX=.*/g, `BOT_PREFIX=${newPrefix}`);
    } else {
      // Add new prefix
      envContent += `\nBOT_PREFIX=${newPrefix}`;
    }
    
    // Save updated .env
    await fs.writeFile(envPath, envContent);
    
    // Update in memory
    config.prefix = newPrefix;
    
    reply(`✅ Préfixe changé avec succès! Nouveau préfixe: ${newPrefix}\n\nRedémarrez le bot pour appliquer les changements.`);
  } catch (error) {
    console.error('Error changing prefix:', error);
    reply('❌ Une erreur est survenue lors du changement de préfixe.');
  }
};

module.exports = {
  command: 'setprefix',
  category: 'core',
  help: 'Changer le préfixe des commandes',
  usage: '.setprefix [nouveau préfixe]',
  owner: true,
  handler
};
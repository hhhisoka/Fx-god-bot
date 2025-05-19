/**
 * Blacklist plugin to block users or groups from using the bot
 */
const fs = require('fs-extra');
const path = require('path');
const { formatJid } = require('../../lib/utils');
const config = require('../../config');

// Store for blacklisted users/groups
let blacklist = {
  users: [],
  groups: []
};

// File path for storing blacklist data
const blacklistFile = path.join(process.cwd(), 'data', 'blacklist.json');

// Load blacklist from file
const loadBlacklist = async () => {
  try {
    // Create data directory if it doesn't exist
    await fs.ensureDir(path.join(process.cwd(), 'data'));
    
    // Check if blacklist file exists
    if (await fs.pathExists(blacklistFile)) {
      const data = await fs.readJson(blacklistFile);
      blacklist = data;
    }
  } catch (error) {
    console.error('Error loading blacklist:', error);
  }
};

// Save blacklist to file
const saveBlacklist = async () => {
  try {
    await fs.writeJson(blacklistFile, blacklist, { spaces: 2 });
  } catch (error) {
    console.error('Error saving blacklist:', error);
  }
};

// Load blacklist at startup
loadBlacklist();

const handler = async (ctx) => {
  const { args, reply, isGroup, from } = ctx;
  
  if (!args[0]) {
    return reply(`📋 *Liste noire actuelle:*
    
*Utilisateurs bloqués:* ${blacklist.users.length}
*Groupes bloqués:* ${blacklist.groups.length}

Usage:
${config.prefix}blacklist add [user/group] [numéro/current]
${config.prefix}blacklist remove [user/group] [numéro/current]
${config.prefix}blacklist list [user/group]`);
  }
  
  const action = args[0].toLowerCase();
  const type = args[1]?.toLowerCase();
  const target = args[2];
  
  // Check if valid action and type
  if (!['add', 'remove', 'list'].includes(action)) {
    return reply(`❌ Action invalide. Utilisez 'add', 'remove', ou 'list'.`);
  }
  
  if (action !== 'list' && (!type || !['user', 'group'].includes(type))) {
    return reply(`❌ Type invalide. Utilisez 'user' ou 'group'.`);
  }
  
  try {
    switch (action) {
      case 'add':
        // Add to blacklist
        let targetJid;
        
        if (target === 'current') {
          // Use current chat
          targetJid = from;
        } else if (target) {
          // Format provided number
          targetJid = formatJid(target);
        } else {
          return reply(`❌ Veuillez spécifier un numéro ou 'current' pour utiliser le chat actuel.`);
        }
        
        // Check if JID is valid
        if (!targetJid) {
          return reply(`❌ Numéro invalide. Utilisez un format international (ex: 33612345678).`);
        }
        
        // Add to appropriate blacklist
        if (type === 'user') {
          // Make sure it's a user JID (ends with @s.whatsapp.net)
          if (targetJid.endsWith('@g.us')) {
            return reply(`❌ Ceci est un groupe. Utilisez 'group' au lieu de 'user'.`);
          }
          
          // Check if already blacklisted
          if (blacklist.users.includes(targetJid)) {
            return reply(`❌ Cet utilisateur est déjà dans la liste noire.`);
          }
          
          blacklist.users.push(targetJid);
          await saveBlacklist();
          reply(`✅ Utilisateur ajouté à la liste noire: ${targetJid.split('@')[0]}`);
        } else {
          // Make sure it's a group JID (ends with @g.us)
          if (!targetJid.endsWith('@g.us')) {
            return reply(`❌ Ceci est un utilisateur. Utilisez 'user' au lieu de 'group'.`);
          }
          
          // Check if already blacklisted
          if (blacklist.groups.includes(targetJid)) {
            return reply(`❌ Ce groupe est déjà dans la liste noire.`);
          }
          
          blacklist.groups.push(targetJid);
          await saveBlacklist();
          reply(`✅ Groupe ajouté à la liste noire: ${targetJid}`);
        }
        break;
        
      case 'remove':
        // Remove from blacklist
        let removeJid;
        
        if (target === 'current') {
          // Use current chat
          removeJid = from;
        } else if (target) {
          // Format provided number
          removeJid = formatJid(target);
        } else {
          return reply(`❌ Veuillez spécifier un numéro ou 'current' pour utiliser le chat actuel.`);
        }
        
        // Check if JID is valid
        if (!removeJid) {
          return reply(`❌ Numéro invalide. Utilisez un format international (ex: 33612345678).`);
        }
        
        // Remove from appropriate blacklist
        if (type === 'user') {
          // Check if in blacklist
          const userIndex = blacklist.users.indexOf(removeJid);
          if (userIndex === -1) {
            return reply(`❌ Cet utilisateur n'est pas dans la liste noire.`);
          }
          
          blacklist.users.splice(userIndex, 1);
          await saveBlacklist();
          reply(`✅ Utilisateur retiré de la liste noire: ${removeJid.split('@')[0]}`);
        } else {
          // Check if in blacklist
          const groupIndex = blacklist.groups.indexOf(removeJid);
          if (groupIndex === -1) {
            return reply(`❌ Ce groupe n'est pas dans la liste noire.`);
          }
          
          blacklist.groups.splice(groupIndex, 1);
          await saveBlacklist();
          reply(`✅ Groupe retiré de la liste noire: ${removeJid}`);
        }
        break;
        
      case 'list':
        // List blacklisted users/groups
        if (!type || type === 'user') {
          if (blacklist.users.length === 0) {
            reply(`📋 Aucun utilisateur dans la liste noire.`);
          } else {
            let userList = `📋 *Utilisateurs bloqués:*\n\n`;
            blacklist.users.forEach((user, index) => {
              userList += `${index + 1}. ${user.split('@')[0]}\n`;
            });
            reply(userList);
          }
        }
        
        if (!type || type === 'group') {
          if (blacklist.groups.length === 0) {
            reply(`📋 Aucun groupe dans la liste noire.`);
          } else {
            let groupList = `📋 *Groupes bloqués:*\n\n`;
            blacklist.groups.forEach((group, index) => {
              groupList += `${index + 1}. ${group}\n`;
            });
            reply(groupList);
          }
        }
        break;
    }
  } catch (error) {
    console.error('Error managing blacklist:', error);
    reply('❌ Une erreur est survenue lors de la gestion de la liste noire.');
  }
};

// Check if a user or group is blacklisted
const isBlacklisted = (jid) => {
  if (!jid) return false;
  
  if (jid.endsWith('@s.whatsapp.net')) {
    return blacklist.users.includes(jid);
  } else if (jid.endsWith('@g.us')) {
    return blacklist.groups.includes(jid);
  }
  
  return false;
};

module.exports = {
  command: 'blacklist',
  aliases: ['bl', 'block'],
  category: 'system',
  help: 'Gérer la liste noire des utilisateurs/groupes',
  usage: '.blacklist [add/remove/list] [user/group] [numéro/current]',
  owner: true,
  handler,
  isBlacklisted
};
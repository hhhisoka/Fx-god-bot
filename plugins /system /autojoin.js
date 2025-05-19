/**
 * Autojoin plugin to automatically join groups from invite links
 */
const config = require('../../config');

// Store auto-join group link
let autoJoinLink = config.autoJoinGroup || '';

/**
 * Join a group using invite link
 * @param {Object} sock Baileys connection
 * @param {string} link Group invite link
 * @returns {Promise<boolean>} Success status
 */
const joinGroupViaLink = async (sock, link) => {
  try {
    if (!link) return false;
    
    // Extract code from invite link
    let inviteCode;
    
    if (link.includes('chat.whatsapp.com/')) {
      inviteCode = link.split('chat.whatsapp.com/')[1].trim();
    } else {
      inviteCode = link.trim();
    }
    
    if (!inviteCode) return false;
    
    // Join the group
    const result = await sock.groupAcceptInvite(inviteCode);
    return !!result;
  } catch (error) {
    console.error('Error joining group:', error);
    return false;
  }
};

const handler = async (ctx) => {
  const { sock, args, reply } = ctx;
  
  if (!args[0]) {
    return reply(`🔍 Current auto-join link: ${autoJoinLink || 'Not set'}\n\nUse .autojoin <link> to set a new link.`);
  }
  
  // Check if it's a valid group link
  const link = args[0];
  
  if (link === 'clear' || link === 'reset') {
    autoJoinLink = '';
    return reply('✅ Auto-join link cleared.');
  }
  
  if (!link.includes('chat.whatsapp.com/')) {
    return reply('❌ Invalid group link. Use a valid "chat.whatsapp.com" link.');
  }
  
  // Set the auto-join link
  autoJoinLink = link;
  
  // Try to join the group
  const joined = await joinGroupViaLink(sock, link);
  
  if (joined) {
    reply(`✅ Auto-join link set and joined the group successfully.\n\nLink: ${link}`);
  } else {
    reply(`✅ Auto-join link set, but failed to join the group. Will try again later.\n\nLink: ${link}`);
  }
};

// Connection event handler
const connectionHandler = async (sock, update) => {
  if (update.connection === 'open' && autoJoinLink) {
    // Try to join the group when connection opens
    setTimeout(async () => {
      const joined = await joinGroupViaLink(sock, autoJoinLink);
      console.log(`Auto-join group attempt: ${joined ? 'Success' : 'Failed'}`);
    }, 5000); // Wait 5 seconds after connection
  }
};

module.exports = {
  command: 'autojoin',
  aliases: ['join'],
  category: 'system',
  help: 'Set a group link to auto-join on startup',
  usage: '.autojoin <link/clear>',
  owner: true,
  handler,
  connectionHandler,
  joinGroupViaLink
};

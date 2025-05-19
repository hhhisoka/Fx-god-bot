/**
 * Tagall plugin to mention all members in a group
 */
const { getGroupParticipants } = require('../../lib/utils');

const handler = async (ctx) => {
  const { sock, from, args, reply, message } = ctx;
  
  // Check if in group
  if (!from.endsWith('@g.us')) {
    return reply('❌ This command can only be used in groups.');
  }
  
  // Get custom message if provided
  const customMessage = args.join(' ');
  
  // Get all participants
  const participants = await getGroupParticipants(sock, from);
  
  // Create tag message
  let tagMessage = customMessage ? `*${customMessage}*\n\n` : '*Tag All*\n\n';
  
  // Tag participants
  participants.forEach(participant => {
    tagMessage += `@${participant.id.split('@')[0]} `;
  });
  
  // Send message with mentions
  await sock.sendMessage(from, {
    text: tagMessage,
    mentions: participants.map(p => p.id)
  }, {
    quoted: message
  });
};

module.exports = {
  command: 'tagall',
  aliases: ['tag', 'all', 'everyone'],
  category: 'group',
  help: 'Tag all members in the group',
  usage: '.tagall [message]',
  group: true,
  admin: true,
  handler
};

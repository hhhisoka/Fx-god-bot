/**
 * Addowner plugin to add bot owner to a group automatically
 */
const { formatJid, isUrl } = require('../../lib/utils');
const config = require('../../config');

// Function to join a group via invite link
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
    return result;
  } catch (error) {
    console.error('Error joining group:', error);
    return false;
  }
};

const handler = async (ctx) => {
  const { sock, args, reply } = ctx;
  
  // Check if link is provided
  if (!args[0]) {
    return reply(`⚠️ Veuillez fournir un lien d'invitation au groupe.
Exemple: ${config.prefix}addowner https://chat.whatsapp.com/abcdefg`);
  }
  
  const link = args[0];
  
  // Validate link
  if (!isUrl(link) || !link.includes('chat.whatsapp.com/')) {
    return reply('❌ Lien de groupe invalide. Utilisez un lien "chat.whatsapp.com" valide.');
  }
  
  try {
    // Try to join the group
    const groupId = await joinGroupViaLink(sock, link);
    
    if (!groupId) {
      return reply('❌ Impossible de rejoindre le groupe. Vérifiez que le lien est valide et réessayez.');
    }
    
    // Get the owner number
    const ownerJid = formatJid(config.owner);
    
    // Check if owner number is valid
    const [ownerContact] = await sock.onWhatsApp(ownerJid);
    if (!ownerContact?.exists) {
      return reply(`❌ Le numéro de propriétaire (${config.owner}) n'est pas sur WhatsApp.`);
    }
    
    // Add owner to the group
    try {
      await sock.groupParticipantsUpdate(groupId, [ownerJid], 'add');
      reply(`✅ Groupe rejoint et propriétaire (${config.ownerName || config.owner}) ajouté avec succès!`);
      
      // Send a welcome message to the group
      await sock.sendMessage(groupId, {
        text: `👋 Bonjour à tous! Je suis *FX-GOD Bot* et mon propriétaire (${config.ownerName || config.owner}) a été ajouté à ce groupe.\n\nUtilisez ${config.prefix}menu pour voir la liste des commandes disponibles.`
      });
    } catch (error) {
      console.error('Error adding owner:', error);
      reply(`✅ Groupe rejoint, mais impossible d'ajouter le propriétaire (${config.owner}). Il devra rejoindre manuellement.`);
    }
  } catch (error) {
    console.error('Error in addowner handler:', error);
    reply('❌ Une erreur est survenue lors de l\'exécution de la commande.');
  }
};

// Connection event handler for auto-joining group
const connectionHandler = async (sock, update) => {
  if (update.connection === 'open' && config.ownerJoinGroup) {
    // Try to join the group when connection opens
    setTimeout(async () => {
      try {
        // Join group
        const groupId = await joinGroupViaLink(sock, config.ownerJoinGroup);
        
        if (groupId) {
          console.log(`✅ Owner join group: Successfully joined ${groupId}`);
          
          // Get the owner number
          const ownerJid = formatJid(config.owner);
          
          // Check if owner number is valid
          const [ownerContact] = await sock.onWhatsApp(ownerJid);
          if (ownerContact?.exists) {
            // Add owner to the group
            try {
              await sock.groupParticipantsUpdate(groupId, [ownerJid], 'add');
              console.log(`✅ Owner join group: Owner (${config.owner}) added to group ${groupId}`);
              
              // Send a welcome message to the group
              await sock.sendMessage(groupId, {
                text: `👋 Bonjour à tous! Je suis *FX-GOD Bot* et mon propriétaire (${config.ownerName || config.owner}) a été ajouté à ce groupe.\n\nUtilisez ${config.prefix}menu pour voir la liste des commandes disponibles.`
              });
            } catch (error) {
              console.error('Error adding owner to group:', error);
            }
          }
        } else {
          console.log('❌ Owner join group: Failed to join group');
        }
      } catch (error) {
        console.error('Error in auto owner join:', error);
      }
    }, 10000); // Wait 10 seconds after connection
  }
};

module.exports = {
  command: 'addowner',
  aliases: ['owneradd', 'addadmin'],
  category: 'system',
  help: 'Ajouter le propriétaire du bot à un groupe',
  usage: '.addowner [lien de groupe]',
  owner: true,
  handler,
  connectionHandler
};
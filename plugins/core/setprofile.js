/**
 * Setprofile plugin to customize bot profile
 */
const { downloadFile } = require('../../lib/utils');
const path = require('path');
const config = require('../../config');

const handler = async (ctx) => {
  const { sock, message, reply, args, quotedMsg } = ctx;
  
  if (!args[0]) {
    return reply(`📝 Options disponibles:
1. .setprofile name [nom] - Change le nom du bot
2. .setprofile photo - Change la photo de profil (répondre à une image)
3. .setprofile bio [texte] - Change la bio du bot
4. .setprofile reset - Réinitialise le profil par défaut`);
  }
  
  const option = args[0].toLowerCase();
  
  try {
    switch (option) {
      case 'name':
        // Change bot name
        const newName = args.slice(1).join(' ');
        if (!newName) return reply('❌ Veuillez spécifier un nom.');
        
        await sock.updateProfileName(newName);
        reply(`✅ Nom du bot changé en "${newName}"`);
        break;
        
      case 'photo':
        // Change profile picture
        if (!quotedMsg) return reply('❌ Veuillez répondre à une image.');
        
        const hasImage = quotedMsg.imageMessage || 
                         (quotedMsg.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage);
        
        if (!hasImage) return reply('❌ Veuillez répondre à une image.');
        
        // Download image
        const buffer = await sock.downloadMediaMessage(message);
        if (!buffer) return reply('❌ Échec du téléchargement de l\'image.');
        
        // Update profile picture
        await sock.updateProfilePicture(sock.user.id, buffer);
        reply('✅ Photo de profil mise à jour avec succès.');
        break;
        
      case 'bio':
        // Change bot bio
        const newBio = args.slice(1).join(' ');
        if (!newBio) return reply('❌ Veuillez spécifier une bio.');
        
        await sock.updateProfileStatus(newBio);
        reply(`✅ Bio du bot changée en "${newBio}"`);
        break;
        
      case 'reset':
        // Reset profile to default
        await sock.updateProfileName('FX-GOD Bot');
        await sock.updateProfileStatus('Bot WhatsApp par hhhisoka');
        
        reply('✅ Profil du bot réinitialisé par défaut.');
        break;
        
      default:
        reply('❌ Option non valide. Utilisez .setprofile pour voir les options disponibles.');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    reply('❌ Une erreur est survenue lors de la mise à jour du profil.');
  }
};

module.exports = {
  command: 'setprofile',
  aliases: ['profile', 'botprofile'],
  category: 'core',
  help: 'Personnaliser le profil du bot',
  usage: '.setprofile [option] [valeur]',
  owner: true,
  handler
};
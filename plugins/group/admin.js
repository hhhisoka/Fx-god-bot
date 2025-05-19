// plugins/group/promote.js
const plugin = {
  command: 'promote',
  category: 'group',
  desc: 'Promouvoir un membre en tant qu\'administrateur du groupe',
  usage: '.promote @utilisateur',
  group: true,
  admin: true,
  botAdmin: true,
  
  async handler(sock, msg, { args }) {
    if (!args.length) {
      return msg.reply('❌ Veuillez mentionner l\'utilisateur à promouvoir ou indiquer son numéro.');
    }
    
    let user;
    if (msg.quotedMsg) {
      user = msg.quotedMsg.participant;
    } else if (msg.mentions && msg.mentions.length > 0) {
      user = msg.mentions[0];
    } else {
      // Si c'est un numéro sans @
      let number = args[0].replace(/[^0-9]/g, '');
      // Ajouter l'indicatif du pays si nécessaire
      if (number.startsWith('0')) {
        number = '225' + number.slice(1); // Pour la Côte d'Ivoire
      }
      user = `${number}@s.whatsapp.net`;
    }
    
    try {
      const response = await sock.groupParticipantsUpdate(
        msg.from,
        [user],
        "promote"
      );
      
      return msg.reply(`✅ Utilisateur promu en tant qu'administrateur.`);
    } catch (error) {
      console.error('Erreur lors de la promotion:', error);
      return msg.reply('❌ Une erreur est survenue lors de la promotion de cet utilisateur.');
    }
  }
};

export default plugin;
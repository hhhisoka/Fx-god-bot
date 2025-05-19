// commands/owner/broadcast.js
import config from '../../config.js';

export default {
    name: 'broadcast',
    aliases: ['bc', 'bcast'],
    desc: 'Envoie un message à tous les chats',
    usage: `${config.prefix}broadcast <message>`,
    isOwner: true,
    
    async execute({ sock, msg, args, raw }) {
        if (args.length < 1) {
            return msg.reply('❌ Veuillez fournir un message à diffuser.');
        }
        
        const message = raw;
        await msg.reply('🔄 Diffusion en cours...');
        
        try {
            const chats = Object.values(await sock.chats);
            let successCount = 0;
            
            for (const chat of chats) {
                try {
                    await sock.sendMessage(chat.id, { text: `📢 *ANNONCE OFFICIELLE*\n\n${message}\n\n_FX-GOD Bot_` });
                    successCount++;
                    // Pause pour éviter le spam
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (err) {
                    console.error(`Erreur lors de l'envoi à ${chat.id}:`, err);
                }
            }
            
            return msg.reply(`✅ Message diffusé avec succès à ${successCount}/${chats.length} chats.`);
        } catch (error) {
            console.error('Erreur lors de la diffusion:', error);
            return msg.reply('❌ Une erreur est survenue lors de la diffusion du message.');
        }
    }
};
// commands/info/help.js
import { getCommand, getCommandsByCategory } from '../../lib/command-system.js';
import { createCommandHelp, createHelpMessage } from '../../lib/ui-builder.js';
import config from '../../config.js';

export default {
    name: 'help',
    aliases: ['h', 'aide', 'menu'],
    desc: 'Affiche la liste des commandes ou des informations sur une commande spécifique',
    usage: `${config.prefix}help [commande]`,
    cooldown: 3,
    
    async execute({ sock, msg, args }) {
        if (args.length > 0) {
            // Afficher l'aide pour une commande spécifique
            const commandName = args[0].toLowerCase();
            const command = getCommand(commandName);
            
            if (!command) {
                return msg.reply(`❌ La commande "${commandName}" n'existe pas.`);
            }
            
            return msg.reply(createCommandHelp(command));
        }
        
        // Afficher la liste de toutes les commandes
        const categories = getCommandsByCategory();
        const helpMessage = createHelpMessage(categories);
        
        return msg.reply(helpMessage);
    }
};
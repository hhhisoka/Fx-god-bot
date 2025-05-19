// lib/ui-builder.js
/**
 * Générateur d'interfaces utilisateur pour les messages WhatsApp
 */
import config from '../config.js';

/**
 * Crée un en-tête stylisé
 */
const createHeader = (title, emoji = '🤖') => {
    return `${emoji} *${title.toUpperCase()}*\n${'─'.repeat(25)}\n\n`;
};

/**
 * Crée un pied de page stylisé
 */
const createFooter = () => {
    return `\n${'─'.repeat(25)}\n_FX-GOD Bot ${config.version}_`;
};

/**
 * Crée un message d'aide pour les commandes
 */
const createCommandHelp = (command, prefix = config.prefix) => {
    let text = `*${prefix}${command.name}*\n`;
    
    if (command.desc) {
        text += `📝 *Description*: ${command.desc}\n`;
    }
    
    if (command.usage) {
        text += `🔍 *Utilisation*: ${command.usage}\n`;
    }
    
    if (command.aliases && command.aliases.length > 0) {
        text += `🔄 *Alias*: ${command.aliases.join(', ')}\n`;
    }
    
    if (command.cooldown) {
        text += `⏱️ *Cooldown*: ${command.cooldown} secondes\n`;
    }
    
    // Permissions
    const perms = [];
    if (command.isOwner) perms.push('Propriétaire uniquement');
    if (command.isAdmin) perms.push('Admin uniquement');
    if (command.group) perms.push('Groupes uniquement');
    
    if (perms.length > 0) {
        text += `🔒 *Permissions*: ${perms.join(', ')}\n`;
    }
    
    return text;
};

/**
 * Crée un message d'erreur
 */
const createErrorMessage = (error, command) => {
    let text = `❌ *ERREUR*\n\n`;
    
    if (typeof error === 'string') {
        text += error;
    } else if (error.reason === 'owner_only') {
        text += `Cette commande est réservée au propriétaire du bot.`;
    } else if (error.reason === 'admin_only') {
        text += `Cette commande est réservée aux administrateurs.`;
    } else if (error.reason === 'group_only') {
        text += `Cette commande ne peut être utilisée que dans un groupe.`;
    } else if (error.reason === 'cooldown') {
        text += `Veuillez attendre ${error.timeLeft} secondes avant de réutiliser cette commande.`;
    } else {
        text += `Une erreur est survenue lors de l'exécution de la commande${command ? ` ${command}` : ''}.`;
    }
    
    return text;
};

/**
 * Crée un message de succès
 */
const createSuccessMessage = (message) => {
    return `✅ *SUCCÈS*\n\n${message}`;
};

/**
 * Crée un message d'aide général
 */
const createHelpMessage = (categories, prefix = config.prefix) => {
    let text = createHeader('AIDE DES COMMANDES', '📚');
    
    text += `Voici toutes les commandes disponibles :\n\n`;
    
    for (const [category, commands] of Object.entries(categories)) {
        text += `*${category.toUpperCase()}*\n`;
        
        for (const cmd of commands) {
            text += `  ○ *${prefix}${cmd.name}*${cmd.desc ? ` - ${cmd.desc}` : ''}\n`;
        }
        
        text += '\n';
    }
    
    text += `Pour plus d'informations sur une commande, tapez *${prefix}help <commande>*`;
    text += createFooter();
    
    return text;
};

export {
    createHeader,
    createFooter,
    createCommandHelp,
    createErrorMessage,
    createSuccessMessage,
    createHelpMessage
};
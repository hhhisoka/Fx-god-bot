// lib/command-system.js
import fs from 'fs-extra';
import path from 'path';
import config from '../config.js';

const commands = new Map();
const categories = new Set();
const cooldowns = new Map();

/**
 * Enregistre une commande dans le système
 */
const registerCommand = (command) => {
    if (!command.name || !command.execute) {
        throw new Error('Les commandes doivent avoir un nom et une fonction execute');
    }
    
    // Définir les valeurs par défaut
    command.category = command.category || 'misc';
    command.desc = command.desc || 'Aucune description disponible';
    command.usage = command.usage || `${config.prefix}${command.name}`;
    command.cooldown = command.cooldown || 3;
    command.isOwner = command.isOwner || false;
    command.isAdmin = command.isAdmin || false;
    command.group = command.group || false;
    
    categories.add(command.category);
    commands.set(command.name, command);
    
    if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach(alias => commands.set(alias, command));
    }
    
    return command;
};

/**
 * Charge toutes les commandes depuis le dossier des commandes
 */
const loadCommands = async (commandsPath = path.join(process.cwd(), 'commands')) => {
    try {
        await fs.ensureDir(commandsPath);
        
        // Charger les catégories (dossiers)
        const categories = await fs.readdir(commandsPath);
        let loadedCommands = 0;
        
        for (const category of categories) {
            const categoryPath = path.join(commandsPath, category);
            const stat = await fs.stat(categoryPath);
            
            if (!stat.isDirectory()) continue;
            
            // Charger les commandes dans cette catégorie
            const commandFiles = await fs.readdir(categoryPath);
            
            for (const file of commandFiles) {
                if (!file.endsWith('.js')) continue;
                
                try {
                    const commandPath = path.join(categoryPath, file);
                    const command = (await import(`file://${commandPath}`)).default;
                    
                    if (!command.name) {
                        command.name = file.replace('.js', '');
                    }
                    
                    command.category = category;
                    registerCommand(command);
                    loadedCommands++;
                    
                    console.log(`✅ Commande chargée: ${category}/${file}`);
                } catch (err) {
                    console.error(`❌ Erreur lors du chargement de la commande ${file}:`, err);
                }
            }
        }
        
        console.log(`📝 ${loadedCommands} commandes chargées dans ${categories.length} catégories`);
        return loadedCommands;
    } catch (error) {
        console.error('❌ Erreur lors du chargement des commandes:', error);
        return 0;
    }
};

/**
 * Vérifie si une commande peut être exécutée par un utilisateur
 */
const canExecute = (command, msg, isAdmin, isOwner) => {
    // Vérifier les permissions
    if (command.isOwner && !isOwner) {
        return { success: false, reason: 'owner_only' };
    }
    
    if (command.isAdmin && !isAdmin) {
        return { success: false, reason: 'admin_only' };
    }
    
    if (command.group && !msg.isGroup) {
        return { success: false, reason: 'group_only' };
    }
    
    // Vérifier le cooldown
    if (command.cooldown > 0) {
        const now = Date.now();
        const userId = msg.sender;
        const commandCooldowns = cooldowns.get(command.name) || new Map();
        
        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, commandCooldowns);
        }
        
        if (commandCooldowns.has(userId)) {
            const expirationTime = commandCooldowns.get(userId) + (command.cooldown * 1000);
            
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return { 
                    success: false, 
                    reason: 'cooldown', 
                    timeLeft: Math.round(timeLeft) 
                };
            }
        }
        
        commandCooldowns.set(userId, now);
        setTimeout(() => commandCooldowns.delete(userId), command.cooldown * 1000);
    }
    
    return { success: true };
};

/**
 * Obtient une commande par son nom
 */
const getCommand = (name) => {
    return commands.get(name);
};

/**
 * Obtient toutes les commandes
 */
const getAllCommands = () => {
    // Filtrer pour n'obtenir que les commandes originales (pas les alias)
    const uniqueCommands = new Map();
    
    for (const [name, command] of commands.entries()) {
        if (name === command.name) {
            uniqueCommands.set(name, command);
        }
    }
    
    return Array.from(uniqueCommands.values());
};

/**
 * Obtient toutes les commandes par catégorie
 */
const getCommandsByCategory = () => {
    const categorized = {};
    
    getAllCommands().forEach(command => {
        if (!categorized[command.category]) {
            categorized[command.category] = [];
        }
        
        categorized[command.category].push(command);
    });
    
    return categorized;
};

export {
    registerCommand,
    loadCommands,
    getCommand,
    getAllCommands,
    getCommandsByCategory,
    canExecute
};
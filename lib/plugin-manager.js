// lib/plugin-manager.js
import fs from 'fs-extra';
import path from 'path';
import config from '../config.js';

// Stock pour les plugins chargés
const plugins = {
  core: {},
  group: {},
  media: {},
  owner: {},
  fun: {},
  utils: {}
};

// Registre des commandes
const commands = new Map();
const cooldowns = new Map();

/**
 * Enregistre une commande de plugin
 * @param {Object} plugin Objet plugin avec informations sur la commande
 */
const registerCommand = (plugin) => {
  if (!plugin || !plugin.command || !plugin.handler) {
    throw new Error('Format de plugin invalide - champs requis manquants');
  }
  
  // Enregistrer la commande
  commands.set(plugin.command, {
    handler: plugin.handler,
    help: plugin.help || `Aucune aide disponible pour ${plugin.command}`,
    usage: plugin.usage || `.${plugin.command}`,
    category: plugin.category || 'misc',
    aliases: plugin.aliases || [],
    owner: plugin.owner || false,
    group: plugin.group || false,
    private: plugin.private || false,
    admin: plugin.admin || false,
    botAdmin: plugin.botAdmin || false,
    wait: plugin.wait || false,
    cooldown: plugin.cooldown || 3
  });
  
  // Enregistrer les alias
  if (plugin.aliases && Array.isArray(plugin.aliases)) {
    for (const alias of plugin.aliases) {
      commands.set(alias, commands.get(plugin.command));
    }
  }
  
  console.log(`📦 Commande enregistrée: ${plugin.command}`);
};

/**
 * Charge tous les plugins depuis le répertoire des plugins
 */
const loadPlugins = async () => {
  try {
    console.log('🔌 Chargement des plugins...');
    
    // Obtenir toutes les catégories de plugins
    const pluginsDir = path.join(process.cwd(), 'plugins');
    await fs.ensureDir(pluginsDir);
    
    const categories = await fs.readdir(pluginsDir);
    
    for (const category of categories) {
      // Ignorer les plugins désactivés
      if (config.disabledPlugins.includes(category)) continue;
      
      const categoryPath = path.join(pluginsDir, category);
      const categoryStats = await fs.stat(categoryPath);
      
      if (!categoryStats.isDirectory()) continue;
      
      // Obtenir tous les plugins dans cette catégorie
      const pluginFiles = await fs.readdir(categoryPath);
      
      for (const pluginFile of pluginFiles) {
        if (!pluginFile.endsWith('.js')) continue;
        
        // Ignorer les plugins désactivés
        if (config.disabledPlugins.includes(pluginFile.replace('.js', ''))) continue;
        
        try {
          const pluginPath = path.join(categoryPath, pluginFile);
          const plugin = await import(`file://${pluginPath}`);
          
          // Enregistrer le plugin
          if (!plugins[category]) {
            plugins[category] = {};
          }
          
          plugins[category][pluginFile.replace('.js', '')] = plugin.default;
          
          // Enregistrer les commandes
          if (plugin.default.command) {
            registerCommand(plugin.default);
          }
          
          console.log(`✅ Plugin chargé: ${category}/${pluginFile}`);
        } catch (error) {
          console.error(`❌ Erreur lors du chargement du plugin ${category}/${pluginFile}:`, error);
        }
      }
    }
    
    console.log(`🔌 ${Object.keys(commands).length} commandes chargées depuis les plugins`);
  } catch (error) {
    console.error('❌ Erreur lors du chargement des plugins:', error);
  }
};

/**
 * Obtient une commande par son nom
 * @param {string} cmd Nom de la commande
 * @returns {Object|null} Objet de commande ou null si non trouvé
 */
const getCommand = (cmd) => {
  return commands.get(cmd) || null;
};

/**
 * Obtient toutes les commandes
 * @returns {Map} Map de toutes les commandes
 */
const getCommands = () => {
  return commands;
};

/**
 * Obtient tous les plugins
 * @returns {Object} Objet contenant tous les plugins
 */
const getPlugins = () => {
  return plugins;
};

/**
 * Vérifie si un utilisateur peut exécuter une commande
 * @param {Object} cmd La commande
 * @param {Object} msg L'objet message
 * @param {boolean} isAdmin Si l'utilisateur est admin
 * @param {boolean} isOwner Si l'utilisateur est propriétaire
 * @returns {Object} Résultat de la vérification
 */
const canExecute = (cmd, msg, isAdmin, isOwner) => {
  if (cmd.owner && !isOwner) {
    return { success: false, reason: 'owner_only' };
  }
  
  if (cmd.admin && !isAdmin) {
    return { success: false, reason: 'admin_only' };
  }
  
  if (cmd.group && !msg.isGroup) {
    return { success: false, reason: 'group_only' };
  }
  
  // Vérifier le cooldown
  if (cmd.cooldown > 0) {
    const now = Date.now();
    const userId = msg.sender;
    const cmdCooldowns = cooldowns.get(cmd.command) || new Map();
    
    if (!cooldowns.has(cmd.command)) {
      cooldowns.set(cmd.command, cmdCooldowns);
    }
    
    if (cmdCooldowns.has(userId)) {
      const expirationTime = cmdCooldowns.get(userId) + (cmd.cooldown * 1000);
      
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return {
          success: false,
          reason: 'cooldown',
          timeLeft: Math.round(timeLeft)
        };
      }
    }
    
    cmdCooldowns.set(userId, now);
    setTimeout(() => cmdCooldowns.delete(userId), cmd.cooldown * 1000);
  }
  
  return { success: true };
};

export {
  loadPlugins,
  getCommands,
  getCommand,
  getPlugins,
  canExecute
};
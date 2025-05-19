/**
 * Plugin loader system for FX-GOD WhatsApp Bot
 */
import fs from 'fs-extra';
import path from 'path';
import config from '../config.js'; // Assurez-vous d'utiliser l'extension .js

// Store for loaded plugins
const plugins = {
  core: {},
  group: {},
  media: {},
  status: {},
  system: {}
};

// Command registry
const commands = {};

/**
 * Register a plugin command
 * @param {Object} plugin Plugin object with command information
 */
const registerCommand = (plugin) => {
  if (!plugin || !plugin.command || !plugin.handler) {
    throw new Error('Invalid plugin format - missing required fields');
  }
  
  // Register the command
  commands[plugin.command] = {
    handler: plugin.handler,
    help: plugin.help || `No help available for ${plugin.command}`,
    usage: plugin.usage || `.${plugin.command}`,
    category: plugin.category || 'misc',
    aliases: plugin.aliases || [],
    owner: plugin.owner || false,
    group: plugin.group || false,
    private: plugin.private || false,
    admin: plugin.admin || false,
    botAdmin: plugin.botAdmin || false,
    wait: plugin.wait || false
  };
  
  // Register aliases
  if (plugin.aliases && Array.isArray(plugin.aliases)) {
    for (const alias of plugin.aliases) {
      commands[alias] = commands[plugin.command];
    }
  }
  
  console.log(`📦 Registered command: ${plugin.command}`);
};

/**
 * Load all plugins from the plugins directory
 */
const loadPlugins = async () => {
  try {
    console.log('🔌 Loading plugins...');
    
    // Get all plugin categories
    const categories = await fs.readdir(path.join(__dirname, '../plugins'));
    
    for (const category of categories) {
      // Skip disabled plugins
      if (config.disabledPlugins.includes(category)) continue;
      
      const categoryPath = path.join(__dirname, '../plugins', category);
      const categoryStats = await fs.stat(categoryPath);
      
      if (!categoryStats.isDirectory()) continue;
      
      // Get all plugins in this category
      const pluginFiles = await fs.readdir(categoryPath);
      
      for (const pluginFile of pluginFiles) {
        if (!pluginFile.endsWith('.js')) continue;
        
        // Skip disabled plugins
        if (config.disabledPlugins.includes(pluginFile.replace('.js', ''))) continue;
        
        try {
          const pluginPath = path.join(categoryPath, pluginFile);
          const plugin = await import(pluginPath); // Utilisation de import dynamique pour charger le module
          
          // Register the plugin
          plugins[category][pluginFile.replace('.js', '')] = plugin.default; // Suppose que le module exporte par défaut un objet/plugin

          // Register commands
          if (plugin.default.command) {
            registerCommand(plugin.default); // Assurez-vous d'appeler la fonction avec l'objet correct
          }
          
          console.log(`✅ Loaded plugin: ${category}/${pluginFile}`);
        } catch (error) {
          console.error(`❌ Error loading plugin ${category}/${pluginFile}:`, error);
        }
      }
    }
    
    console.log(`🔌 Loaded ${Object.keys(commands).length} commands from plugins`);
  } catch (error) {
    console.error('❌ Error loading plugins:', error);
  }
};

/**
 * Get a list of all loaded commands
 * @returns {Object} Object containing all commands
 */
const getCommands = () => {
  return commands;
};

/**
 * Get a specific command by name
 * @param {string} cmd Command name
 * @returns {Object|null} Command object or null if not found
 */
const getCommand = (cmd) => {
  return commands[cmd] || null;
};

/**
 * Get all plugins
 * @returns {Object} Object containing all plugins
 */
const getPlugins = () => {
  return plugins;
};

export {
  loadPlugins,
  getCommands,
  getCommand,
  getPlugins
};
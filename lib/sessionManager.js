/**
 * Session management for WhatsApp connections
 * Version mise à jour avec fonctionnalités de session améliorées
 */
import { useMultiFileAuthState } from '@adiwajshing/baileys'; // Utilisation de la version originale de Baileys
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config.js';

/**
 * Save session ID to environment
 * @param {string} sessionId - L'ID de session à sauvegarder
 */
const saveSessionId = (sessionId) => {
  // Informer l'utilisateur de son ID de session pour qu'il puisse l'ajouter à ses variables d'environnement
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    INFORMATION DE SESSION                      ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║ Votre ID de session: ${sessionId}`);
  console.log('║                                                               ║');
  console.log('║ Pour réutiliser cette session à l\'avenir, ajoutez cette      ║');
  console.log('║ variable d\'environnement à votre configuration:              ║');
  console.log('║                                                               ║');
  console.log(`║ SESSION_ID=${sessionId}`);
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\n');
};

/**
 * Create a session manager for handling WhatsApp authentication
 * @param {string} sessionId Unique identifier for the session
 * @returns {Object} Session manager object
 */
const createSessionManager = (sessionId = config.sessionId) => {
    // Assurer que l'ID de session est unique
    if (!sessionId || sessionId === 'fx-god') {
      sessionId = `fx-god-${uuidv4().substring(0, 8)}`;
    }
    
    const sessionPath = path.join(config.sessionsDir, sessionId);
    
    /**
     * Ensure session directory exists
     */
    const ensureSessionDir = async () => {
      await fs.ensureDir(sessionPath);
    };
    
    /**
     * Get authentication state for the session
     */
    const getAuthState = async () => {
      await ensureSessionDir();
      const authState = await useMultiFileAuthState(sessionPath);
      
      // Informer l'utilisateur de l'ID de session dans la console
      saveSessionId(sessionId);
      
      return authState;
    };
    
    /**
     * Reset session by removing all auth files
     */
    const resetSession = async () => {
      try {
        await fs.emptyDir(sessionPath);
        return true;
      } catch (error) {
        console.error('Error resetting session:', error);
        return false;
      }
    };
    
    /**
     * List all available sessions
     */
    const listSessions = async () => {
      try {
        await fs.ensureDir(config.sessionsDir);
        const files = await fs.readdir(config.sessionsDir);
        const sessions = [];
        
        for (const file of files) {
          const statsPath = path.join(config.sessionsDir, file);
          try {
            const stats = await fs.stat(statsPath);
            if (stats.isDirectory()) {
              sessions.push({
                id: file,
                createdAt: stats.birthtime,
                path: statsPath
              });
            }
          } catch (error) {
            console.error(`Error reading session ${file}:`, error);
          }
        }
        
        return sessions;
      } catch (error) {
        console.error('Error listing sessions:', error);
        return [];
      }
    };

    return { getAuthState, resetSession, listSessions };
};

export default createSessionManager;
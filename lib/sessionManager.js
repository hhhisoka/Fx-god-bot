/**
 * Session management for WhatsApp connections
 */
const { useMultiFileAuthState } = require('@adiwajshing/baileys');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

/**
 * Create a session manager for handling WhatsApp authentication
 * @param {string} sessionId Unique identifier for the session
 * @returns {Object} Session manager object
 */
const createSessionManager = (sessionId = config.sessionId) => {
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
    return await useMultiFileAuthState(sessionPath);
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
      const files = await fs.readdir(config.sessionsDir);
      const sessions = [];
      
      for (const file of files) {
        const stats = await fs.stat(path.join(config.sessionsDir, file));
        if (stats.isDirectory()) {
          sessions.push({
            id: file,
            createdAt: stats.birthtime,
            path: path.join(config.sessionsDir, file)
          });
        }
      }
      
      return sessions;
    } catch (error) {
      console.error('Error listing sessions:', error);
      return [];
    }
  };
  
  return {
    sessionId,
    sessionPath,
    getAuthState,
    resetSession,
    listSessions,
    ensureSessionDir
  };
};

module.exports = { createSessionManager };

/**
 * Configuration file for FX-GOD WhatsApp Bot
 * Version mise à jour avec fonctionnalités avancées de gestion de session
 */
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';

dotenv.config();

/**
 * Générer un ID de session unique s'il n'est pas défini
 * @returns {string} ID de session
 */
const generateSessionId = () => {
    // Priorité de source d'ID de session:
    // 1. Variable d'environnement SESSION_ID
    // 2. Fichier session-id.txt s'il existe
    // 3. Génération aléatoire avec préfixe fx-god-
    
    // Vérifier si défini dans les variables d'environnement
    if (process.env.SESSION_ID) {
        return process.env.SESSION_ID;
    }
    
    // Vérifier si un fichier session-id.txt existe
    try {
        const sessionFilePath = path.join(process.cwd(), 'session-id.txt');
        if (fs.existsSync(sessionFilePath)) {
            const savedId = fs.readFileSync(sessionFilePath, 'utf8').trim();
            if (savedId && savedId.length > 0) {
                return savedId;
            }
        }
    } catch (error) {
        console.error("Erreur lors de la lecture du fichier session-id.txt:", error);
    }
    
    // Générer un nouvel ID et le sauvegarder
    const newId = `fx-god-${uuidv4().substring(0, 8)}`;
    try {
        fs.writeFileSync(path.join(process.cwd(), 'session-id.txt'), newId);
    } catch (error) {
        console.error("Erreur lors de la sauvegarde de l'ID de session:", error);
    }
    
    return newId;
};

// Configuration du bot
const config = {
    // Bot info
    name: "FX-GOD",
    version: "1.0.0",
    prefix: process.env.BOT_PREFIX || ".", // Command prefix
    
    // Owner/Admin info
    owner: process.env.OWNER_NUMBER || "2250101676111",
    ownerName: process.env.OWNER_NAME || "hhhisoka",
    
    // Auto-join group link (if enabled)
    autoJoinGroup: process.env.AUTO_JOIN_GROUP || "",
    // Group to join with owner after deployment
    ownerJoinGroup: process.env.OWNER_JOIN_GROUP || "",
    
    // Session settings
    sessionId: generateSessionId(),
    sessionsDir: "./sessions",
    
    // Notification settings
    notifySessionIdViaWhatsApp: process.env.NOTIFY_SESSION_ID !== "false", // Envoyer l'ID par WhatsApp sauf si désactivé
    
    // Media settings
    mediaDir: "./media",
    tempDir: "./temp",
    
    // Plugin settings
    disabledPlugins: (process.env.DISABLED_PLUGINS || "")
        .split(",")
        .map(p => p.trim()),
    
    // Status settings
    ghostMode: process.env.GHOST_MODE === "true",
    alwaysOnline: process.env.ALWAYS_ONLINE === "true",
    autoReadStatus: process.env.AUTO_READ_STATUS === "true",
    
    // Group settings
    antiLink: process.env.ANTI_LINK === "true",
    removeOnAntiLink: process.env.REMOVE_ON_ANTI_LINK === "true",
    antiViewOnce: process.env.ANTI_VIEW_ONCE === "true",
    
    // Connection options
    usePairingCode: process.env.USE_PAIRING_CODE === "true",
    
    // Platform detection (for cross-platform compatibility)
    isHeroku: process.env.HEROKU_APP_NAME ? true : false,
    isReplit: process.env.REPL_ID ? true : false,
    isGlitch: process.env.PROJECT_DOMAIN ? true : false,
    isTermux: process.platform === "android",
    
    // Récupérer facilement le nom de la plateforme
    getPlatformName() {
        if (this.isHeroku) return "Heroku";
        if (this.isReplit) return "Replit";
        if (this.isGlitch) return "Glitch";
        if (this.isTermux) return "Termux";
        return "Autre";
    }
};

// Créer les répertoires requis au démarrage
try {
    [config.sessionsDir, config.mediaDir, config.tempDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ Répertoire créé: ${dir}`);
        }
    });
} catch (error) {
    console.error("❌ Erreur lors de la création des répertoires:", error);
}

export default config;
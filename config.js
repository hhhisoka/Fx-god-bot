/**
 * Configuration file for FX-GOD WhatsApp Bot
 */
require("dotenv").config();

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
    sessionId: process.env.SESSION_ID || "fx-god",
    sessionsDir: "./sessions",

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
    isTermux: process.platform === "android"
};

module.exports = config;

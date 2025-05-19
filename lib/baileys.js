/**
 * Baileys integration for WhatsApp connection
 */
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore
} = require("@adiwajshing/baileys");
const { Boom } = require("@hapi/boom");
const fs = require("fs-extra");
const readline = require("readline");
const { createSessionManager } = require("./sessionManager");
const { handleCommand } = require("./commandHandler");
const config = require("../config");

// Global connections store
const connections = {};

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to ask a question and get user input
const question = text => new Promise(resolve => rl.question(text, resolve));

/**
 * Start the WhatsApp bot
 * @param {Object} options Configuration options
 * @returns {Object} WhatsApp connection object
 */
const startBot = async (options = {}) => {
    const sessionManager = createSessionManager(config.sessionId);
    const { state, saveCreds } = await sessionManager.getAuthState();

    // Fetch latest Baileys version
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📱 Using WA v${version.join(".")}, isLatest: ${isLatest}`);

    // Create in-memory message store
    const store = makeInMemoryStore({});

    // Ask for connection method preference
    const usePairingCode =
        config.usePairingCode ||
        (await question(`Choisissez une méthode de connexion:
1. QR Code (scanner avec votre téléphone)
2. Pairing Code (entrer un code sur votre téléphone)
Votre choix (1/2): `)) === "2";

    const phoneNumber = usePairingCode
        ? await question(
              "Entrez votre numéro WhatsApp (format international sans +, ex: 33612345678): "
          )
        : "";

    // Set up connection
    const startConnection = async () => {
        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: !usePairingCode,
            browser: ["FX-GOD Bot", "Chrome", "1.0.0"],
            syncFullHistory: false,
            markOnlineOnConnect: !config.ghostMode,
            patchMessageBeforeSending: message => {
                const requiresPatch = !!(
                    message.buttonsMessage ||
                    message.templateMessage ||
                    message.listMessage
                );
                if (requiresPatch) {
                    message = {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadataVersion: 2,
                                    deviceListMetadata: {}
                                },
                                ...message
                            }
                        }
                    };
                }
                return message;
            }
        });

        // Save connection in global store
        connections[config.sessionId] = sock;

        // Set up auth credentials update handler
        sock.ev.on("creds.update", saveCreds);

        // Handle connection updates
        sock.ev.on("connection.update", async update => {
            const { connection, lastDisconnect, qr } = update;

            // Handle QR code display in terminal if needed
            if (qr && options.printQR) {
                options.printQR(qr);
            }

            // Handle pairing code request for specified phone number
            if (usePairingCode && connection === "open" && phoneNumber) {
                try {
                    const code = await sock.requestPairingCode(phoneNumber);
                    console.log(`⚡ Votre code d'appairage est: ${code}`);
                    console.log(`📱 Sur votre téléphone: WhatsApp > Appareils liés > Lier un appareil > Entrez le code ci-dessus`);
                } catch (error) {
                    console.error("Erreur lors de la génération du code d'appairage:", error);
                }
            }

            // Trigger custom callback on connection update if provided.
            if (options.onConnectionUpdate) {
                options.onConnectionUpdate(update);
            }

            // Handle disconnection and reconnect logic.
            if (connection === "close") {
                const shouldReconnect =
                    lastDisconnect?.error instanceof Boom &&
                    lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;

                console.log(`🔴 Connection closed due to ${lastDisconnect?.error}. ${shouldReconnect ? "Reconnecting..." : "Not reconnecting."}`);

                if (shouldReconnect) {
                    await startConnection();
                }
            }

            // Close readline interface when connection is established.
            if (connection === 'open') {
                rl.close();
            }
        });

        // Handle incoming messages and commands
        sock.ev.on("messages.upsert", async ({ messages, type }) => {
            if (type !== "notify") return;
            
            for (const message of messages) {
                try {
                    await handleCommand(sock, message);
                } catch (error) {
                    console.error("Error handling message:", error);
                }
            }
        });

        return sock;
    };

    const conn = await startConnection();
    return { conn, startConnection };
};

/**
 * Get a connection by session ID
 * @param {string} sessionId The session ID 
 * @returns {Object} The WhatsApp connection 
 */
const getConnection = (sessionId) => connections[sessionId || config.sessionId];

// Export the functions for use in other modules.
module.exports = { startBot, getConnection };
const { startBot } = require('./lib/baileys');
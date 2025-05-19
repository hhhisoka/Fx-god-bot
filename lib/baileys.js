/**
 * Baileys integration for WhatsApp connection
 */
import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore
} from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import fs from "fs-extra";
import readline from "readline";
import { createSessionManager } from "./sessionManager.js"; // Ajoutez l'extension .js
import { handleCommand } from "./commandHandler.js"; // Ajoutez l'extension .js
import config from "../config.js"; // Ajoutez l'extension .js

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

        connections[config.sessionId] = sock;
        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", async update => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && options.printQR) {
                options.printQR(qr);
            }

            if (usePairingCode && connection === "open" && phoneNumber) {
                try {
                    const code = await sock.requestPairingCode(phoneNumber);
                    console.log(`⚡ Votre code d'appairage est: ${code}`);
                    console.log(`📱 Sur votre téléphone: WhatsApp > Appareils liés > Lier un appareil > Entrez le code ci-dessus`);
                } catch (error) {
                    console.error("Erreur lors de la génération du code d'appairage:", error);
                }
            }

            if (options.onConnectionUpdate) {
                options.onConnectionUpdate(update);
            }

            if (connection === "close") {
                const shouldReconnect =
                    lastDisconnect?.error instanceof Boom &&
                    lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;

                console.log(`🔴 Connection closed due to ${lastDisconnect?.error}. ${shouldReconnect ? "Reconnecting..." : "Not reconnecting."}`);

                if (shouldReconnect) {
                    await startConnection();
                }
            }

            if (connection === 'open') {
                rl.close();
            }
        });

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

export { startBot, getConnection }; // Utilisez export pour les exports dans ES Modules
// lib/baileys.js (modifications)
import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    proto
} from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import fs from "fs-extra";
import readline from "readline";
import { v4 as uuidv4 } from 'uuid';
import { createSessionManager } from "./sessionManager.js";
import { handleCommand } from "./commandHandler.js";
import config from "../config.js";

// Global connections store
const connections = {};

// Create readline interface for user input (si pas d'interface web)
let rl;
if (!global.webSocket) {
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

// Function to ask a question and get user input
const question = text => {
    if (global.webSocket) {
        // Si l'interface web est active, on attend la réponse via socket.io
        return new Promise(resolve => {
            console.log(text);
            global.pendingQuestion = { resolve, text };
        });
    } else {
        // Sinon, on utilise readline
        return new Promise(resolve => rl.question(text, resolve));
    }
};

/**
 * Display session ID information box in console
 * @param {string} sessionId - ID de session à afficher
 */
const displaySessionInfo = (sessionId) => {
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
 * Envoie l'ID de session au propriétaire via WhatsApp
 * @param {object} sock - Instance de connexion WhatsApp
 * @param {string} sessionId - ID de session à envoyer
 */
const sendSessionIdToOwner = async (sock, sessionId) => {
    try {
        if (!config.owner) {
            console.log("⚠️ Numéro du propriétaire non défini, impossible d'envoyer l'ID de session");
            return;
        }

        // Vérifier si nous sommes sur Termux
        if (config.isTermux) {
            console.log("📱 Déploiement sur Termux détecté, l'ID de session n'est pas envoyé par WhatsApp");
            return;
        }

        const ownerJid = `${config.owner}@s.whatsapp.net`;
        
        // Message avec formatage Markdown pour l'ID de session
        const sessionMessage = `🔐 *INFORMATION DE SESSION FX-GOD BOT* 🔐\n\n` +
            `📱 *ID de Session*: \`${sessionId}\`\n\n` +
            `Pour réutiliser cette session à l'avenir, ajoutez cette variable d'environnement:\n\n` +
            `\`\`\`\nSESSION_ID=${sessionId}\n\`\`\`\n\n` +
            `✅ *Cette session est active et fonctionnelle*\n` +
            `📅 Date: ${new Date().toLocaleString()}\n` +
            `🌐 Plateforme: ${getPlatformName()}\n`;
            
        await sock.sendMessage(ownerJid, { text: sessionMessage });
        console.log(`✅ ID de session envoyé au propriétaire (${config.owner}) via WhatsApp`);
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'ID de session via WhatsApp:", error);
    }
};

/**
 * Obtient le nom de la plateforme de déploiement
 * @returns {string} Nom de la plateforme
 */
const getPlatformName = () => {
    if (config.isHeroku) return "Heroku";
    if (config.isReplit) return "Replit";
    if (config.isGlitch) return "Glitch";
    if (config.isTermux) return "Termux";
    return "Autre";
};

/**
 * Start the WhatsApp bot
 * @param {Object} options Configuration options
 * @returns {Object} WhatsApp connection object
 */
const startBot = async (options = {}) => {
    // Générer un ID de session unique s'il n'est pas déjà défini
    if (!config.sessionId || config.sessionId === 'fx-god') {
        config.sessionId = `fx-god-${uuidv4().substring(0, 8)}`;
    }
    
    const sessionManager = createSessionManager(config.sessionId);
    const { state, saveCreds } = await sessionManager.getAuthState();

    // Fetch latest Baileys version
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📱 Using WA v${version.join(".")}, isLatest: ${isLatest}`);

    // Create in-memory message store
    const store = makeInMemoryStore({});

    // Déterminer le mode de connexion (QR ou pairage)
    let usePairingCode = config.usePairingCode;
    let phoneNumber = '';
    
    // Si l'interface web n'est pas active, demander via console
    if (!global.webSocket) {
        usePairingCode = usePairingCode || 
            (await question(`Choisissez une méthode de connexion:
1. QR Code (scanner avec votre téléphone)
2. Pairing Code (entrer un code sur votre téléphone)
Votre choix (1/2): `)) === "2";

        if (usePairingCode) {
            phoneNumber = await question(
                "Entrez votre numéro WhatsApp (format international sans +, ex: 33612345678): "
            );
        }
    } else {
        // Si l'interface web est active, attendre le mode choisi par l'utilisateur
        if (global.webQRRequested) {
            usePairingCode = false;
            global.webQRRequested = false;
        } else if (global.connectionMode === 'pairing') {
            usePairingCode = true;
            phoneNumber = global.pairingPhoneNumber;
        }
    }

    // Set up connection
    const startConnection = async () => {
        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: !usePairingCode && !global.webSocket,
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

            // Gérer le QR code
            if (qr) {
                if (global.webSocket) {
                    // Envoyer le QR à l'interface web
                    global.webSocket.emit('qr', qr);
                    global.webSocket.emit('connectionStatus', 'QR code généré. En attente de scan...');
                } else if (options.printQR) {
                    options.printQR(qr);
                }
            }

            // Gérer le code de pairage
            if (usePairingCode && connection === "open" && phoneNumber) {
                try {
                    const code = await sock.requestPairingCode(phoneNumber);
                    
                    if (global.webSocket) {
                        // Envoyer le code de pairage à l'interface web
                        global.webSocket.emit('pairingCode', code);
                        global.webSocket.emit('connectionStatus', 'Code d\'appairage généré. En attente d\'entrée du code...');
                    } else {
                        console.log(`⚡ Votre code d'appairage est: ${code}`);
                        console.log(`📱 Sur votre téléphone: WhatsApp > Appareils liés > Lier un appareil > Entrez le code ci-dessus`);
                    }
                } catch (error) {
                    console.error("Erreur lors de la génération du code d'appairage:", error);
                    
                    if (global.webSocket) {
                        global.webSocket.emit('connectionStatus', 'Erreur lors de la génération du code d\'appairage.');
                    }
                }
            }

            // Notification de mise à jour de connexion
            if (options.onConnectionUpdate) {
                options.onConnectionUpdate(update);
            }

            // Lorsque la connexion est établie
            if (connection === 'open') {
                // Afficher l'ID de session dans la console
                displaySessionInfo(config.sessionId);
                
                // Notifier l'interface web
                if (global.webSocket) {
                    global.webSocket.emit('connected', { 
                        sessionId: config.sessionId,
                        platform: getPlatformName()
                    });
                }
                
                // Attendre un moment pour s'assurer que la connexion est bien établie
                // avant d'envoyer l'ID de session
                setTimeout(async () => {
                    await sendSessionIdToOwner(sock, config.sessionId);
                }, 5000);
                
                // Fermer readline si actif
                if (rl) rl.close();
            }

            // Gérer la déconnexion
            if (connection === "close") {
                const shouldReconnect =
                    lastDisconnect?.error instanceof Boom &&
                    lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;

                console.log(`🔴 Connection closed due to ${lastDisconnect?.error}. ${shouldReconnect ? "Reconnecting..." : "Not reconnecting."}`);
                
                if (global.webSocket) {
                    global.webSocket.emit('connectionStatus', `Connexion fermée. ${shouldReconnect ? "Tentative de reconnexion..." : "Échec de connexion."}`);
                }

                if (shouldReconnect) {
                    await startConnection();
                }
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

export { startBot, getConnection };
// web/server.js
import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import config from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Crée et configure un serveur web pour l'interface de pairage
 */
const createWebServer = () => {
    const app = express();
    const server = http.createServer(app);
    const io = new SocketIO(server);
    
    // Servir les fichiers statiques
    app.use(express.static(path.join(__dirname, 'public')));
    
    // Page d'accueil
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    
    // API pour obtenir la liste des sessions
    app.get('/api/sessions', async (req, res) => {
        try {
            const sessionsDir = path.join(process.cwd(), config.sessionsDir);
            await fs.ensureDir(sessionsDir);
            
            const sessions = await fs.readdir(sessionsDir);
            const sessionData = [];
            
            for (const session of sessions) {
                const sessionPath = path.join(sessionsDir, session);
                const stats = await fs.stat(sessionPath);
                
                if (stats.isDirectory()) {
                    // Vérifier s'il y a des fichiers auth dans le dossier
                    const files = await fs.readdir(sessionPath);
                    const hasAuthFiles = files.some(file => file.includes('auth'));
                    
                    sessionData.push({
                        id: session,
                        createdAt: stats.birthtime,
                        active: hasAuthFiles
                    });
                }
            }
            
            res.json(sessionData);
        } catch (error) {
            console.error('Erreur lors de la récupération des sessions:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    });
    
    // API pour supprimer une session
    app.delete('/api/sessions/:id', async (req, res) => {
        try {
            const sessionId = req.params.id;
            const sessionPath = path.join(process.cwd(), config.sessionsDir, sessionId);
            
            if (await fs.pathExists(sessionPath)) {
                await fs.remove(sessionPath);
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Session non trouvée' });
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de la session:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    });
    
    // Événements Socket.IO
    io.on('connection', (socket) => {
        console.log('Nouvelle connexion à l\'interface web');
        
        // Événement pour demander un nouveau QR code
        socket.on('requestQR', () => {
            console.log('Interface web: demande de QR code');
            global.webQRRequested = true;
        });
        
        // Événement pour choisir le mode de connexion
        socket.on('connectionMode', (mode) => {
            global.connectionMode = mode;
            console.log(`Interface web: mode de connexion ${mode} sélectionné`);
        });
        
        // Événement pour fournir le numéro de téléphone pour le code de pairage
        socket.on('phoneNumber', (number) => {
            global.pairingPhoneNumber = number;
            console.log(`Interface web: numéro de téléphone fourni pour le pairage`);
        });
    });
    
    // Variables globales pour la communication
    global.webQRRequested = false;
    global.webSocket = io;
    global.connectionMode = 'qr'; // 'qr' ou 'pairing'
    global.pairingPhoneNumber = '';
    
    return {
        app,
        server,
        io,
        start: (port = 3000) => {
            server.listen(port, () => {
                console.log(`🌐 Interface web disponible sur http://localhost:${port}`);
                console.log(`📱 Accédez à cette adresse depuis votre navigateur pour pairer le bot`);
            });
        }
    };
};

export default createWebServer;
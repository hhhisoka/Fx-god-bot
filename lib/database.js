// lib/database.js
import fs from 'fs-extra';
import path from 'path';
import config from '../config.js';

// Chemin vers le dossier de base de données
const DB_FOLDER = path.join(process.cwd(), 'database');
fs.ensureDirSync(DB_FOLDER);

class Database {
    constructor(name) {
        this.name = name;
        this.path = path.join(DB_FOLDER, `${name}.json`);
        this.data = this.load();
        
        // S'assurer que le fichier existe
        this.save();
    }
    
    load() {
        try {
            if (fs.existsSync(this.path)) {
                const content = fs.readFileSync(this.path, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.error(`Erreur lors du chargement de la base de données ${this.name}:`, error);
        }
        return {};
    }
    
    save() {
        try {
            fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error(`Erreur lors de la sauvegarde de la base de données ${this.name}:`, error);
            return false;
        }
    }
    
    get(key, defaultValue = null) {
        return key in this.data ? this.data[key] : defaultValue;
    }
    
    set(key, value) {
        this.data[key] = value;
        return this.save();
    }
    
    has(key) {
        return key in this.data;
    }
    
    delete(key) {
        if (key in this.data) {
            delete this.data[key];
            return this.save();
        }
        return false;
    }
    
    clear() {
        this.data
import sqlite3 from 'sqlite3'
import {Database, open} from 'sqlite'
import fs from 'fs/promises'
import {IConfig} from './Config.js'

/**
 * Class that handles database operations.
 */
export default class DB {
    constructor(private _config: IConfig) {
        const dir = './db'
        fs.access(dir)
            .then(() => console.log('DB directory exists'))
            .catch(() => {
                fs.mkdir('./db')
                    .then(() => console.log('DB directory created'))
                    .catch((err) => console.error('Unable to create DB directory', err))
            })
    }

    private _db: Database<sqlite3.Database> | undefined = undefined

    private async getDb(): Promise<Database<sqlite3.Database> | undefined> {
        if (!this._db) {
            this._db = await open({
                filename: './db/server_bot.db',
                driver: sqlite3.Database
            })
            if (this._config.traceDatabaseQueries) {
                this._db.on('trace', (data) => {
                    console.log('SQL Trace:', data)
                })
            }
        }
        return this._db
    }

    private async ensureServerIconTable() {
        const db = await this.getDb()
        await db.exec('CREATE TABLE IF NOT EXISTS server_icons (id INTEGER PRIMARY KEY, file TEXT, date TEXT)')
    }

    /**
     * Will register an icon as used.
     * @param file File name of the icon.
     * @param date Date the icon was used.
     */
    async registerServerIcon(file: string, date: string): Promise<boolean> {
        const db = await this.getDb()
        if (db) {
            await this.ensureServerIconTable()
            const stmt = await db.prepare('INSERT INTO server_icons (file, date) VALUES (?,?)')
            const result = await stmt.run(file, date)
            if (result.lastID) return true
        }
        return false
    }

    /**
     * Will return all icons that have previously been used.
     */
    async getAllServerIcons(): Promise<string[]> {
        const db = await this.getDb()
        if (db) {
            await this.ensureServerIconTable()
            const result = await db.all('SELECT file FROM server_icons')
            return result.map(row => row.file)
        }
        return []
    }
}
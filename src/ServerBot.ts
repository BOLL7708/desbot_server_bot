// Create a new client instance
// https://discordjs.guide/creating-your-bot/main-file.html#running-your-application
import {Client, Events, GatewayIntentBits, ThreadAutoArchiveDuration} from 'discord.js'
import DB from './DB.js'
import {CronJob} from 'cron'
import Tasks from './Tasks.js'
import Config, {IConfig} from './Config.js'

/**
 * The Discord server bot.
 */
export default class ServerBot {
    private _config: IConfig
    private _db: DB

    async start() {
        // Init
        this._config = await Config.get()
        this._db = new DB(this._config)

        // Set server icon job
        const serverIconJob = new CronJob(
            this._config.serverIconInterval, // second, minute, hour, day of month, month, day of week
            () => {
                const message = 'Setting server icon.'
                Tasks.logMessage(this._config, client, message)
                Tasks.setServerIcon(this._config, this._db, client)
            },
            null,
            false
        )

        // Load Reddit RSS feed
        const redditRSSJob = new CronJob(
            '0 */10 * * * *',
            ()=>{
                const message = 'Posting new Reddit thread.'
                Tasks.logMessage(this._config, client, message)
                Tasks.loadRedditRSS(this._config, this._db)
            },
            null,
            false
        )

        // Create Discord client
        const client: Client = new Client({intents: [GatewayIntentBits.Guilds]})
        client.once(Events.ClientReady, c => {
            console.log(`Ready! Logged in as ${c.user.tag}`)
            Tasks.logMessage(this._config, client, 'Bot connected.')
            serverIconJob.start()
            redditRSSJob.start()
        })

        // Log in to Discord with your client's token
        if (!this._config?.token) throw new Error('No token found in config.json or config.local.json')
        else client.login(this._config.token).then()
    }
}
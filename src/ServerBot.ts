// Create a new client instance
// https://discordjs.guide/creating-your-bot/main-file.html#running-your-application
import {AttachmentBuilder, Client, Events, ForumChannel, GatewayIntentBits, ThreadAutoArchiveDuration} from 'discord.js'
import fs from 'fs/promises'
import DB from './DB.js'

/**
 * The Discord server bot.
 */
export default class ServerBot {
    private _config: IConfig
    private _db = new DB()

    async start() {
        const client: Client = new Client({intents: [GatewayIntentBits.Guilds]})

        // When the client is ready, run this code (only once)
        // We use 'c' for the event parameter to keep it separate from the already defined 'client'
        client.once(Events.ClientReady, c => {
            console.log(`Ready! Logged in as ${c.user.tag}`)
            this.setServerIcon(c)
        })

        // Log in to Discord with your client's token
        const localConfigBuffer = await fs.readFile('./config.local.json')
        if (localConfigBuffer) {
            this._config = JSON.parse(localConfigBuffer.toString())
        } else {
            const configBuffer = await fs.readFile('./config.json')
            if (configBuffer) this._config = JSON.parse(configBuffer.toString())
        }
        if (!this._config?.token) throw new Error('No token found in config.json or config.local.json')
        else client.login(this._config.token).then()
    }

    private async setServerIcon(client: Client) {
        // Load image files
        const path = './images/icon_test' // TODO: Switch to live folder after test
        const files = await fs.readdir(path)

        console.log('files', files)

        // Load which files have already been used and remove them from the pool
        const existingIcons = await this._db.getAllServerIcons()
        for (const existingIcon of existingIcons) {
            const index = files.indexOf(existingIcon)
            if (index > -1) files.splice(index, 1)
        }

        // Pick a random file
        const file = files[Math.floor(Math.random() * files.length)]
        const isNewFile = !!file
        const filePath = isNewFile
            ? `${path}/${file}`
            : `./images/icon.png`

        console.log('filePath', filePath)

        // Set server icon
        const guild = client.guilds.cache.get(this._config.serverId)
        const iconResult = await guild.setIcon(filePath)
        if (!iconResult) return console.error('Failed to set server icon.') // TODO: Pretty sure I have to check a value inside the response.
        if(!isNewFile) return console.log('No new file so reset to default and will not post image or save in DB.')

        // Post server icon to forum channel
        let date = new Date()
        date = new Date(date.getTime() + (date.getTimezoneOffset() * 60 * 1000))
        const dateStr = date.toISOString().substring(0, 10)
        const attachment = new AttachmentBuilder(filePath, {name: 'server-icon.png'})
        const channel = client.channels.cache.get(this._config.serverIconChannelId) as ForumChannel
        if (channel.threads) {
            const channelResponse = await channel.threads.create({
                name: dateStr,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                reason: 'Daily server icon update.',
                message: {
                    files: [attachment]
                }
            })
            if (!channelResponse) console.error('Failed to create thread.') // TODO: Not sure if this is the right way to check for success.
        }

        // Register in DB
        await this._db.registerServerIcon(file, dateStr)
    }
}

/**
 * The configuration stored on file as config.json or config.local.json.
 */
interface IConfig {
    clientId: string
    clientSecret: string
    token: string
    serverId: string
    serverIconChannelId: string
}
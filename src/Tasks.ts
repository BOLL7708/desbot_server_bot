import {AttachmentBuilder, Client, ForumChannel, TextChannel, ThreadAutoArchiveDuration} from 'discord.js'
import fs from 'fs/promises'
import DB from './DB.js'
import {IConfig} from './Config.js'

export default class Tasks {
    /**
     * Logs a message to the log channel.
     * @param config
     * @param client
     * @param message
     */
    static async logMessage(config: IConfig, client: Client, message: string) {
        const channel = client.channels.cache.get(config.logChannelId) as TextChannel
        if (channel) await channel.send({content: message})
        else console.error('Failed to find log channel.')
    }

    /**
     * Sets the server icon to a random image.
     * @param config
     * @param db
     * @param client
     */
    static async setServerIcon(config: IConfig, db: DB, client: Client) {
        // Load image files
        const path = './images/icons'
        const files = await fs.readdir(path)

        // Load which files have already been used and remove them from the pool
        const existingIcons = await db.getAllServerIcons()
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

        // Set server icon
        const guild = client.guilds.cache.get(config.serverId)
        const iconResult = await guild.setIcon(filePath)
        if (!iconResult) return console.error('Failed to set server icon.') // TODO: Pretty sure I have to check a value inside the response.
        if (!isNewFile) return console.log('No new file so reset to default and will not post image or save in DB.')

        // Post server icon to forum channel
        let date = new Date()
        date = new Date(date.getTime() + (date.getTimezoneOffset() * 60 * 1000))
        const dateStr = date.toISOString().substring(0, 10)
        const attachment = new AttachmentBuilder(filePath, {name: 'server-icon.png'})
        const channel = client.channels.cache.get(config.serverIconChannelId) as ForumChannel
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
        await db.registerServerIcon(file, dateStr)
    }
}
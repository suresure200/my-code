// Dependencies
const Discord = require('discord.js'); 
const fs = require('fs');
const config = require('./config.json');
const CatLoggr = require('cat-loggr');
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Online Yo boi!!'));

app.listen(port, () =>
    console.log(`Your app is listening at http://localhost:${port}`)
);

// Functions
const client = new Discord.Client();
const log = new CatLoggr();

// New discord collections
client.commands = new Discord.Collection();

// Logging
if (config.debug === true) client.on('debug', stream => log.debug(stream));
client.on('warn', message => log.warn(message));
client.on('error', error => log.error(error));

// Load commands from folder
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    log.init(`Loaded command ${file.split('.')[0] === command.name ? file.split('.')[0] : `${file.split('.')[0]} as ${command.name}`}`);
    client.commands.set(command.name, command);
}

// Client login
client.login(process.env.token);

client.once('ready', () => {
    log.info(`I am logged in as ${client.user.tag} to Discord!`);
    client.user.setActivity(`${config.prefix}Keep ya head up `, { type: "PLAYING" });
});

// Discord message event and command handling
client.on('message', (message) => {
    if (!message.content.startsWith(config.prefix)) return;
    if (message.author.bot) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (config.command.notfound_message === true && !client.commands.has(command)) {
        return message.channel.send(
            new Discord.MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Unknown command :(')
                .setDescription(`Sorry, but I cannot find the \`${command}\` command!`)
                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                .setTimestamp()
        );
    }

    try {
        client.commands.get(command).execute(message, args);
    } catch (error) {
        log.error(error);
        if (config.command.error_message === true) {
            message.channel.send(
                new Discord.MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Error occurred!')
                    .setDescription(`An error occurred while executing the \`${command}\` command!`)
                    .addField('Error', `\`\`\`js\n${error}\n\`\`\``)
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
            );
        }
    }
});

// New command to display a custom message with a link and an image
client.on('message', async (message) => {
    if (message.content.startsWith(`${config.prefix}link`)) {
        const args = message.content.split(' ').slice(1);
        if (args.length < 3) {
            return message.channel.send('Usage: !link <message> <URL> <Image URL>');
        }
        const customMessage = args.slice(0, -2).join(' ');
        const link = args[args.length - 2];
        const imageUrl = args[args.length - 1];

        const embed = new Discord.MessageEmbed()
            .setColor('#00ff00')
            .setTitle('Custom Link')
            .setDescription(`${customMessage}\n[Click Here](${link})`)
            .setImage("https://media.giphy.com/media/KiruB1SvxiEPrsReDw/giphy.gif") // Adds the image below the text
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp();

        message.channel.send(embed);
    }
});
("https://media.giphy.com/media/KiruB1SvxiEPrsReDw/giphy.gif")

// commands/botCommands.js
const os = require('os');

async function handleBotCommand(sock, from, command, argsList) {
  switch (command) {
    case 'ping':
      await sock.sendMessage(from, { text: '🏓 *Pong!* Ultra-fast process responder active.' });
      break;

    case 'status':
      const stats = `⚡ *LIVE CLOUD CONTAINER METRICS*:\n\n` +
                    `• Active Engine PID: \`${process.pid}\`\n` +
                    `• Architecture: \`${os.platform()} (${os.arch()})\`\n` +
                    `• Allocated Memory: \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``;
      await sock.sendMessage(from, { text: stats });
      break;

    case 'help':
    case 'menu':
      const menuText = `🤖 *HIGH-SPEED BOT COMMANDS*:\n\n` +
                       `• \`!ping\` - Latency validation check.\n` +
                       `• \`!status\` - Live cluster container statistics.\n` +
                       `• \`!menu\` - View operational panel overview.`;
      await sock.sendMessage(from, { text: menuText });
      break;

    default:
      break;
  }
}

module.exports = { handleBotCommand };

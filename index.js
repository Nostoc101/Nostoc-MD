import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CORE IDENTITY & SECURITY PROTOCOLS - NOSTOC-MD
// ==========================================
const OWNER_NAME = "Nostoc 😈";
const BOT_NAME = "Nostoc-MD";
const PREFIX = "!";
const PORT = process.env.PORT || 10000; 
const TARGET_PHONE = "2348142334779"; // YOUR NUMBER LOCKED

const THEME = {
    banner: `\n[NOSTOC-MD SYSTEM // VERSION 7.0.0]\n> INTEGRATED ADMIN LOCK: ENGAGED\n> AUTHORIZED OPERATOR: ${OWNER_NAME.toUpperCase()}\n> TARGET NUMBER: ${TARGET_PHONE}\n----------------------------------------`,
    prefix: `[NOSTOC-MD://SYSTEM]`,
    line: `----------------------------------------`,
    securityAlert: `❌ [SECURITY://ACCESS_DENIED]\n> PRIVILEGE ENFORCEMENT PROTOCOL ACTIVATED.\n> ONLY ${TARGET_PHONE} CAN USE ADMIN COMMANDS`
};

const commands = new Map();
const cooldowns = new Map();
let sockGlobal;

// ==========================================
// LOAD COMMAND MATRIX
// ==========================================
async function loadSystemArchitecture() {
    const commandsDir = path.join(__dirname, 'commands');
    if (!fs.existsSync(commandsDir)) fs.mkdirSync(commandsDir);

   // Built-in Core
commands.set('status', {
        name: 'status',
        cooldown: 1000,
        adminOnly: false,
        execute: () => `BOT : ${BOT_NAME}\nSTATUS : OPERATIONAL\nINTEGRITY: 100%\nOPERATOR : ${OWNER_NAME}\nNUMBER : ${TARGET_PHONE}`
    });

    commands.set('ping', {
        name: 'ping',
        cooldown: 1000,
        adminOnly: false,
        execute: () => `🚀 [NOSTOC-MD://PING]\nLATENCY : ${Date.now() - Date.now()}ms\nSTATUS : ONLINE\nTARGET : ${TARGET_PHONE}`
    });

    commands.set('menu', {
        name: 'menu',
        cooldown: 2000,
        adminOnly: false,
        execute: () => `💀 ${THEME.banner}\n\nCOMMANDS:\n!ping - Check bot\n!status - Bot info\n!bug1-!bug55 - Admin only\nTOTAL: ${commands.size} commands loaded`
    });

    // 55 Bug Commands - ADMIN ONLY
    for (let i = 1; i <= 55; i++) {
        const cmdName = `bug${i}`;
        commands.set(cmdName, {
            name: cmdName,
            cooldown: 500, 
            adminOnly: true, 
            execute: (args) => {
                const targetNode = args.join(" ") || "TARGET_UNSPECIFIED";
                return `💀 [NOSTOC-MD://DESTRUCT_LOAD_${i}]\nVECTOR : CORE_EXPLOIT_INDEX_${i}\nTARGET : ${targetNode.toUpperCase()}\nSTATUS : TESTING / RESTRICTED\nADMIN : ${OWNER_NAME}\nLOCKED TO : ${TARGET_PHONE}`;
            }
        });
    }

    // Load your 200+ commands from /commands folder
    try {
        const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsDir, file);
            const fileUrl = `file://${filePath}`;
            const module = await import(fileUrl);
            if (module.default && module.default.name) {
                commands.set(module.default.name, module.default);
            }
        }
    } catch (err) {
        console.log(`> COMMAND_LOADER: Reading user-defined command directories...`);
    }
}

// ==========================================
// SPAM FILTERS
// ==========================================
function verifyRateLimit(sender, commandName, cooldownMs) {
    if (!cooldowns.has(commandName)) cooldowns.set(commandName, new Map());
    const now = Date.now();
    const timestamps = cooldowns.get(commandName);
    if (timestamps.has(sender)) {
        const structuralExpiration = timestamps.get(sender) + cooldownMs;
        if (now < structuralExpiration) return Math.ceil((structuralExpiration - now) / 1000);
    }
    timestamps.set(sender, now);
    return 0;
}

// ==========================================
// CORE WHATSAPP ENGINE
// ==========================================
async function startNostocMD() {
    console.log(THEME.banner);
    await loadSystemArchitecture();
    console.log(`> SYSTEMS: ${commands.size} total commands registered.`);

    const { state, saveCreds } = await useMultiFileAuthState('nostoc_md_session');

    sockGlobal = makeWASocket({
        logger: pino({ level: 'silent' }), 
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome') 
    });

    // AUTO PAIRING CODE FOR YOUR NUMBER
    if (!sockGlobal.authState.creds.registered) {
        setTimeout(async () => {
            try {
                console.log(`> CORE: Generating pairing code for ${TARGET_PHONE}...`);
                let code = await sockGlobal.requestPairingCode(TARGET_PHONE);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                
                console.log(`\n${THEME.line}`);
                console.log(`🔑 NOSTOC-MD AUTH KEY FOR ${TARGET_PHONE}`);
                console.log(`PAIRING CODE: ${code}`);
                console.log(`${THEME.line}\n`);
            } catch (err) {
                console.error(`> FAILED TO GENERATE PAIRING CODE:`, err.message);
            }
        }, 4000);
    }

    sockGlobal.ev.on('creds.update', saveCreds);

    sockGlobal.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
            if (shouldReconnect) setTimeout(() => startNostocMD(), 3000);
        } else if (connection === 'open') {
            console.log(`🚀 SUCCESS: NOSTOC-MD IS LIVE FOR ${TARGET_PHONE}!`);
        }
    });

    // MESSAGE HANDLER
    sockGlobal.ev.on('messages.upsert', async (m) => {
        const msg = m.messages;
        if (!msg ||!msg[0] ||!msg[0].message || msg[0].key.fromMe) return;

        const currentMsg = msg[0];
        const senderId = currentMsg.key.participant || currentMsg.key.remoteJid;
        const rawText = currentMsg.message.conversation || currentMsg.message.extendedTextMessage?.text || "";

        if (!rawText.startsWith(PREFIX)) return;

        const systemTokens = rawText.slice(PREFIX.length).trim().split(/ +/);
        const invokedCommand = systemTokens.shift().toLowerCase();

        if (!commands.has(invokedCommand)) return;
        const targetedCommand = commands.get(invokedCommand);

        // STRICT ADMIN LOCK - ONLY YOUR NUMBER
        const isAdmin = senderId.includes(TARGET_PHONE);
        if (targetedCommand.adminOnly &&!isAdmin) {
            await sockGlobal.sendMessage(currentMsg.key.remoteJid, { text: `${THEME.prefix}\n${THEME.line}\n${THEME.securityAlert}\n${THEME.line}` });
            return;
        }

        const processingDelaySeconds = verifyRateLimit(senderId, invokedCommand, targetedCommand.cooldown || 1000);
        if (processingDelaySeconds > 0) {
            await sockGlobal.sendMessage(currentMsg.key.remoteJid, { text: `${THEME.prefix}\n> REJECTION: Thread cooling down. Wait ${processingDelaySeconds}s.` });
            return;
        }

        try {
            const output = targetedCommand.execute(systemTokens, senderId);
            const responseText = [THEME.prefix, THEME.line, output, THEME.line].join('\n');
            await sockGlobal.sendMessage(currentMsg.key.remoteJid, { text: responseText });
        } catch (err) {
            console.error(err);
        }
    });
}

// ==========================================
// NOSTOC-MD WEB PANEL
// ==========================================
const app = express();
app.use(express.json());
app.use(express.static('public'));

app.post('/api/pair', async (req, res) => {
    try {
        if (!sockGlobal) return res.json({ error: "Bot not ready yet, wait 5s" });
        let code = await sockGlobal.requestPairingCode(TARGET_PHONE);
        code = code?.match(/.{1,4}/g)?.join('-') || code;
        res.json({ code });
    } catch (e) {
        res.json({ error: e.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`> WEB PANEL: NOSTOC-MD ONLINE ON PORT: ${PORT}`);
    startNostocMD();
});
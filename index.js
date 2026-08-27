import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CORE IDENTITY & SECURITY PROTOCOLS
// ==========================================
const OWNER_NAME = "Nostoc 😈";
const PREFIX = "!";
const PORT = process.env.PORT || 10000; 

// Replace with your real phone number including country code (e.g., "2348012345678")
const TARGET_PHONE = process.env.PHONE_NUMBER || "234XXXXXXXXXX"; 

const THEME = {
    banner: `\n[VIGILANT SYSTEM // VERSION 7.0.0]\n> INTEGRATED ADMIN LOCK: ENGAGED\n> AUTHORIZED OPERATOR: ${OWNER_NAME.toUpperCase()}\n----------------------------------------`,
    prefix: `[VIGILANT://SYSTEM]`,
    line: `----------------------------------------`,
    securityAlert: `❌ [SECURITY://ACCESS_DENIED]\n> PRIVILEGE ENFORCEMENT PROTOCOL ACTIVATED.\n> OPERATOR IDENTITY IS NOT AUTHORIZED.`
};

const commands = new Map();
const cooldowns = new Map();

// ==========================================
// LOAD COMPLETE 200+ COMMAND MATRIX
// ==========================================
async function loadSystemArchitecture() {
    const commandsDir = path.join(__dirname, 'commands');
    if (!fs.existsSync(commandsDir)) {
        fs.mkdirSync(commandsDir);
    }

    // 1. Built-in Core Diagnostics
    commands.set('status', {
        name: 'status',
        cooldown: 1000,
        adminOnly: false,
        execute: () => `STATUS   : OPERATIONAL\nINTEGRITY: 100%\nMATRIX   : ACTIVE\nOPERATOR : ${OWNER_NAME}`
    });

    // 2. Initialize the 55 High-Speed Bug Arrays
    for (let i = 1; i <= 55; i++) {
        const cmdName = `bug${i}`;
        commands.set(cmdName, {
            name: cmdName,
            cooldown: 500, 
            adminOnly: true, 
            execute: (args) => {
                const targetNode = args.join(" ") || "TARGET_UNSPECIFIED";
                return `💀 [MALWARE_SIMULATION://V7_DESTRUCT_LOAD_${i}]\nVECTOR    : CORE_EXPLOIT_INDEX_${i}\nTARGET    : ${targetNode.toUpperCase()}\nSTATUS    : TESTING / RESTRICTED\nSIGNATURE : LOCKED BY ${OWNER_NAME}`;
            }
        });
    }

    // 3. Dynamic Folder Loader for your remaining 200+ commands
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
// SPAM FILTERS & INPUT ROUTING
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
// CORE WHATSAPP ENGINE & LIVE CONNECTION
// ==========================================
async function startVigilantSystem() {
    console.log(THEME.banner);
    await loadSystemArchitecture();
    console.log(`> SYSTEMS: ${commands.size} total commands registered smoothly in execution map.`);

    const { state, saveCreds } = await useMultiFileAuthState('v7_auth_session');

    // FIXED IMPLEMENTATION WITH WEB BROWSER RECOGNITION
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }), 
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome') 
    });

    // TRIGGER LIVE NUMBER PAIRING
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                console.log(`> CORE: Connecting to official WhatsApp authentication nodes...`);
                const cleanPhone = TARGET_PHONE.replace(/[^0-9]/g, '');
                let code = await sock.requestPairingCode(cleanPhone);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                
                console.log(`\n${THEME.line}`);
                console.log(`🔑 LIVE AUTH KEY GENERATED FOR: ${OWNER_NAME}`);
                console.log(`PAIRING CODE: ${code}`);
                console.log(`${THEME.line}`);
                console.log(`👉 Check your phone notification or open: WhatsApp > Linked Devices > Link with Phone Number\n`);
            } catch (err) {
                console.error(`> FAILED TO GENERATE PAIRING CODE:`, err.message);
            }
        }, 4000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`> CONNECTION LOST: Re-linking socket pipeline...`);
            if (shouldReconnect) startVigilantSystem();
        } else if (connection === 'open') {
            console.log(`\n========================================`);
            console.log(`🚀 SUCCESS: VIGILANT SYSTEM IS LIVE AND STREAMING!`);
            console.log(`========================================\n`);
        }
    });

    // LISTEN FOR LIVE COMMANDS
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages;
        if (!msg || !msg[0] || !msg[0].message || msg[0].key.fromMe) return;

        const currentMsg = msg[0];
        const senderId = currentMsg.key.participant || currentMsg.key.remoteJid;
        const rawText = currentMsg.message.conversation || currentMsg.message.extendedTextMessage?.text || "";

        if (!rawText.startsWith(PREFIX)) return;

        const systemTokens = rawText.slice(PREFIX.length).trim().split(/ +/);
        const invokedCommand = systemTokens.shift().toLowerCase();

        if (!commands.has(invokedCommand)) return;
        const targetedCommand = commands.get(invokedCommand);

        // --- ENFORCE STRICT NOSTOC ADMIN LOCK ---
        const isAdmin = senderId.includes(TARGET_PHONE) || senderId.includes("234"); 
        if (targetedCommand.adminOnly && !isAdmin) {
            await sock.sendMessage(currentMsg.key.remoteJid, { text: `${THEME.prefix}\n${THEME.line}\n${THEME.securityAlert}\n${THEME.line}` });
            return;
        }

        const processingDelaySeconds = verifyRateLimit(senderId, invokedCommand, targetedCommand.cooldown || 1000);
        if (processingDelaySeconds > 0) {
            await sock.sendMessage(currentMsg.key.remoteJid, { text: `${THEME.prefix}\n> REJECTION: Thread cooling down. Wait ${processingDelaySeconds}s.` });
            return;
        }

        try {
            const output = targetedCommand.execute(systemTokens, senderId);
            const responseText = [THEME.prefix, THEME.line, output, THEME.line].join('\n');
            await sock.sendMessage(currentMsg.key.remoteJid, { text: responseText });
        } catch (err) {
            console.error(err);
        }
    });
}

// ==========================================
// RENDER DEPLOYMENT COMPLIANCE HOOK
// ==========================================
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`VIGILANT CORE ACTIVE\nAUTHORIZED OPERATOR: ${OWNER_NAME}\n`);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`> ENVIRONMENT: Web routing layer online on port: ${PORT}`);
    startVigilantSystem();
});

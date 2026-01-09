// All-in-one LukTech MD bot
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");
const path = require("path");

// CONFIG
const config = {
  botName: "LukTech MD",
  owner: "256XXXXXXXX@s.whatsapp.net",
  prefix: ".",
  autoTyping: true,
  autoRecording: true
};

// DATABASE
const dbPath = "./database/db.json";
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ users: [], groups: [] }));
const db = JSON.parse(fs.readFileSync(dbPath));
function saveDB(){ fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)); }
function addUser(jid){ if(!db.users.includes(jid)){ db.users.push(jid); saveDB(); } }
function addGroup(jid){ if(!db.groups.includes(jid)){ db.groups.push(jid); saveDB(); } }

// UTILS
const sleep = (ms) => new Promise(resolve=>setTimeout(resolve, ms));
function isAdmin(msg){ return msg.key.participant===config.owner || msg.key.remoteJid===config.owner; }
const spam={}; function antiSpam(jid){ spam[jid]=(spam[jid]||0)+1; setTimeout(()=>spam[jid]--,5000); return spam[jid]>5; }

// COMMAND HANDLER
async function handleCommands(sock,msg,text){
  const jid=msg.key.remoteJid;

  if(text===config.prefix+"ping") return sock.sendMessage(jid,{text:"pong 🏓"});
  if(text===config.prefix+"about") return sock.sendMessage(jid,{text:"LukTech MD — Advanced WhatsApp Bot"});
  if(text===config.prefix+"alive") return alive(sock,msg);

  await mediaCommands(sock,msg,text);
  await menuCommands(sock,msg,text);
  await groupCommands(sock,msg,text);
  await statusCommands(sock,msg,text);
  await broadcastCommands(sock,msg,text);
}

// ALIVE
async function alive(sock,msg){
  const uptime=process.uptime();
  const h=Math.floor(uptime/3600);
  const m=Math.floor((uptime%3600)/60);
  const text=`
✅ *${config.botName} IS ALIVE*

🤖 Bot: ${config.botName}
⏱ Uptime: ${h}h ${m}m
🌍 Status: Online

🇺🇬 This is Luktech MD from the Pearl of Africa
❤️ Made with love by LUKTECH Hub
`;
  await sock.sendMessage(msg.key.remoteJid,{text});
}

// MEDIA COMMANDS
async function mediaCommands(sock,msg,text){
  const jid=msg.key.remoteJid;
  if(text===config.prefix+"sticker" && msg.message.imageMessage){ const buf=await sock.downloadMediaMessage(msg); await sock.sendMessage(jid,{sticker:buf}); }
  if(text===config.prefix+"audio" && msg.message.audioMessage){ const buf=await sock.downloadMediaMessage(msg); await sock.sendMessage(jid,{audio:buf,mimetype:"audio/mp4"}); }
  if(text===config.prefix+"video" && msg.message.videoMessage){ const buf=await sock.downloadMediaMessage(msg); await sock.sendMessage(jid,{video:buf,mimetype:"video/mp4"}); }
  if(text===config.prefix+"image" && msg.message.imageMessage){ const buf=await sock.downloadMediaMessage(msg); await sock.sendMessage(jid,{image:buf}); }
}

// BUTTONS & LIST
async function menuCommands(sock,msg,text){
  const jid=msg.key.remoteJid;
  if(text===config.prefix+"menu"){
    const buttons=[{buttonId:".alive",buttonText:{displayText:"Alive"},type:1},{buttonId:".ping",buttonText:{displayText:"Ping"},type:1},{buttonId:".about",buttonText:{displayText:"About"},type:1}];
    await sock.sendMessage(jid,{text:`🔥 ${config.botName} Menu 🔥\nSelect an option:`,buttons,headerType:1});
  }
  if(text===config.prefix+"list"){
    const sections=[
      {title:"Media Commands",rows:[{title:".sticker",rowId:".sticker"},{title:".audio",rowId:".audio"},{title:".video",rowId:".video"},{title:".image",rowId:".image"}]},
      {title:"Group Commands",rows:[{title:".groupinfo",rowId:".groupinfo"},{title:".promote",rowId:".promote"},{title:".demote",rowId:".demote"}]},
      {title:"Broadcast Commands",rows:[{title:".bc <text>",rowId:".bc "},{title:".bcgroup <text>",rowId:".bcgroup "}]}
    ];
    await sock.sendMessage(jid,{text:`📋 ${config.botName} Command List`,footer:"Made with ❤️ by LUKTECH Hub",title:config.botName,buttonText:"Select Command",sections});
  }
}

// GROUP COMMANDS
async function groupCommands(sock,msg,text){
  const jid=msg.key.remoteJid;
  if(!jid.endsWith("@g.us")) return;
  if(text===config.prefix+"groupinfo"){ const meta=await sock.groupMetadata(jid); await sock.sendMessage(jid,{text:`Group: ${meta.subject}\nMembers: ${meta.participants.length}`}); }
  if(text.startsWith(config.prefix+"promote") && isAdmin(msg)){ const user=msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(user) await sock.groupParticipantsUpdate(jid,[user],"promote"); }
  if(text.startsWith(config.prefix+"demote") && isAdmin(msg)){ const user=msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(user) await sock.groupParticipantsUpdate(jid,[user],"demote"); }
}

// STATUS
async function statusCommands(sock,msg,text){ if(text===config.prefix+"status") await sock.sendMessage("status@broadcast",{text:`${config.botName} is online 🚀`}); }

// BROADCAST
async function broadcastCommands(sock,msg,text){
  if(!isAdmin(msg)) return;
  const jid=msg.key.remoteJid;
  if(text.startsWith(config.prefix+"bc ")){ const message=text.slice(4); for(const u of db.users){ await sock.sendMessage(u,{text:message}); await sleep(1500); } await sock.sendMessage(jid,{text:"✅ Broadcast sent to users"}); }
  if(text.startsWith(config.prefix+"bcgroup ")){ const message=text.slice(9); for(const g of db.groups){ await sock.sendMessage(g,{text:message}); await sleep(2000); } await sock.sendMessage(jid,{text:"✅ Broadcast sent to groups"}); }
}

// START BOT
async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState("session");
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, logger:P({level:"silent"}), auth:state, browser:["LukTech MD","Chrome","1.0"] });
  sock.ev.on("creds.update",saveCreds);
  sock.ev.on("messages.upsert",async({messages})=>{
    const msg=messages[0]; if(!msg.message||msg.key.fromMe) return;
    const text=msg.message.conversation||msg.message.extendedTextMessage?.text||"";
    const jid=msg.key.remoteJid;
    jid.endsWith("@g.us")?addGroup(jid):addUser(jid);
    if(antiSpam(jid)) return;
    if(config.autoTyping) await sock.sendPresenceUpdate("composing",jid);
    if(config.autoRecording) await sock.sendPresenceUpdate("recording",jid);
    await handleCommands(sock,msg,text);
  });
  console.log("✅ LukTech MD Bot is online");
  return sock;
}

// PAIRING
(async()=>{
  const sock=await startBot();
  if(!sock.authState.creds.registered){
    const code=await sock.requestPairingCode(config.owner);
    console.log("PAIRING CODE:",code);
  }
})();

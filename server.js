// server.js
const express = require('express');
const app = express();
const port = 3000; // Port, auf dem der Server läuft
const cors = require("cors")

const fs = require("fs")
const path = require("path")

require("dotenv").config()
const TelegramBot = require("node-telegram-bot-api")

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN
const CHAT_ID = process.env.CHAT_ID

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true })

// Planung
const cron = require("node-cron")

// data.json PFAD
const filePath = path.join(__dirname, "data.json")

app.use(cors())
app.use(express.json())

// Ein einfacher GET-Endpunkt
app.get('/', (req, res) => {
  res.send('Hallo Welt!');
});

app.post("/getMessage", async (req, res) => {
  console.log(req.body[0].message)
  const msg = req.body[0].message

  if (!CHAT_ID || !msg) return res.status(400).json({ error: "Fehlende Parameter" });

  try {
    await bot.sendMessage(CHAT_ID, msg)
    res.json({ success: true, message: "Nachricht gesendet" })
  }


  catch (error) {
    res.status(500).json({ error: error })
  }


})

// Bot interaktionen 
bot.on("message", (msg) => {
  console.log("NACHRICHT: ", msg.text)

  if (msg.text.toLowerCase() === "/help") {
    bot.sendMessage(CHAT_ID,
      `Hier ist eine Übersicht mit allen Befehlen:
      - /wann Datum der letzten Düngung
      - /alle Alle Termine
      - /heute Heutigen Tag eintragen lassen
      `

    )
  }


  // Letze Düngung erfahren
  else if (msg.text.toLowerCase() === "/wann") {
    bot.sendMessage(CHAT_ID, "Die letzte Düngung war Sanstag 22.Februar ")
  }

  // Alle Düngungen erfahren
  else if (msg.text.toLowerCase() === "/alle") {
    bot.sendMessage(CHAT_ID, "Ein Überblick über alle Düngungen: xx xx xx")
  }

  else if(msg.text.toLowerCase() === "/heute") {
    // DATUM in LESBARER FORMAT UNGEWANDELT
    const today = new Date().toISOString().split('T')[0].split('-').reverse().join('.');
    
    console.log("DATUM: ", today)

    bot.sendMessage(CHAT_ID, "Gespeichert")
   
  }

  else {
    bot.sendMessage(CHAT_ID,
      `Hier ist der Zitrusbot. \nLasse dir mit /help alle verfügbaren Befehle anzeigen`)
  }


})

// Nachricht planen für 25.2 15:35
cron.schedule('34 15 25 2 *', () => {
  bot.sendMessage(CHAT_ID, "Hallo es ist 15:34")
  console.log("Nachricht gesendet um 15:34")
})



// Server starten
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
// server.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Port, auf dem der Server läuft
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

// Datum speicher

const saveDate = (date) => {

  console.log(date)

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      bot.sendMessage(CHAT_ID, `Ein Fehler ist aufgetreten: ${err}`)
    }

    else {

      let jsonData = []
      if (data) {
        jsonData = JSON.parse(data)
      }

      jsonData.push(date)

      fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
          bot.sendMessage(CHAT_ID, `Ein Fehler ist aufgetreten: ${err}`)
        }

        else {
          bot.sendMessage(CHAT_ID, `Aktualsiert`)
        }

      })

    }
  })


}

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
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        bot.sendMessage(CHAT_ID, `Fehler aufgetreten: ${err}`)
      }

      else {
        console.log(data)
        const allData = JSON.parse(data)
        const lastDate = allData[allData.length - 1]
        bot.sendMessage(CHAT_ID, `Deine Pflanzen wurden zuletzt am ${lastDate} gedüngt`)
      }
    })

  }

  // Alle Düngungen erfahren
  else if (msg.text.toLowerCase() === "/alle") {

    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        bot.sendMessage(CHAT_ID, `Fehler aufgetreten: ${err}`)
      }

      else {
        bot.sendMessage(CHAT_ID, ` Behalte den Überblick und sorge für gesunde Pflanzen\n\n ${data.replace(/"/g, '').slice(3, -2)}`)
      }
    })


  }

  else if (msg.text.toLowerCase() === "/heute") {
    // DATUM in LESBARER FORMAT UNGEWANDELT
    const today = new Date().toISOString().split('T')[0].split('-').reverse().join('.');

    console.log("DATUM: ", today)
    saveDate(today)
    bot.sendMessage(CHAT_ID, "Super! Deine Pflanzen wurden heute gedüngt. Sie sind jetzt bestens versorgt!")

  }

  else {
    bot.sendMessage(CHAT_ID,
      `Hier ist der Zitrusbot. \nLasse dir mit /help alle verfügbaren Befehle anzeigen`)
  }


})

// Nachricht planen für 25.2 15:35
cron.schedule('30 10 * * 6', () => {
  bot.sendMessage(CHAT_ID, "Es ist Zeit mich zu düngen")

}, {
  timezone: "Europe/Berlin"
})



// Server starten
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
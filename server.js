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

// DATABASE KONFIGURIEREN
const {Pool} = require("pg");


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

pool.connect()
  .then( ()=> console.log("POSTGRES SQL CONNECTED") )
  .catch(err => console.error("FEHLER: ", err))


module.exports = pool


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

app.get("/remindme",  (req,res) => {
  try {
    bot.sendMessage(CHAT_ID, "Es ist wieder Zeit, uns zu düngen")
    
  }

  catch (err) {
    bot.sendMessage(CHAT_ID, "Fehler beim Erinnern")
    
  }
  res.status(200).send("Läuft")
  
})


// Funktionen

// Alle Termine abrufen
const alle = async ( ) => {
  try {
    const result = await pool.query('SELECT * FROM alle')
    console.log("RESULT: ", result.rows)
    
    const alleTermine = result.rows.map(row => row.date.toISOString().slice(0,10))
    console.log("ALLE TERMINE: ", alleTermine)


    // Antwort vom Bot
    bot.sendMessage(CHAT_ID, `Behalte den Überblick und sorge für gesunde Pflanzen\n\n${JSON.stringify(alleTermine).replace(/"/g, '').replace(/-/g, '.').replace(/,/g, '\n').slice(1,-1)}`)
  }

  catch (err) {
    console.log("Fehler aufgetreten: ", err)
    bot.sendMessage(CHAT_ID, `Ein Fehler ist aufgetreten: ${err}`)
  }
}

// Letzten Termin abrufen
const wann = async ( ) => {
  try {
    const result = await pool.query('SELECT * FROM alle')
    console.log("RESULT: ", result.rows)

    const alleTermine = result.rows.map(row => row.date.toISOString().slice(0,10))
    const letzterTermin = alleTermine[alleTermine.length - 1]
   
    bot.sendMessage(CHAT_ID, `Deine Pflanzen wurden zuletzt am ${letzterTermin} gedüngt`)
  }

  catch (err) {
    console.log("Fehler aufgetreten: ", err)
    bot.sendMessage(CHAT_ID, `Ein Fehler ist aufgetreten: ${err}`)
  }
}

// Neuen Eintrag erstekkeb
const heute = async ( ) => {
  try {
    const result = await pool.query('INSERT INTO alle DEFAULT VALUES RETURNING *')
    console.log(result.rows[0])

    // prüfen ob erfolgreich war
    if(result.rows.length > 0) {
      bot.sendMessage(CHAT_ID, "Aktualisierung erfolgreich. Mit /alle kannst du alle vergangenen Termine einsehen")
    }

    else {
      bot.sendMessage(CHAT_ID, "Ein Fehler ist aufgetreten")
    }


  }

  catch (err) {
    console.log("Fehler aufgetreten: ", err)
    bot.sendMessage(CHAT_ID, `Ein Fehler ist aufgetreten: ${err}`)
  }
}


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
    
    console.log("WANN")
    wann()

  }

  // Alle Düngungen erfahren
  else if (msg.text.toLowerCase() === "/alle") {

    console.log("ALLE")
    alle()


  }

  // Eintrag machen
  else if (msg.text.toLowerCase() === "/heute") {
   
    console.log("heute")
    heute()



  }

})



// Nachricht planen für jeden SAMSTAG 10 UHR 30
cron.schedule('30 10 * * 6', () => {
  bot.sendMessage(CHAT_ID, "Es ist Zeit mich zu düngen")

}, {
  timezone: "Europe/Berlin"
})



// Server starten
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
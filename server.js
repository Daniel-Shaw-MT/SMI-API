require('dotenv').config()

const express = require('express')

const app = express()
const mongoose = require('mongoose')

var helmet = require('helmet')
const port = 8000

app.use(helmet.hidePoweredBy())


mongoose.connect(process.env.DB_URL, { useUnifiedTopology: true, useNewUrlParser: true })
const db = mongoose.connection
db.on('error', (error) => console.log(error))
db.once('open', () => console.log('Connected to DB'))

// Middlewares
app.use(express.json())

// Router
const Router = require('./routes/router')
app.use('/main', Router)

app.listen(port, () => {
  console.log(`SMI API STARTED AT http://localhost:${port}`)
})
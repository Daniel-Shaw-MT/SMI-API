require('dotenv').config()

const express = require('express')

const app = express()
const mongoose = require('mongoose')

var helmet = require('helmet')
const port = 8000

app.use(helmet.hidePoweredBy())


mongoose.connect(process.env.DATABASE_URL, { useUnifiedTopology: true, useNewUrlParser: true })
const db = mongoose.connection
db.on('error', (error) => console.log(error))
db.once('open', () => console.log('Connected to DB'))

// Middlewares
app.use(express.json())

// Router
const flightRouter = require('./routes/flights')
app.use('/flights', flightRouter)


// Example route
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
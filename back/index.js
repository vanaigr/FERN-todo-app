const express = require('express')
const cors = require('cors')
const app = express()

const path = require('path')
const websitePath = path.join(__dirname, '../front/build')

app.use(cors({ origin: 'http://localhost:3000' }))
app.use('/api', require('./api.js'))
app.use(express.static(websitePath))
app.use('/', (q, s) => {
    s.sendFile(path.join(websitePath, 'index.html'))
})

app.listen(2999, () => {
    console.log('Started')
})

'use strict'

const express = require('express')
const config = require('./config')
const login = require('./libs/login')

const app = express()

app.get('/login', (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:4200')
  res.set('Access-Control-Allow-Credentials', 'true')
  login(req, res)
})

app.listen(config.port, () => {
  console.log(`Listening on port ${config.port}`)
})
const express = require('express')
const app = express()
const server = require('http').Server(app)
let io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const redis = require('redis')
const path = require('path');
const AvatarGenerator = require('avatar-generator')

const redisClient = redis.createClient({
    url: 'redis://default:XyYryA9s4568ezaM3DlqXwcscBCQz@Axg@redis'
});

redisClient.on('error', (err) => {
    console.log(`Error ${err}`)
})
redisClient.connect();

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
    let roomId = req.params.room;
    res.render('room', { roomId: roomId })
})

const IoController = require("./IoControllers.js")
io.on('connection', (socket) => IoController(socket, redisClient, io));

server.listen(3000)
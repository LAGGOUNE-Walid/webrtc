const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const redis = require('redis')

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


io.on('connection', async (socket) => {

    var roomId = socket.handshake.headers.referer.split("/")[3];

    

    var numberOfSockets = await redisClient.SCARD('room:' + roomId + ':websockets');
    var sockets = await redisClient.SMEMBERS('room:' + roomId + ':websockets')


    sockets.forEach(socketId => {
        console.log("Dispatch user connected of socket " + socket.id);
        io.to(socketId).emit('room:' + roomId + ':websockets-user-connected', { connectionsCount: numberOfSockets + 1, newUserSocketId : socket.id });
    });

    await redisClient.SADD('room:' + roomId + ':websockets', socket.id)

    socket.on('room:' + roomId + ':websockets-call-user', async(data) => {
        console.log("dispatch call users to socket "+data.to);
        io.to(data.to).emit('room:' + roomId + ':websockets-incomming-call', {from : data.from, offer : data.offer});
    });

    socket.on('room:' + roomId + ':websockets-accepted-call', async(data) => {
        console.log("dispatch accepted call to socket "+data.to);
        io.to(data.to).emit('room:' + roomId + ':websockets-user-accepted-call', {from : data.from, answer : data.answer});
    });

    
    socket.on('disconnect', async () => {
        await redisClient.SREM('room:' + roomId + ':websockets', socket.id)
        var numberOfSockets = await redisClient.SCARD('room:' + roomId + ':websockets');
        var sockets = await redisClient.SMEMBERS('room:' + roomId + ':websockets')

        sockets.forEach(socketId => {
            io.to(socketId).emit('room:' + roomId + ':websockets-updated', { connectionsCount: numberOfSockets });
        });
    });
    /**
    socket.on('offer-created', async(data) => {
        console.log(socket.id+" created offer");
        sockets.forEach(socketId => {
            if (socketId !== socket.id) {
                io.to(socketId).emit('room:' + roomId + ':websockets-offer-created', { offer: data.offer });
            }
        });
    });

    socket.on('ice-created', async(data) => {
        console.log(data.offer);
    });

    socket.on('answer-created', async(data) => {
        console.log(socket.id+" answer created");
        sockets.forEach(socketId => {
            if (socketId !== data.socketId) {
                io.to(socketId).emit('room:' + roomId + ':websockets-answer-created', { offer: data.offer });
            }
        });
    });
    **/
});



server.listen(3000)
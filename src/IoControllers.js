module.exports = async (socket, redisClient, io) => {
    var roomId = socket.handshake.headers.referer.split("/")[3];

    
    var sockets = await redisClient.SMEMBERS('room:' + roomId + ':websockets')


    sockets.forEach(socketId => {
        console.log("Dispatch user connected of socket " + socket.id);
        io.to(socketId).emit('room:' + roomId + ':websockets-user-connected', {newUserSocketId : socket.id });
    });
    await redisClient.SADD('room:' + roomId + ':websockets', socket.id)
    
    socket.on('room:' + roomId + ':websockets-call-user', async (data) => {
        io.to(data.to).emit('room:' + roomId + ':websockets-incomming-call', { from: data.from, offer: data.offer });
    });

    socket.on('room:' + roomId + ':websockets-accepted-call', async (data) => {
        io.to(data.to).emit('room:' + roomId + ':websockets-user-accepted-call', { from: data.from, answer: data.answer });
    });


    socket.on('room:' + roomId + ':websockets-on-icecandidate', async (data) => {
        sockets.forEach(socketId => {
            if (socketId !== data.from) {
                io.to(socketId).emit('room:' + roomId + ':websockets-ice-candidate', { candidate: data.candidate });
            }
        });
    });

    socket.on('disconnect', async () => {
        await redisClient.SREM('room:' + roomId + ':websockets', socket.id)
    });
}
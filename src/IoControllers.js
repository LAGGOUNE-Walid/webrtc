
module.exports = async (socket, redisClient, io, avatar) => {
    var roomId = socket.handshake.headers.referer.split("/")[3];

    socket.on('room:' + roomId + ':websockets-request-avatar', async (data) => {

        const image = await avatar.generate(data.username + socket.id, 'male')
        await image.resize(60, 60).toFile('public/avatars/avatar-' + data.username + "-" + socket.id + '.png').then(async () => {

            await redisClient.SET('info-user-'+socket.id, JSON.stringify({username : data.username, avatar : '/avatars/avatar-' + data.username + "-" + socket.id + '.png'}));

            io.to(socket.id).emit('room:' + roomId + ':websockets-avatar-created', { path: '/avatars/avatar-' + data.username + "-" + socket.id + '.png' });

            var sockets = await redisClient.SMEMBERS('room:' + roomId + ':websockets')

            // send to other sockets that new user connected
            sockets.forEach(socketId => {
                io.to(socketId).emit('room:' + roomId + ':websockets-user-connected', { socketId: socket.id , username: data.username, avatar : '/avatars/avatar-' + data.username + "-" + socket.id + '.png'});
            });

            // send to the new socket already saved sockets
            sockets.forEach(async(socketId) => {
                var info = await redisClient.GET('info-user-'+socketId)
                var parsedInfo = JSON.parse(info);
                io.to(socket.id).emit('room:' + roomId + ':websockets-users-list', { socketId: socketId, username : parsedInfo.username, avatar : parsedInfo.avatar});
            });

            await redisClient.SADD('room:' + roomId + ':websockets', socket.id)
        })

    });

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


    // socket.on('get-chat-messages', async(data) => {
    //     var messages = await redisClient.GET('messages-'+data.root+'-'+data.peer);
    //     io.to(data.root).emit('room:' + roomId + ':websockets-user-accepted-call')
    // });

    socket.on('disconnect', async () => {
        await redisClient.SREM('room:' + roomId + ':websockets', socket.id)
        var sockets = await redisClient.SMEMBERS('room:' + roomId + ':websockets')
        sockets.forEach(socketId => {
            io.to(socketId).emit('room:' + roomId + ':websockets-user-disconnected', { socketId : socket.id });
        });
    });
}
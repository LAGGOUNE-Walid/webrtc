const socket = io('/')
const peer = new RTCPeerConnection({
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:global.stun.twilio.com:3478',
            ],
        }
    ]
});
let dc = peer.createDataChannel('messages-channel');
dc.onmessage = (function (e) {
    console.log('Message');
});
dc.onopen = (function (e) {
    console.log("Openned");
    dc.send('Hello world');
})
socket.on('room:' + ROOM_ID + ':websockets-user-connected', (data) => {
    console.log('new user is connected so we should call him');
    document.getElementById("online-room-users-count").innerHTML = data.connectionsCount;

    const createOffer = async () => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer)
        return offer;
    };

    const newUserSocketId = data.newUserSocketId;

    createOffer().then(function (data) {
        console.log("Calling user of socket " + newUserSocketId);
        socket.emit('room:' + ROOM_ID + ':websockets-call-user', { roomId: ROOM_ID, offer: data, from: socket.id, to: newUserSocketId });
    });

})

socket.on('room:' + ROOM_ID + ':websockets-incomming-call', async (data) => {
    console.log('incomming call from ' + data.from)
    await peer.setRemoteDescription(data.offer).then(async () => {
        peer.createAnswer().then(async (answer) => {
            await peer.setLocalDescription(answer).then(() => {
                socket.emit('room:' + ROOM_ID + ':websockets-accepted-call', { from: socket.id, to: data.from, answer: answer });
            });
        });
    });


});

socket.on('room:' + ROOM_ID + ':websockets-user-accepted-call', async (data) => {
    console.log('handle accepted call call from ' + data.from)
    await peer.setRemoteDescription(data.answer);
});


/**
socket.on('room:' + ROOM_ID + ':websockets-offer-created', async (data) => {
    await peer.setRemoteDescription(data.offer).then(() => {
        console.log('Done offer set remote');
    });
    await peer.createAnswer().then((offer) => {
        peer.setLocalDescription(offer);
        socket.emit('answer-created', { roomId: ROOM_ID, offer: offer, socketId: socket.id});
    });
})

socket.on('room:' + ROOM_ID + ':websockets-answer-created', async (data) => {
    await peer.setRemoteDescription(data.offer).then(() => {
        console.log('Done offer set remote after answer');
    });
});
**/

// const videoGrid = document.getElementById('video-grid')
// const myPeer = new Peer(undefined, {
//   host: '/',
//   port: '3000'
// })
// const myVideo = document.createElement('video')
// myVideo.muted = true
// const peers = {}
// navigator.mediaDevices.getUserMedia({
//   video: true,
//   audio: true
// }).then(stream => {
//   addVideoStream(myVideo, stream)

//   myPeer.on('call', call => {
//     call.answer(stream)
//     const video = document.createElement('video')
//     call.on('stream', userVideoStream => {
//       addVideoStream(video, userVideoStream)
//     })
//   })

//   socket.on('user-connected', userId => {
//     connectToNewUser(userId, stream)
//   })
// })

// socket.on('user-disconnected', userId => {
//   if (peers[userId]) peers[userId].close()
// })

// myPeer.on('open', id => {
//   socket.emit('join-room', ROOM_ID, id)
// })

// function connectToNewUser(userId, stream) {
//   const call = myPeer.call(userId, stream)
//   const video = document.createElement('video')
//   call.on('stream', userVideoStream => {
//     addVideoStream(video, userVideoStream)
//   })
//   call.on('close', () => {
//     video.remove()
//   })

//   peers[userId] = call
// }

// function addVideoStream(video, stream) {
//   video.srcObject = stream
//   video.addEventListener('loadedmetadata', () => {
//     video.play()
//   })
//   videoGrid.append(video)
// }
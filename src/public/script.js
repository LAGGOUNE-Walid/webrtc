window.onload = function () {
    establishConnection("");
}

function establishConnection(username) {

    socket = io('/');
    let peer;

    let localStream;
    let remoteStream;

    socket.on('connect', function () {

        let createPeer = async () => {
            peerConnection = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: [
                            'stun:stun.l.google.com:19302',
                            'stun:global.stun.twilio.com:3478',
                        ],
                    }
                ]
            });
            peerConnection.onicecandidate = async (event) => {
                if (event.candidate) {
                    socket.emit('room:' + ROOM_ID + ':websockets-on-icecandidate', { roomId: ROOM_ID, candidate: event.candidate, from: socket.id });
                }
            };
            remoteStream = new MediaStream;
            document.getElementById('user-2').srcObject = remoteStream
            document.getElementById('user-2').style.display = 'block';
            if (!localStream) {
                localStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { min: 640, ideal: 1920, max: 1920 },
                        height: { min: 480, ideal: 1080, max: 1080 }
                    }, audio: true
                });
            }
            document.getElementById('user-1').srcObject = localStream;
            document.getElementById('user-1').classList.add('smallFrame');
            localStream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStream)
            });

            peerConnection.ontrack = (event) => {
                event.streams[0].getTracks().forEach((track) => {
                    remoteStream.addTrack(track);
                })
            }
            return peerConnection;
        };

        let createOffer = async (peer) => {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer)

            return offer;
        };

        let createPeerConnectionWithNewUserConnected = async (data) => {
            console.log('new user is connected so we should call him');

            peer = await createPeer();

            let dc = peer.createDataChannel('messages-channel');
            dc.onmessage = (function (e) {
                console.log('Message');
            });
            dc.onopen = (function (e) {
                console.log("Openned");
                dc.send('Hello world');
            })

            const newUserSocketId = data.newUserSocketId;

            createOffer(peer).then(function (data) {
                console.log("Calling user of socket " + newUserSocketId);
                socket.emit('room:' + ROOM_ID + ':websockets-call-user', { roomId: ROOM_ID, offer: data, from: socket.id, to: newUserSocketId });
            });

        };

        let handleIncommingCallFromPeer = async (data) => {
            console.log('incomming call from ' + data.from)

            peer = await createPeer();

            peer.ondatachannel = function () {
                console.log('data channel');
            };


            await peer.setRemoteDescription(data.offer).then(async () => {
                peer.createAnswer().then(async (answer) => {
                    await peer.setLocalDescription(answer).then(() => {
                        socket.emit('room:' + ROOM_ID + ':websockets-accepted-call', { from: socket.id, to: data.from, answer: answer });
                    });
                });
            });
        };

        let accepteRemoteUserCall = async (data) => {
            console.log('handle accepted call call from ' + data.from)
            await peer.setRemoteDescription(data.answer);
        };

        let setIceCandidate = async (data) => {
            console.log('setting candindates')
            await peer.addIceCandidate(data.candidate);
        };

        let init = async () => {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            document.getElementById('user-1').srcObject = localStream;
        }

        init();

        socket.on('room:' + ROOM_ID + ':websockets-incomming-call', handleIncommingCallFromPeer);
        socket.on('room:' + ROOM_ID + ':websockets-user-accepted-call', accepteRemoteUserCall);
        socket.on('room:' + ROOM_ID + ':websockets-ice-candidate', setIceCandidate);
        socket.on('room:' + ROOM_ID + ':websockets-user-connected', createPeerConnectionWithNewUserConnected);

        let leaveChannel = async () => {
            await channel.leave()
            await client.logout()
        }

        let toggleCamera = async () => {
            let videoTrack = localStream.getTracks().find(track => track.kind === 'video')

            if (videoTrack.enabled) {
                videoTrack.enabled = false
                document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'
            } else {
                videoTrack.enabled = true
                document.getElementById('camera-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
            }
        }

        let toggleMic = async () => {
            let audioTrack = localStream.getTracks().find(track => track.kind === 'audio')
            if (audioTrack) {
                if (audioTrack.enabled) {
                    audioTrack.enabled = false
                    document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'
                } else {
                    audioTrack.enabled = true
                    document.getElementById('mic-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
                }
            }
            
        }


        document.getElementById('camera-btn').addEventListener('click', toggleCamera)
        document.getElementById('mic-btn').addEventListener('click', toggleMic)
    });
}



let username = null;

if (username === null) {
    var joinButton = document.getElementById('joinButton');
    var usernameInput = document.getElementById('username-input');
    joinButton.addEventListener('click', function () {
        if (usernameInput.value !== "") {
            username = usernameInput.value;
            document.getElementById('form').style.display = "none";



            establishConnection(username);

        }
    });
}

let socket = null;

function establishConnection(username) {

    socket = io('/');
    let peer;

    let localStream;
    let remoteStream;

    socket.on('connect', function () {

        socket.emit('room:' + ROOM_ID + ':websockets-request-avatar', { username: username });

        /**
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
            if (!localStream) {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                document.getElementById('user-1').srcObject = localStream;
            }
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
        **/


        let setAvatar = async (data) => {
            document.getElementById('chat').style.display = "block";
        }

        let handleNewUserConnected = async (data) => {
            addUserToChatList(data);
        };

        let handleUsersList = async (data) => {
            addUserToChatList(data);
        }

        

        let addUserToChatList = (data) => {
            document.getElementById('online-users').innerHTML += `
                <li class="p-2 border-bottom" id="${data.socketId}">
                    <a href="#!" id="start-chat-with-${data.socketId}" onclick="startChatWith(event, '${data.socketId}')" class="d-flex justify-content-between">
                        <div class="d-flex flex-row">
                            <div>
                            <img src="${data.avatar}" alt="avatar" class="d-flex align-self-center me-3 rounded-circle" width="60">
                            <span class="badge bg-success badge-dot"></span>
                            </div>
                            <div class="pt-1">
                            <p class="fw-bold mb-0">${data.username}</p>
                            </div>
                        </div>
                    </a>
                </li>
            `;
        }

        let handleUserDisconnected = (data) => {
            document.getElementById(data.socketId).remove();
        };

        socket.on('room:' + ROOM_ID + ':websockets-avatar-created', setAvatar)
        socket.on('room:' + ROOM_ID + ':websockets-user-connected', handleNewUserConnected)
        socket.on('room:' + ROOM_ID + ':websockets-users-list', handleUsersList)
        socket.on('room:' + ROOM_ID + ':websockets-user-disconnected', handleUserDisconnected)
    });

    function startChatWith(event, socketId) {
        event.preventDefault();
    }

}



function startChatWith(e, socketId) {
    socket.emit('get-chat-messages', {root: socket.id, peer:socketId});
}
let session_data

// How many connections are there
let connections = 0;
// Keeps track of whether or not someone is streaming
let sharing = false
// Syncronizes peer-peer connections
let creatingConnection = false;
let sockets = []
let receivers = []
let initiator = null
let counter = 0

// Ensure that peers are created one at a time to avoid any mixups
async function awaitPeerConnection (receivers, io) {
    if(counter < receivers.length) {
        console.log("Creating a peer-peer connection with", receivers[counter])
        io.to(initiator).emit('share:startConnection', receivers[counter])
    }
    else {
        console.log("No more connections to create")
    }
}

function setupShareScreen(io, socket, data) {
    session_data = data
    // -------------------------- SHARE SCREEN STUFF ------------------------------
    // Tracking connections
    socket.on('share:connect', (id) => {
        if(sockets.indexOf(id) === -1) {
            connections++
            console.log("Socket " + id + " connected.  Total connections: ", connections)
            sockets.push(id)
            console.log(sockets)    
            // Create peer connection if clients join mid-stream
            if(sharing) {
                // Case 1: All existing connections are fully established or no peers currently exist
                if(counter === receivers.length || counter === 0) {
                    receivers.push(id)
                    awaitPeerConnection(receivers, io)
                }
                // Case 2: In the middle of creating connections
                else {
                    receivers.push(id)
                }
            }
        }
    })
    // Observe request to initiateSharing
    socket.on('share:initiateSharing', (id) => {
        sharing = true
        initiator = id
        if(sockets.length > 1) {
            // Create the list of sockets to share to
            receivers = sockets.filter((sock) => sock != initiator)
            console.log(initiator, receivers)
            // Create a peer connection for the first receiver if one exists
            awaitPeerConnection(receivers, io)
        }
    })
    // Receives offer data from the initiator, sends it to the receiver
    socket.on('share:offer', (data, receiver) => {
        io.to(receiver).emit('share:offer', data)
        if(!sharing) {sharing = true}
    })
    // Receives answer data from the receiver, sends it to the initiator
    socket.on('share:answer', (data) => {
        io.to(initiator).emit('share:answer', data)
    })
    // Handle cleanup after a client stops streaming
    socket.on('share:shareEnded', () => {
        io.to('lobby1').emit('share:shareEnded')
        receivers = []
        initiator = null
        counter = 0
        sharing = false
    })
    socket.on('share:nextConnection', () => {
        counter++;
        awaitPeerConnection(receivers, io)
    })   
}

module.exports = {
    setupShareScreen
}
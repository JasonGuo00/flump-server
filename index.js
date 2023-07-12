const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
fs = require('fs');

// Import Lobby class
const Lobby = require('./yt_lobby.js')
// Make a Lobby instance called 'lobby'
const lobby = new Lobby('test')
// To handle registering new player states
let prevState = -5
let prevRuntime = 0

app.get('/login', (req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' })
    fs.createReadStream('googlelogin.html').pipe(res)
})

let lobbies = [];

function createNewLobby(name, privacy, description, password) {
    let id = createLobbyID()

    while (searchLobbyId(id) != null) {
        id = searchLobbyId(id)
    }

    let lobby = new Lobby(id, name, privacy, description, password);

    lobbies.push(lobby);

    console.log(id);

    return lobby;
}

function createLobbyID() {
    const id_chars = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890"

    let id = ""

    for (let i = 0; i < 6; i++) {
        id += id_chars[(Math.floor(Math.random() * id_chars.length))]
    }

    return id
}

function searchLobbyId(id) {
    for (let i = 0; i < lobbies.length; i++) {
        if (lobbies[i].id.localeCompare(id) === 0) {
            return lobbies[i]
        }
    }

    return null
}

io.on('connection', (socket) => {
    let lobby = null;
    let lobby_logged_in = false;

    console.log('A client connected')
    socket.join('lobby1')
    // Testing
    socket.on('buttonClick', () => {
        socket.emit('serverResponse', 'Bing Chilling')
    })

    // Client will send 'lobbyJoin' when connecting to server to retrieve any persisting information necessary
    socket.on('lobbyJoin', () => {
        if (lobby === null || lobby_logged_in === false) {
            socket.emit('noLobby')
            return
        }
        lobby.addConnection(socket)

        socket.emit('playVideo', lobby.playlist[0])
        socket.emit('updatePlaylist', lobby.playlist)
        if(prevState !== -5) {
            // console.log("Sending old runtime information: previous state = " + prevState + " prev time = " + prevRuntime)
            socket.emit('receiveInfo', prevState, prevRuntime)
        }
    })

    // The following requests require the user to be logged into the lobby

    // Client will send 'addVideo' when the user inputs a youtube video link and requests to add it to the list
    socket.on('addVideo', (video_id) => {
        if (lobby === null || lobby_logged_in === false) {
            socket.emit('noLobby')
            return
        }
        console.log('Received video ID:', video_id)
        let length = lobby.addVideo(video_id)
        console.log("-----Videos Queued-----")
        lobby.playlist.forEach(element => console.log(element))
        console.log(length)
        // If the list is empty, we need to make sure the client knows to render the new video added
        if(length == 1) {
            // if length == 1, then that means before the video added, the list was empty
            // socket.emit('playVideo', lobby.playlist[0])
            io.to('lobby1').emit('playVideo', lobby.playlist[0])
        }
        // socket.emit('updatePlaylist', lobby.playlist);
        io.to('lobby1').emit('updatePlaylist', lobby.playlist)
    })
    // Client will send 'goNext' when either the video ends, or user requests to skip
    socket.on('goNext', () => {
        if (lobby === null || lobby_logged_in === false) {
            socket.emit('noLobby')
            return
        }

        console.log("Received request to play next video")
        lobby.removeVideo()
        // socket.emit('playVideo', lobby.playlist[0])
        // socket.emit('updatePlaylist', lobby.playlist)
        io.to('lobby1').emit('playVideo', lobby.playlist[0])
        io.to('lobby1').emit('updatePlaylist', lobby.playlist)
    })
    // Client will send 'toggleLoop' when they click the 'Loop' button
    socket.on('toggleLoop', () => {
        if (lobby === null || lobby_logged_in === false) {
            socket.emit('noLobby')
            return
        }
        lobby.toggleLoop()
        console.log("Loop Toggled: ", lobby.loop)
    })
    socket.on('playbackChange', (playbackState, playbackTime) => {
        console.log("Playback State Received: ", playbackState)
        if(prevState !== playbackState) {
            prevState = playbackState
            console.log("Change detected: sending new info...")
            // socket.emit('receiveInfo', playbackState, playbackTime)
            io.to('lobby1').emit('receiveInfo', playbackState, playbackTime)
        }
    })
    socket.on('updateTime', (playerTime) => {
        prevRuntime = playerTime
    })
    // Sent automatically when the client disconnects from the server
    socket.on('disconnect', () => {
        if (lobby === null || lobby_logged_in === false) {
            socket.emit('noLobby')
            return
        }
        lobby.removeConnection(socket)

        if (lobby.connectionLength() === 0) {
            lobbies.splice(lobbies.indexOf(lobby), 1)
        }

        console.log('A client disconnected')
    })
})

server.listen(35565, () => {
    console.log('Server listening on port 35565')
})
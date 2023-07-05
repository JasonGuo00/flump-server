const app = require('express')
const server = require('http').createServer(app)
const io = require('socket.io')(server)

// Import Lobby class
const Lobby = require('./yt_lobby.js')
// Make a Lobby instance called 'lobby'
const lobby = new Lobby('test')

io.on('connection', (socket) => {
    console.log('A client connected')
    // Testing
    socket.on('buttonClick', () => {
        socket.emit('serverResponse', 'Bing Chilling')
    })
    // Client will send 'reconnection' when connecting to server to retrieve any persisting information necessary
    socket.on('reconnection', () => {
        socket.emit('playVideo', lobby.playlist[0])
        socket.emit('updatePlaylist', lobby.playlist)
    })
    // Client will send 'addVideo' when the user inputs a youtube video link and requests to add it to the list
    socket.on('addVideo', (video_id) => {
        console.log('Received video ID:', video_id)
        let length = lobby.addVideo(video_id)
        console.log("-----Videos Queued-----")
        lobby.playlist.forEach(element => console.log(element))
        console.log(length)
        // If the list is empty, we need to make sure the client knows to render the new video added
        if(length == 1) {
            // if length == 1, then that means before the video added, the list was empty
            socket.emit('playVideo', lobby.playlist[0])
        }
        socket.emit('updatePlaylist', lobby.playlist);
    })
    // Client will send 'goNext' when either the video ends, or user requests to skip
    socket.on('goNext', () => {
        console.log("Received request to play next video")
        lobby.removeVideo()
        socket.emit('playVideo', lobby.playlist[0])
        socket.emit('updatePlaylist', lobby.playlist);
    })
    // Client will send 'toggleLoop' when they click the 'Loop' button
    socket.on('toggleLoop', () => {
        lobby.toggleLoop()
        console.log("Loop Toggled: ", lobby.loop)
    })
    // Sent automatically when the client disconnects from the server
    socket.on('disconnect', () => {
        console.log('A client disconnected')
    })
})

server.listen(35565, () => {
    console.log('Server listening on port 35565')
})
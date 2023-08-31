
// To handle registering new player states
let prevState = -5
// Keeps track of player time stamps
let prevRuntime = 0

let session_data

function setupTheater(io, socket, data) {
    session_data = data
    // The following requests require the user to be logged into the lobby

    // ------------------------------------ YouTube Stuff -----------------------------------------------

    // Client will send 'lobbyJoin' when connecting to server to retrieve any persisting information necessary
    socket.on('theater:joinLobby', () => {
        if (session_data.lobby === null || session_data.lobby_logged_in === false) {
            socket.emit('return')
            return
        }
        socket.emit('theater:playVideo', session_data.lobby.playlist[0])
        socket.emit('theater:updatePlaylist', session_data.lobby.playlist)
        if(prevState !== -5) {
            // console.log("Sending old runtime information: previous state = " + prevState + " prev time = " + prevRuntime)
            socket.emit('theater:receiveInfo', prevState, prevRuntime)
        }
    })
    // Client will send 'addVideo' when the user inputs a youtube video link and requests to add it to the list
    socket.on('theater:addVideo', (video_id) => {
        if (session_data.lobby === null || session_data.lobby_logged_in === false) {
            socket.emit('return')
            return
        }
        console.log('Received video ID:', video_id)
        let length = session_data.lobby.addVideo(video_id)
        console.log("-----Videos Queued-----")
        session_data.lobby.playlist.forEach(element => console.log(element))
        console.log(length)
        // If the list is empty, we need to make sure the client knows to render the new video added
        if(length == 1) {
            // if length == 1, then that means before the video added, the list was empty
            // socket.emit('playVideo', lobby.playlist[0])
            io.to(session_data.lobby.id).emit('theater:playVideo', session_data.lobby.playlist[0])
        }
        // socket.emit('updatePlaylist', lobby.playlist);
        io.to(session_data.lobby.id).emit('theater:updatePlaylist', session_data.lobby.playlist)
    })
    // Client will send 'goNext' when either the video ends, or user requests to skip
    socket.on('theater:goNext', () => {
        if (session_data.lobby === null || session_data.lobby_logged_in === false) {
            socket.emit('return')
            return
        }

        console.log("Received request to play next video")
        session_data.lobby.removeVideo()
        // socket.emit('playVideo', lobby.playlist[0])
        // socket.emit('updatePlaylist', lobby.playlist)
        io.to(session_data.lobby.id).emit('theater:playVideo', session_data.lobby.playlist[0])
        io.to(session_data.lobby.id).emit('theater:updatePlaylist', session_data.lobby.playlist)
    })
    // Client will send 'toggleLoop' when they click the 'Loop' button
    socket.on('theater:toggleLoop', () => {
        if (session_data.lobby === null || session_data.lobby_logged_in === false) {
            socket.emit('return')
            return
        }
        session_data.lobby.toggleLoop()
        console.log("Loop Toggled: ", session_data.lobby.loop)
    })
    socket.on('theater:playbackChange', (playbackState, playbackTime) => {
        console.log("Playback State Received: ", playbackState)
        if(prevState !== playbackState) {
            prevState = playbackState
            console.log("Change detected: sending new info...")
            // socket.emit('theater:receiveInfo', playbackState, playbackTime)
            io.to(session_data.lobby.id).emit('theater:receiveInfo', playbackState, playbackTime)
        }
    })
    // Every second, clients will send back playback time for server use -> a large difference in time is assumed to be a "scrub"
    socket.on('theater:updateTime', (playerTime) => {
        if(Math.abs(prevRuntime - playerTime) > 4) {
            // Consider it a scrub
            io.to(session_data.lobby.id).emit('theater:receiveInfo', prevState, playerTime)
        }
        prevRuntime = playerTime
    })

    // Call the clients to update playback rate
    socket.on('theater:playbackRateChange', (playbackRate) => {
        io.to(session_data.lobby.id).emit('theater:rateChange', playbackRate)
    })

    // Twitch Stuff

    socket.on('theater:joinTwitch', () => {
        socket.emit('theater:changeChannel', session_data.lobby.twitch_channel)
    })

    
    socket.on('theater:setChannel', (channel) => {
        session_data.lobby.twitch_channel = channel
        io.to(session_data.lobby.id).emit('theater:changeChannel', session_data.lobby.twitch_channel)
        console.log(channel)
    })
}

module.exports = {
    setupTheater
}
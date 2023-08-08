const Lobby = require('../yt_lobby.js')

let session_data
let lobbies = []

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

function setupLobbies(io, socket, data) {
    session_data = data

    // Client will send 'checkLobby' to test lobby login and possibly permit the user
    socket.on('theater:checkLobby', (lobby_id, lobby_password) => {
        session_data.lobby = searchLobbyId(lobby_id)

        console.log(lobby_password)
        if (session_data.lobby === null) {
            socket.emit('theater:noLobby')
        } else if (session_data.lobby.privacy.localeCompare('yes') === 0 && session_data.lobby.password.localeCompare(lobby_password) !== 0) {
            socket.emit('theater:noPassword')
        } else {
            session_data.lobby_logged_in = true
            socket.emit('theater:pushLobbyScene', session_data.lobby.id)
            session_data.lobby.addConnection(socket)
        }
    })

    // Client will send 'createLobby' to create a lobby
    socket.on('theater:createLobby', (name, privacy, description, password) => {
        session_data.lobby = createNewLobby(name, privacy, description, password)
        session_data.lobby_logged_in = true
        socket.emit('theater:pushLobbyScene', session_data.lobby.id)
    })
}

function disconnectLobby() {
    if (session_data.lobby === null || session_data.lobby_logged_in === false) {
        socket.emit('theater:noLobby')
        return
    }
    session_data.lobby.removeConnection(socket)

    if (session_data.lobby.connectionLength() === 0) {
        lobbies.splice(lobbies.indexOf(session_data.lobby), 1)
    }

    session_data.lobby = null
    session_data.lobby_logged_in = false
}

module.exports = {
    setupLobbies,
    disconnectLobby
}
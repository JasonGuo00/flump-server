const Lobby = require('../yt_lobby.js')

let session_data
let lobbies = []

// Recreates all persistent lobbies in the database.  Prints out a list of their names when complete.
async function recreatePersistentLobbies(db) {
    // Retrieve all of the persistent lobbies
    const results = await new Promise((resolve, reject) => {
        db.query('SELECT * FROM lobbies', [], function(err, results) {
            if(err){reject(err)}
            else {
                resolve(results)
            }
        })
    })
    // Throw errors here
    if(results instanceof Error) {return}
    else {
        // For each persistent lobby:
        for(var i = 0; i < results.length; i++) {
            let current = results[i]
            // Recreate the lobby
            let lobby = new Lobby(current.lobby_id, current.lobby_name, current.privacy, current.description, current.password, 'yes', db, current.owner_auth_id, true)
            lobbies.push(lobby)
        }
        console.log("All previous persistent lobbies loaded: ")
        console.log("---- Persistent Lobbies ----")
        for(var i = 0; i < lobbies.length; i++) {
            console.log(lobbies[i].name)
        }
        console.log('-------- End of List --------')
    }
}

function createNewLobby(name, privacy, description, password, persistence, db, owner_auth_id) {
    let id = createLobbyID()

    while (searchLobbyId(id) != null) {
        id = searchLobbyId(id)
    }

    let lobby = new Lobby(id, name, privacy, description, password, persistence, db, owner_auth_id, false);
    lobbies.push(lobby);

    // Push the lobby to the DB if it is persistent -> method returns true if the lobby is pushed to the database
    if(lobby.checkPersistence()) {
        db.query('UPDATE users SET num_lobbies = num_lobbies - 1 WHERE auth_id = ?', [owner_auth_id], function(err, result) {
            if(err){throw err}
        })
    }

    console.log(lobbies)
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

function setupLobbies(io, socket, data, db) {
    session_data = data
    recreatePersistentLobbies(db)

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
            socket.join(session_data.lobby.id)
            session_data.lobby.addConnection(socket)
        }
    })

    // Client will send 'createLobby' to create a lobby
    socket.on('theater:createLobby', (name, privacy, description, password, persistence, owner_auth_id) => {
        session_data.lobby = createNewLobby(name, privacy, description, password, persistence, db, owner_auth_id)
        session_data.lobby_logged_in = true
        socket.emit('theater:pushLobbyScene', session_data.lobby.id)
        socket.join(session_data.lobby.id)
    })

    socket.on("chat:sendMessage", (message) => {
        let username

        db.query("SELECT * FROM users WHERE auth_id = ?", [socket.auth_id], function (err, result) {
            if (err) throw err;
            if (result.length !== 0) {
                console.log("Search Result: " + result[0].username)
                io.to(session_data.lobby.id).emit("chat:propogateMessage", result[0].username, message)
            }
        })
        
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
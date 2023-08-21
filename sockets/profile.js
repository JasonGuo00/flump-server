function setupProfile(io, socket, db) {
    db.query("SELECT * FROM users WHERE auth_id = ?", [socket.auth_id], function (err, result) {
        if (err) throw err;
        if(result.length !== 0) {
            console.log("User found, sending info to client")
            socket.emit('session:obtainInfo', result[0].username, socket.auth_id, result[0].color, result[0].email, result[0].bio, result[0].num_lobbies)
        }
    })

    socket.on('profile:changes', (sessionInfo) => {
        // LATER: Implement a function to check what changes are necessary: probably cleaner to do this client side
        setUsername(db, sessionInfo)
        setEmail(db, sessionInfo)
        setBio(db, sessionInfo)
        socket.emit('profile:changesReceived')
    })
}

// Functions for updating individual entries
function setUsername(db, sessionInfo) {
    db.query("UPDATE users SET username = ? WHERE auth_id = ?", [sessionInfo.username, sessionInfo.auth_id], function (err, result) {
        if(err) {
            throw err
        }
        console.log('Updated username: ' + result)
    })
}

function setEmail(db, sessionInfo) {
    db.query("UPDATE users SET email = ? WHERE auth_id = ?", [sessionInfo.email, sessionInfo.auth_id], function (err, result) {
        if(err) {
            throw err
        }
        console.log('Updated email: ' + result)
    })
}

function setBio(db, sessionInfo) {
    db.query("UPDATE users SET bio = ? WHERE auth_id = ?", [sessionInfo.bio, sessionInfo.auth_id], function (err, result) {
        if(err) {
            throw err
        }
        console.log('Updated bio: ' + result)
    })
}

module.exports = {
    setupProfile
}
    
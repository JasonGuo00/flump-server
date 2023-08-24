const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const fs = require('fs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');

const { setupLobbies, disconnectLobby } = require('./sockets/lobby.js')
const { setupTheater } = require('./sockets/theater.js')
const { setupShareScreen } = require('./sockets/sharescreen.js')
const { setupProfile } = require('./sockets/profile.js')

const db = mysql.createConnection({
    host: "localhost",
    user: "flump_server",
    password: "!_(V%RJ)uB8x6a-",
    database: "flump",
});

db.connect((err) => {
    if (err) {
        console.log("Could not connect to SQL database at localhost")
        throw err
    } 
    console.log("Connected to SQL database at localhost")
})

app.get('/login', (req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' })
    fs.createReadStream('googlelogin.html').pipe(res)
})

io.on('connection', async (socket) => {
    console.log('A client connected')
    socket.join('lobby1')

    
    // Testing
    socket.on('buttonClick', () => {
        console.log('buttonClick')
        socket.emit('serverResponse', 'Bing Chilling')
    })

    socket.on("authenticate", (token) => {
        jwt.verify(token, 'OyIxHEBPZOuaZsY2P5KvsjnVScKoalpe', function(err, decoded) {
            if (err || decoded == null) {
                console.log("Unable to Verify")
            } else {
                console.log(decoded)
                
                let session_data = {
                    token: decoded,
                    lobby: null,
                    lobby_logged_in: false
                }

                let auth_id = decoded.sub.substring(decoded.sub.indexOf("auth0|") + "auth0|".length)

                socket.auth_id = auth_id

                db.query("SELECT * FROM users WHERE auth_id = ?", [auth_id], function (err, result) {
                    if (err) throw err;
                    if (result.length === 0) {
                        console.log("Creating new User")
                        db.query("INSERT INTO users(auth_id, creation) VALUES(?, ?)", [auth_id, new Date().toISOString().slice(0, 19).replace('T', ' ')], function (err, result) {
                            if (err) throw err;
                            console.log("Insert Result: " + result);
                        });
                    }
                });

                setupLobbies(io, socket, session_data, db)
                setupTheater(io, socket, session_data)
                setupShareScreen(io, socket, session_data)
                setupProfile(io, socket, db)

                // Sent automatically when the client disconnects from the server
                socket.on('disconnect', () => {
                    disconnectLobby()

                    console.log('A client disconnected')
                })
            }
        })
    })
})

server.listen(35565, () => {
    console.log('Server listening on port 35565')    
})
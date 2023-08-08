const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const fs = require('fs');
const jwt = require('jsonwebtoken');

const { setupLobbies, disconnectLobby } = require('./sockets/lobby.js')
const { setupTheater } = require('./sockets/theater.js')
const { setupShareScreen } = require('./sockets/sharescreen.js')


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

                setupLobbies(io, socket, session_data)
                setupTheater(io, socket, session_data)
                setupShareScreen(io, socket, session_data)

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
const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const fs = require('fs');
const jwt = require('jsonwebtoken');

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
                console.log("FUCK")
            } else {
                decoded_token = decoded
                console.log(decoded_token)
                
                setupTheater(io, socket)
                setupShareScreen(io, socket)
            }
        })
    })

    
})

server.listen(35565, () => {
    console.log('Server listening on port 35565')
})
class Lobby {
    // Constructor: lobby takes a name and a playlist
    constructor(id, name, privacy, description, password, persistence, db, owner_auth_id, startup) {
        this.id = id
        this.name = name
        this.privacy = privacy
        this.description = description
        this.password = password
        this.playlist = []
        this.loop = false
        this.connections = []
        this.persistence = persistence
        this.db = db
        this.owner_auth_id = owner_auth_id
        if(persistence === 'yes' && startup) {
            this.startup()
        }
    }

    addConnection(socket) {
        this.connections.push(socket)
    }

    removeConnection(socket) {
        this.connections.splice(this.connections.indexOf(socket), 1)
    }

    connectionLength() {
        return this.connections.length
    }

    // Add a video to the lobby's playlist -> duplicate checking included
    addVideo(URL) {
        const duplicate = this.checkDuplicates(URL)
        if(!duplicate) {
            console.log("Video ID was pushed")
            const length = this.playlist.push(URL)
            // Link video to database if lobby is persistent
            if(persistence === 'yes') {
                this.dbAddToPlaylist(URL)
            }
            return length
        }
        else {
            console.log("Duplicate receieved, not pushing")
            return -1
        }
    }

    // Remove a video from the lobby's playlist (FIFO) -> different behavior if looping enabled
    removeVideo() {
        if(!this.loop) {
            this.playlist.shift()
            console.log("Video removed")
            if(persistence === 'yes') {
                this.dbRemoveFromPlaylist()
            }
        }
        else {
            this.loopVideos()
        }
    }

    // Toggle looping
    toggleLoop() {
        this.loop = !(this.loop)
    }

    // Loop behavior - push the removed video to the end of the playlist if looping
    loopVideos() {
        const url = this.playlist.shift()
        this.playlist.push(url)
    }

    // Check for duplicate videos
    checkDuplicates(URL) {
        const result = this.playlist.find(item => item === URL)
        if(result) {
            return true
        }
        return false
    }

    async startup() {
        // Query for the videos associated with the lobby
        const results = await new Promise((resolve, reject) => {
            this.db.query('SELECT * FROM playlist WHERE lobby_id = ? ORDER BY position', [this.id], function(err, results) {
                if(err){reject(err)}
                else{resolve(results)}
            })
        })
        if(results instanceof Error) {return}
        else {
            // Add all videos back into the lobby
            for(var x = 0; x < results.length; x++) {
                this.playlist.push(results[x].video_id)
            }
        }
        
    }

    // Add into the database a youtube video id and its associated lobby and position in the playlist
    dbAddToPlaylist(URL) {
        const pos = this.playlist.indexOf(URL)
        if(pos === -1) {
            console.log('Video not in playlist')
            return
        }
        this.db.query('INSERT INTO playlist(lobby_id, video_id, position) VALUES(?, ?, ?)', [this.id, URL, pos], function(err, results) {
            if(err){throw err}
            console.log('Video added to the database playlist')
        })
    }

    // Main issue: users spamming the skip button may result in the database lagging behind and not reflecting the expected state of the playlist
    async dbRemoveFromPlaylist() {
        const result = await new Promise((resolve, reject) => {
            this.db.query('DELETE FROM playlist WHERE position = ?', [0], function(err, result) {
                if(err){reject(err)}
                else{resolve(result)}
            })
        })
        if(result instanceof Error) {throw result}
        this.db.query('UPDATE playlist SET position = position - 1 WHERE lobby_id = ?', [this.id], function(err, result) {
            if(err){throw err}
            console.log('Video removed from the database playlist')
        })
    }

    // Allow a button for users to resync, guaranteeing that the state of the database represents that of the client AT THE MOMENT that the user presses the save button
    async completeResync() {
        console.log("Completely resyncing current playlist with database playlist")
        // Remove all entries associated with this lobby
        const result = await new Promise((resolve, reject) => {
            this.db.query('DELETE FROM playlist WHERE lobby_id = ?', [this.id], function(err, result) {
                if(err){reject(err)}
                else{resolve(result)}
            })
        })
        if(result instanceof Error) {throw result}
        for(var i = 0; i < this.playlist.length; i++) {
            this.db.query('INSERT INTO playlist(lobby_id, video_id, position) VALUES(?, ?, ?)', [this.id, this.playlist[i], i], function(err, results) {
                if(err){throw err}
                console.log('Video added to the database playlist')
            })
        }
    }

    // If this is a persistent lobby, make sure to push it to the database
    checkPersistence() {
        if(this.persistence === 'yes') {
            this.db.query('INSERT INTO lobbies(lobby_id, lobby_name, owner_auth_id, privacy, description, password, creation) VALUES(?, ?, ?, ?, ?, ?, ?)', [this.id, this.name, this.owner_auth_id, this.privacy, this.description, this.password, new Date().toISOString().slice(0, 19).replace('T', ' ')], function(err, result) {
                if(err){throw err}
                console.log('Persistent lobby added to the database!')
            })
            return true
        }
        else {
           return false 
        }   
    }
}
    

module.exports = Lobby
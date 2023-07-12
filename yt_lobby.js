class Lobby {
    // Constructor: lobby takes a name and a playlist
    constructor(id, name, privacy, description, password) {
        this.id = id
        this.name = name
        this.privacy = privacy
        this.description = description
        this.password = password
        this.playlist = []
        this.loop = false
        this.connections = []
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


}

module.exports = Lobby
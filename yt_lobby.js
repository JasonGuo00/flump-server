class Lobby {
    // Constructor: lobby takes a name and a playlist
    constructor(name) {
        this.name = name
        this.playlist = []
        this.loop = false
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
export class Timer {
    constructor() {
        this.elapsed = 0
        this.last = new Date()
        this.running = false
    }

    start() {
        this.running = true
        this.last = new Date()
    }

    stop() {
        this.update()
        this.running = false
    }

    toggle() {
        if (this.running)
            this.stop()
        else
            this.start()
    }

    reset() {
        this.elapsed = 0
        this.last = new Date()
    }

    update() {
        if (this.running) {
            const now = new Date()
            this.elapsed += now - this.last
            this.last = now
        }
    }

    getTime() {
        this.update()
        return this.elapsed / 1000
    }
}
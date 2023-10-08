// https://stackoverflow.com/a/5111475
export class FPSHandler {
    constructor() {
        this.filterStrength = 20
        this.frameTime = 0
        this.lastLoop = new Date()
        this.thisLoop = null
    }

    update() {
        const currentFrameTime = (this.thisLoop = new Date()) - this.lastLoop
        this.frameTime += (currentFrameTime - this.frameTime) / this.filterStrength
        this.lastLoop = this.thisLoop
    }

    getFPS() {
        return (1000 / this.frameTime).toFixed(2)
    }
}
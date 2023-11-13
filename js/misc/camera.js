import {Vec3} from "./vector.js";

export class Camera {
    constructor(x = 0, y = 0, z = 0) {
        this.position = new Vec3(x, y, z)
        this.direction = new Vec3(0, 0, 1)

        this.pitch = 0
        this.yaw = 0

        this.step = 0.01

        this.active = false
        this.movement = {
            w: false,
            a: false,
            s: false,
            d: false,
            ' ': false,
            Shift: false,
        }

        document.addEventListener('keydown', (event) => {
            if (this.active)
                this.movement[event.key] = true
        })

        document.addEventListener('keyup', (event) => {
            if (this.active)
                this.movement[event.key] = false
        })

        document.addEventListener('mousemove', (event) => {
            if (!this.active)
                return

            const dx = event.movementX / 1000
            const dy = event.movementY / 1000

            this.yaw = (this.yaw - dx) % (2 * Math.PI)
            this.pitch = Math.min(1.5, Math.max(-1.5, this.pitch + dy))
        })
    }

    async enable(canvas) {
        this.active = true

        await canvas.requestPointerLock()
    }

    disable() {
        this.active = false
        this.movement = {w: false, a: false, s: false, d: false}
    }

    update() {
        if (!this.active)
            return

        const moveDir = this.direction.rotateY(this.yaw).mul(this.step)

        if (this.movement.w && !this.movement.s) {
            this.position.x += moveDir.x
            this.position.z += moveDir.z
        }

        if (!this.movement.w && this.movement.s) {
            this.position.x -= moveDir.x
            this.position.z -= moveDir.z
        }

        if (this.movement.a && !this.movement.d) {
            this.position.x += moveDir.z
            this.position.z -= moveDir.x
        }

        if (!this.movement.a && this.movement.d) {
            this.position.x -= moveDir.z
            this.position.z += moveDir.x
        }

        if (this.movement[' '] && !this.movement.Shift) {
            this.position.y += this.step
        }

        if (!this.movement[' '] && this.movement.Shift) {
            this.position.y -= this.step
        }
    }

    getPos() {
        return this.position.toArray()
    }

    getDir() {
        return this.direction.rotateX(this.pitch).rotateY(this.yaw).toArray()
    }
}
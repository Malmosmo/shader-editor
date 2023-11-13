export class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(other) {
        return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    sub(other) {
        return new Vec3(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    mul(scalar) {
        return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    rotateY(angle) {
        let s = Math.sin(angle);
        let c = Math.cos(angle);

        return new Vec3(
            c * this.x + s * this.z,
            this.y,
            c * this.z - s * this.x
        );
    }

    rotateX(angle) {
        let s = Math.sin(angle);
        let c = Math.cos(angle);

        return new Vec3(
            this.x,
            c * this.y - s * this.z,
            s * this.y + c * this.z
        );
    }

    toArray() {
        return [this.x, this.y, this.z]
    }
}
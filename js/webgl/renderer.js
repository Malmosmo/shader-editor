export const frag = `#version 300 es

#ifdef GL_ES
precision mediump float;
#endif

out vec4 glFragColor;

void main() {
  glFragColor = vec4(0.2, 0.5, 0.7, 1.0);
}`

const vert = `#version 300 es
                   
in vec2 position;

void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}`

export class WebGLRenderer {
    constructor(canvas, uniforms) {
        this.canvas = canvas
        this.gl = null
        this.programInfo = null

        this.vertexShader = vert
        this.fragmentShader = frag

        this.uniforms = uniforms
    }

    onerror(error) {
        console.log(error)
    }

    initialize() {
        this.gl = this.getWebGLContext()
        if (this.gl === null) return

        const vert = this.createShader(this.vertexShader, this.gl.VERTEX_SHADER)
        const frag = this.createShader(this.fragmentShader, this.gl.FRAGMENT_SHADER)
        if (vert === null || frag === null) return

        const prog = this.createProgram(vert, frag)
        if (prog === null) return

        this.gl.useProgram(prog)
        this.programInfo = {
            program: prog,
            attributeLocations: {
                'position': this.gl.getAttribLocation(prog, 'position')
            },
            uniformLocations: {},
            [this.gl.VERTEX_SHADER]: vert,
            [this.gl.FRAGMENT_SHADER]: frag
        }

        for (const uniform of this.uniforms) {
            this.programInfo.uniformLocations[uniform.name] = this.gl.getUniformLocation(prog, uniform.name)
        }

        const vertexBuffer = this.gl.createBuffer()
        const vertices = new Float32Array([
            -1.0, 1.0,
            1.0, 1.0,
            -1.0, -1.0,
            -1.0, -1.0,
            1.0, 1.0,
            1.0, -1.0
        ])

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW)

        const position = this.programInfo.attributeLocations['position']
        this.gl.enableVertexAttribArray(position);
        this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, 0, 0);
    }

    getWebGLContext() {
        const gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl')
        if (gl === null) {
            console.error('Unable to initialize WebGL')
        }

        return gl
    }

    createShader(source, type) {
        const gl = this.gl
        const shader = gl.createShader(type)

        gl.shaderSource(shader, source)
        gl.compileShader(shader)

        const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

        if (!status) {
            const message = gl.getShaderInfoLog(shader)
            this.onerror(message)

            gl.deleteShader(shader)
            return null
        }

        return shader
    }

    createProgram(vertexShader, fragmentShader) {
        const gl = this.gl
        const program = gl.createProgram()

        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)

        const status = gl.getProgramParameter(program, gl.LINK_STATUS)

        if (!status) {
            const message = gl.getProgramInfoLog(program)
            this.onerror(message)

            gl.deleteProgram(program)
            return null
        }

        return program
    }

    updateVertShader(source) {
        this.vertexShader = source
        this.initialize()
    }

    updateFragShader(source) {
        this.fragmentShader = source
        this.initialize()
    }

    setUniforms() {
        const gl = this.gl
        if (this.programInfo === null) return

        for (const uniform of this.uniforms) {
            const location = this.programInfo.uniformLocations[uniform.name]
            const value = uniform.value(this)

            if (value instanceof Array) {
                gl[uniform.type](location, ...value)
            } else {
                gl[uniform.type](location, value)
            }
        }
    }

    render() {
        const gl = this.gl
        if (gl === null) return

        this.setUniforms()
        gl.clearColor(0.5, 0.7, 0.5, 1.0)
        gl.clearDepth(1.0)
        gl.enable(gl.DEPTH_TEST)
        gl.depthFunc(gl.LEQUAL)

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
}
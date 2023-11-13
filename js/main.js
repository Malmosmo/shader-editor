import {WebGLRenderer, frag} from './webgl/renderer.js'
import * as glsl from './editor/languages/glsl.js'
import {Timer} from './misc/timer.js'
import {FPSHandler} from './misc/fps.js'
import {theme} from './editor/themes/one-dark.js'
import {parseError} from './misc/error.js'
import {Camera} from "./misc/camera.js";

// ----------------------------------------------------------------------------------------------------
// Global Variables
// ----------------------------------------------------------------------------------------------------
const canvas = document.querySelector('canvas#canvas')
const timer = new Timer()
const fpsHandler = new FPSHandler()
const camera = new Camera(0, 0, -1)

let animate = false
let preCameraAnimate = false
let fpsInterval = null

// ----------------------------------------------------------------------------------------------------
// ---
// ----------------------------------------------------------------------------------------------------
function saveLocalStorage(code) {
    localStorage.setItem('code', code)
}

const code = localStorage.getItem('code') ?? frag

// ----------------------------------------------------------------------------------------------------
// Initialize Monaco Editor
// ----------------------------------------------------------------------------------------------------
monaco.editor.defineTheme('one-dark', theme)
monaco.languages.register({id: 'glsl'})
monaco.languages.setMonarchTokensProvider('glsl', glsl.tokensProvider)
monaco.languages.registerCompletionItemProvider('glsl', glsl.completionItemProvider)
monaco.languages.setLanguageConfiguration('glsl', glsl.languageConfiguration)
monaco.languages.registerDocumentFormattingEditProvider('glsl', glsl.documentFormattingEditProvider);
const editor = monaco.editor.create(document.querySelector('div#editor'), {
    value: code,
    language: 'glsl',
    theme: 'one-dark',
    automaticLayout: true
});

// ----------------------------------------------------------------------------------------------------
// Editor
// ----------------------------------------------------------------------------------------------------
editor.addAction({
    id: "run-shader",
    label: "Run Shader",
    keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR,
    ],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: "navigation",
    contextMenuOrder: 1.5,

    run: function (_editor) {
        saveLocalStorage(_editor.getValue())

        // clear model markers
        const model = _editor.getModel()
        monaco.editor.setModelMarkers(model, "owner", []);

        // clear error
        const errorDisplay = document.querySelector('#error-output')
        errorDisplay.innerHTML = '<span class="text-[#73c991]">Compiled successfully!</span>'

        // format document
        editor.trigger("editor", "editor.action.formatDocument", null);

        // update shader
        const code = _editor.getValue()
        renderer.updateFragShader(code)
        renderer.render()
    },
})

// editor.addAction({
//     id: "save-shader",
//     label: "Save File",
//     keybindings: [
//         monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
//     ],
//     precondition: null,
//     keybindingContext: null,
//     contextMenuGroupId: "navigation",
//     contextMenuOrder: 1.5,

//     run: function (_editor) {
//         const code = _editor.getValue()
//         saveLocalStorage(code)

//         const blob = new Blob([code], { type: 'text/plain' })
//         const url = URL.createObjectURL(blob)

//         const link = document.createElement("a");
//         link.href = url;
//         link.download = 'fragmentshader.glsl';
//         link.click();
//     },
// })


// ----------------------------------------------------------------------------------------------------
// Renderer
// ----------------------------------------------------------------------------------------------------
const renderer = new WebGLRenderer(canvas, [
    {
        type: 'uniform1f',
        name: 'iTime',
        value: function () {
            return timer.getTime()
        }
    }, {
        type: 'uniform2f',
        name: 'iResolution',
        value: function (instance) {
            return [instance.canvas.clientWidth, instance.canvas.clientHeight]
        }
    }, {
        type: 'uniform3f',
        name: 'iCameraPos',
        value: function () {
            return camera.getPos()
        }
    }, {
        type: 'uniform3f',
        name: 'iCameraDir',
        value: function () {
            return camera.getDir()
        }
    }
])

renderer.initialize()
renderer.onerror = (error) => parseError(error, editor)

// ----------------------------------------------------------------------------------------------------
// Controls
// ----------------------------------------------------------------------------------------------------

// --------------------------------------------------
// Timer Controls
// --------------------------------------------------
const resetTimerBtn = document.querySelector('button#reset')
resetTimerBtn.addEventListener('click', function () {
    timer.reset()

    if (!animate) {
        updateTimer()
        renderer.render()
    }

})

const toggleTimerBtn = document.querySelector('button#toggle')
toggleTimerBtn.addEventListener('click', function () {
    for (const child of toggleTimerBtn.children)
        child.classList.toggle('hidden')

    animate = !animate
    if (animate)
        requestAnimationFrame(animationLoop)

    timer.toggle()
})

const timerDisplay = document.querySelector('span#time')

function updateTimer() {
    timerDisplay.textContent = timer.getTime().toFixed(2)
}

updateTimer()

// --------------------------------------------------
// FPS Controls
// --------------------------------------------------
const fpsDisplay = document.querySelector('span#fps')

function updateFPS() {
    fpsDisplay.textContent = fpsHandler.getFPS() + ' fps'
}

// --------------------------------------------------
// Canvas Size
// --------------------------------------------------
const sizeDisplay = document.querySelector('span#size')
const observer = new ResizeObserver(entries => {
    entries.forEach(entry => {
        const canvas = entry.target
        const displayWidth = canvas.clientWidth
        const displayHeight = canvas.clientHeight

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth
            canvas.height = displayHeight
        }

        if (!animate)
            renderer.render()

        sizeDisplay.textContent = `${canvas.width}x${canvas.height}`
    });
})

observer.observe(canvas)

// --------------------------------------------------
// Fullscreen
// --------------------------------------------------
const fullscreenButton = document.querySelector('button#fullscreen')
fullscreenButton.addEventListener('click', _ => {
    if (screenfull.isEnabled) {
        screenfull.toggle(document.querySelector('#canvas-wrapper'))
    }
})

document.addEventListener('fullscreenchange', _ => {
    for (const child of fullscreenButton.children) {
        child.classList.toggle('hidden')
    }
});


// --------------------------------------------------
// Camera controls
// --------------------------------------------------
const cameraButton = document.querySelector('button#camera')

cameraButton.addEventListener('click', async function () {
    await camera.enable(canvas)
    preCameraAnimate = animate
    animate = true

    requestAnimationFrame(animationLoop)
})

document.addEventListener('pointerlockchange', function () {
    if (document.pointerLockElement !== canvas) {
        camera.disable()
        animate = preCameraAnimate
    }
})


// ----------------------------------------------------------------------------------------------------
// Animation Loop
// ----------------------------------------------------------------------------------------------------
function animationLoop() {
    renderer.render()
    fpsHandler.update()

    if (fpsInterval === null) {
        fpsInterval = setInterval(updateFPS, 100)
        updateFPS()
    }

    if (camera.active)
        camera.update()

    if (timer.running)
        updateTimer()

    if (animate)
        requestAnimationFrame(animationLoop)
    else {
        clearInterval(fpsInterval)
        fpsInterval = null

        // timer.stop()
    }
}

requestAnimationFrame(animationLoop)
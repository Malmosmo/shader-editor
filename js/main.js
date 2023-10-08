import { WebGLRenderer, FRAGMENT_SHADER } from './webgl/renderer.js'
import { tokensProvider, completionItemProvider, languageConfiguration } from './editor/languages/glsl.js'
import { Timer } from './misc/timer.js'
import { FPSHandler } from './misc/fps.js'
import { theme } from './editor/themes/one-dark.js'
import { parseError } from './misc/error.js'

// ----------------------------------------------------------------------------------------------------
// Misc Variables
// ----------------------------------------------------------------------------------------------------
const canvas = document.querySelector('canvas#canvas')
const timer = new Timer()
const fpsHandler = new FPSHandler()

// ----------------------------------------------------------------------------------------------------
// ---
// ----------------------------------------------------------------------------------------------------
function saveLocalStorage(code) {
    localStorage.setItem('code', code)
}

const code = localStorage.getItem('code') ?? FRAGMENT_SHADER
monaco.editor.defineTheme('one-dark', theme)
monaco.languages.register({ id: 'glsl' })
monaco.languages.setMonarchTokensProvider('glsl', tokensProvider)
monaco.languages.registerCompletionItemProvider('glsl', completionItemProvider)
monaco.languages.setLanguageConfiguration('glsl', languageConfiguration)
monaco.languages.registerDocumentFormattingEditProvider('glsl', {
    provideDocumentFormattingEdits(model, options) {
        const code = model.getValue()
        const formatted = GLSLX.format(code)
        return [
            {
                range: model.getFullModelRange(),
                text: formatted
            }
        ];
    }
});
const editor = monaco.editor.create(document.querySelector('div#editor'), {
    value: code,
    language: 'glsl',
    theme: 'one-dark',
    automaticLayout: true
});

// ----------------------------------------------------------------------------------------------------
// Renderer
// ----------------------------------------------------------------------------------------------------
const renderer = new WebGLRenderer(canvas, {
    onrender: () => fpsHandler.update(),
    onerror: (error) => {
        parseError(error, editor)
    },

    fragment: code,

    uniforms: [{
        type: 'uniform1f',
        name: 'iTime',
        value: function (instance) {
            return timer.getTime()
        }
    }, {
        type: 'uniform2f',
        name: 'iResolution',
        value: function (instance) {
            return [instance.canvas.clientWidth, instance.canvas.clientHeight]
        }
    }]
})

renderer.initialize()

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

        // format
        editor.trigger("editor", "editor.action.formatDocument");

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
// Controls
// ----------------------------------------------------------------------------------------------------

// --------------------------------------------------
// Timer Controls
// --------------------------------------------------
const resetButton = document.querySelector('button#reset')
resetButton.addEventListener('click', _ => {
    timer.reset()

    if (!renderer.animate)
        renderer.render()
})

const toggleButton = document.querySelector('button#toggle')
toggleButton.addEventListener('click', _ => {
    for (const child of toggleButton.children) {
        child.classList.toggle('hidden')
    }

    renderer.animate = !renderer.animate
    if (renderer.animate) {
        renderer.render()
    }

    timer.toggle()
})

const timeDisplay = document.querySelector('span#time')
setInterval(_ => timeDisplay.textContent = timer.getTime().toFixed(2), 100)

// --------------------------------------------------
// FPS Controls
// --------------------------------------------------
const fpsDisplay = document.querySelector('span#fps')
const updateFPSDisplay = _ => fpsDisplay.textContent = (renderer.animate ? fpsHandler.getFPS() : 0) + " fps"
updateFPSDisplay()
setInterval(updateFPSDisplay, 1000);

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

        if (!renderer.animate)
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

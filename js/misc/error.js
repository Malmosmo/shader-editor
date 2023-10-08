class Error {
    constructor(message, startLine, startColumn, editor) {
        this.message = message
        this.startLine = Number(startLine)
        this.startColumn = Number(startColumn)
        this.editor = editor
    }

    getMarker() {
        return {
            severity: monaco.MarkerSeverity.Error,
            message: this.message,
            startLineNumber: this.startLine,
            startColumn: this.startColumn,
            endLineNumber: this.startLine,
            endColumn: this.editor.getModel().getLineLength(this.startLine)
        }
    }

    html() {
        const error = this.message.split(':').map(item => item.trim()).slice(-2).join(' : ')

        const wrapper = document.createElement('div')
        wrapper.classList.add('flex', 'text-[#e06c75]')

        const content = document.createElement('span')
        content.textContent = `Error on Line ${this.startLine}: ${error}`

        wrapper.appendChild(content)
        return wrapper
    }
}

export function parseError(glslError, editor) {
    const lines = glslError.trim().split('\n')
    const markers = []

    const errorDisplay = document.querySelector('#error-output')
    errorDisplay.innerHTML = ''

    for (const line of lines) {
        const [_, startColumn, startLine, __, ___] = line.split(':').map(item => item.trim())
        const error = new Error(line, startLine, startColumn, editor)

        errorDisplay.appendChild(error.html())
        markers.push(error.getMarker())
    }

    monaco.editor.setModelMarkers(editor.getModel(), "owner", markers);
}
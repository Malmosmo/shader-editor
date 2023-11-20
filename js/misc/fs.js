const indentRatio = 1.5


class BaseItem {
    constructor(fs, name, parent, indent) {
        this.fs = fs
        this.name = name
        this.parent = parent
        this.indent = indent

        this.html = null
    }
}


class BaseFile extends BaseItem {
    getPath() {
        return this.parent.getPath() + '/' + this.name
    }

    select() {
        this.fs.selected.file?.unselect()
        this.fs.selected.file = this

        this.fs.selected.directory.unselect()
        this.fs.selected.directory = this.parent

        // select
        this.html.classList.add('bg-red-500')
    }

    unselect() {
        // unselect
        this.html.classList.remove('bg-red-500')
    }

    createHead() {
        const wrapper = document.createElement('div')
        wrapper.setAttribute('data-fs-type', 'head')
        wrapper.classList.add('flex', 'cursor-pointer')
        wrapper.style.paddingLeft = `${this.indent * indentRatio}rem`

        const icon = document.createElement('i')
        icon.classList.add('bi', 'bi-file-earmark', 'mr-1')

        const span = document.createElement('span')
        span.textContent = this.name

        wrapper.appendChild(icon)
        wrapper.appendChild(span)

        wrapper.addEventListener('click', (event) => {
            this.select()
            event.stopPropagation()
        })

        return wrapper
    }

    createHTML() {
        const head = this.createHead()
        this.html = head
        return head
    }
}


class BaseDirectory extends BaseItem {
    constructor(fs, name, parent, indent) {
        super(fs, name, parent, indent)

        this.content = {}
    }

    getPath() {
        return this.parent?.getPath() || '' + '/' + this.name
    }

    getDirs() {
        return Object.values(this.content).filter(item => item instanceof BaseDirectory)
    }

    getFiles() {
        return Object.values(this.content).filter(item => item instanceof BaseFile)
    }

    select() {
        this.fs.selected.file?.unselect()
        this.fs.selected.file = null

        this.fs.selected.directory.unselect()
        this.fs.selected.directory = this

        // select
        this.html.querySelector('[data-fs-type=head]').classList.add('bg-green-500')
    }

    unselect() {
        // unselect
        this.html.querySelector('[data-fs-type=head]').classList.remove('bg-green-500')
    }

    newDir(name) {
        if (!(name in this.content))
            this.content[name] = new BaseDirectory(this.fs, name, this,this.indent + 1)
    }

    newFile(name) {
        if (!(name in this.content))
            this.content[name] = new BaseFile(this.fs, name, this,this.indent + 1)
    }

    createHead() {
        const wrapper = document.createElement('div')
        wrapper.setAttribute('data-fs-type', 'head')
        wrapper.classList.add('flex', 'item-center', 'cursor-pointer')
        wrapper.style.paddingLeft = `${this.indent * indentRatio}rem`

        const toggleIcon = document.createElement('i')
        toggleIcon.setAttribute('data-action', 'toggle')
        toggleIcon.classList.add('bi', 'bi-chevron-down')

        const icon = document.createElement('i')
        icon.classList.add('bi', 'bi-folder', 'mr-1', 'ml-2')

        const span = document.createElement('span')
        span.textContent = this.name

        wrapper.appendChild(toggleIcon)
        wrapper.appendChild(icon)
        wrapper.appendChild(span)

        wrapper.addEventListener('click', (event) => {
            this.select()
            event.stopPropagation()
        })

        return wrapper
    }

    createHTML() {
        const wrapper = document.createElement('div')
        const head = this.createHead()

        const toggleIcon = head.querySelector('[data-action=toggle]')
        toggleIcon.addEventListener('click', (event) => {
            childWrapper.classList.toggle('hidden')

            toggleIcon.classList.toggle('bi-chevron-down')
            toggleIcon.classList.toggle('bi-chevron-right')

            this.select()
            event.stopPropagation()
        })

        const childWrapper = document.createElement('div')

        for(const dir of this.getDirs()) {
            const child = dir.createHTML()
            childWrapper.appendChild(child)
        }

        for(const files of this.getFiles()) {
            const child = files.createHTML()
            childWrapper.appendChild(child)
        }

        wrapper.appendChild(head)
        wrapper.appendChild(childWrapper)

        this.html = wrapper
        return wrapper
    }
}


export class FileSystem {
    constructor(element) {
        this.root = new BaseDirectory(this, 'root', null, 0)
        this.element = element

        this.selected = {
            directory: this.root,
            file: null,
        }
    }

    // fromPath(path) {
    //     // note: cannot start with /root !! fix this
    //     const segments = path.split('/').filter(item => item !== '')
    //
    //     let current = this.root
    //     for (const segment of segments) {
    //         if (current instanceof BaseFile)
    //             throw Error('Not found!')
    //
    //         if (segment in current.content) {
    //             current = current.content[segment]
    //         } else {
    //             throw Error('Not found!')
    //         }
    //     }
    //
    //     return current
    // }

    newDir(name) {
        this.selected.directory.newDir(name)
        this.createHTML()
    }

    newFile(name) {
        this.selected.directory.newFile(name)
        this.createHTML()
    }

    createHTML() {
        this.element.innerHTML = ''
        const child = this.root.createHTML()
        this.element.appendChild(child)

        this.selected.file?.select()
        this.selected.directory.select()
    }
}

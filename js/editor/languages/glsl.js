const keywords = ['break', 'continue', 'discard', 'return', 'for', 'while', 'do', 'if', 'else', 'struct',
    'in', 'out', 'inout', 'for', 'while', 'do', 'if', 'else', 'struct']
const types = ['float', 'int', 'bool', 'void', 'vec2', 'vec3', 'vec4', 'ivec2', 'ivec3', 'ivec4', 'bvec2',
    'bvec3', 'bvec4', 'mat2', 'mat3', 'mat4', 'sampler2D', 'sampler3D',
    'samplerCube', 'const', 'attribute', 'uniform', 'varying']
const operators = ['=', '>', '<', '==', '<=', '>=', '!=', '<>', '+', '-', '*', '/', '&&', '||', '++', '--']

const tokenizer = {
    root: [// identifiers and keywords
        [/[a-z_$][\w$]*/, {
            cases: {
                '@typeKeywords': 'keyword',
                '@keywords': 'keyword',
                '@default': 'identifier'
            }
        }], [/[A-Z][\w$]*/, 'type.identifier'], // to show class names nicely
        // whitespace
        {
            include: '@whitespace'
        }, [/^\s*#\s*\w+/, 'keyword'], // delimiters and operators
        [/[{}()\[\]]/, '@brackets'], // @ annotations.
        // As an example, we emit a debugging log message on these tokens.
        // Note: message are supressed during the first load -- change some lines to see them.
        // eslint-disable-next-line no-useless-escape
        [/@\s*[a-zA-Z_$][\w$]*/, {
            token: 'annotation',
            log: 'annotation token: $0'
        }], // numbers
        [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'], [/0[xX][0-9a-fA-F]+/, 'number.hex'], [/\d+/, 'number'], // delimiter: after number because of .\d floats
        [/[;,.]/, 'delimiter'], // strings
        [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
        [/"/, {
            token: 'string.quote',
            bracket: '@open',
            next: '@string'
        }], // characters
        [/'[^\\']'/, 'string'], [/'/, 'string.invalid']],
    comment: [[/[^\/*]+/, 'comment'], [/\/\*/, 'comment', '@push'], // nested comment
    ['\\*/', 'comment', '@pop'], [/[\/*]/, 'comment']],
    string: [[/[^\\"]+/, 'string'], [/\\./, 'string.escape.invalid'], [/"/, {
        token: 'string.quote',
        bracket: '@close',
        next: '@pop'
    }]],
    whitespace: [[/[ \t\r\n]+/, 'white'], [/\/\*/, 'comment', '@comment'], [/\/\/.*$/, 'comment']]
}

export const tokensProvider = {
    keywords: keywords,
    typeKeywords: types,
    operators: operators,
    digits: /\d+(_+\d+)*/,
    octaldigits: /[0-7]+(_+[0-7]+)*/,
    binarydigits: /[0-1]+(_+[0-1]+)*/,
    hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,

    // The main tokenizer for our languages
    tokenizer: tokenizer
}

export const languageConfiguration = {
    autoClosingPairs: [
        { open: '(', close: ')' },
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '/**', close: ' */', notIn: ['string'] }
    ],
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
    ],
    comments: {
        lineComment: "//",
        blockComment: ["/*", "*/"]
    },
}

export const completionItemProvider = {
    provideCompletionItems: function (model, position, context, token) {
        const suggestions = [
            ...(keywords.concat(types)).map(k => {
                const word = model.getWordUntilPosition(position);

                return {
                    label: k,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: k,
                    range: {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn,
                    }
                }
            })
        ]

        return { suggestions: suggestions }
    }
}


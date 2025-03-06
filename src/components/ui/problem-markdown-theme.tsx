const customTheme = {
    'code[class*="language-"]': {
      color: 'var(--syntax-text-color)',
      background: 'var(--syntax-bg-color)',
      fontFamily: 'var(--syntax-font-family, Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace)',
      fontSize: 'var(--syntax-font-size, 1em)',
      textAlign: 'left',
      lineHeight: 'var(--syntax-line-height, 1.5)'
    },
    'pre[class*="language-"]': {
      color: 'var(--syntax-text-color)',
      background: 'var(--syntax-bg-color)',
      padding: 'var(--syntax-padding, 1em)',
      borderRadius: 'var(--syntax-border-radius, 0.3em)',
    //   overflow: 'auto'
    },
    'comment': {
      color: 'var(--syntax-comment-color)'
    },
    'punctuation': {
      color: 'var(--syntax-punctuation-color)'
    },
    'keyword': {
      color: 'var(--syntax-keyword-color)'
    },
    'string': {
      color: 'var(--syntax-string-color)'
    },
    'function': {
      color: 'var(--syntax-function-color)'
    },
    'boolean': {
      color: 'var(--syntax-boolean-color)'
    },
    'number': {
      color: 'var(--syntax-number-color)'
    },
    'operator': {
      color: 'var(--syntax-operator-color)'
    }
  };

  export {customTheme};
  
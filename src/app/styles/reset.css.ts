import { globalStyle, layer } from '@vanilla-extract/css'
import { root as DocsLayout } from '../layouts/DocsLayout.css.js'
import { fontFamilyVars, fontSizeVars, primitiveColorVars } from './vars.css.js'

const resetLayer = layer()

globalStyle(['*', '::before', '::after'].join(','), {
  '@layer': {
    [resetLayer]: {
      boxSizing: 'border-box',
      borderWidth: '0',
      borderStyle: 'solid',
    },
  },
})

globalStyle('*:focus-visible', {
  '@layer': {
    [resetLayer]: {
      outline: `2px solid ${primitiveColorVars.borderAccent}`,
      outlineOffset: '2px',
      outlineStyle: 'dashed',
    },
  },
})

globalStyle('html, body', {
  '@layer': {
    [resetLayer]: {
      textSizeAdjust: '100%',
      tabSize: 4,
      lineHeight: 'inherit',
      margin: 0,
      padding: 0,
      border: 0,
      textRendering: 'optimizeLegibility',
    },
  },
})

globalStyle(`html, body, ${DocsLayout}`, {
  fontFamily: fontFamilyVars.default,
  fontFeatureSettings: '"rlig" 1, "calt" 1',
  fontSize: fontSizeVars.root,
})

globalStyle('hr', {
  '@layer': {
    [resetLayer]: {
      height: 0,
      color: 'inherit',
      borderTopWidth: '1px',
    },
  },
})

globalStyle('abbr:where([title])', {
  '@layer': {
    [resetLayer]: {
      textDecoration: 'underline dotted',
    },
  },
})

globalStyle('h1,h2,h3,h4,h5,h6', {
  '@layer': {
    [resetLayer]: {
      fontSize: 'inherit',
      fontWeight: 'inherit',
      textWrap: 'balance',
    },
  },
})

globalStyle('a', {
  '@layer': {
    [resetLayer]: {
      color: 'inherit',
      textDecoration: 'inherit',
    },
  },
})

globalStyle('b,strong', {
  '@layer': {
    [resetLayer]: {
      fontWeight: 'bolder',
    },
  },
})

globalStyle('code,kbd,samp,pre', {
  '@layer': {
    [resetLayer]: {
      fontFamily: fontFamilyVars.mono,
      fontSize: fontSizeVars.root,
    },
  },
})

globalStyle('small', {
  '@layer': {
    [resetLayer]: {
      fontSize: '80%',
    },
  },
})

globalStyle('sub,sup', {
  '@layer': {
    [resetLayer]: {
      fontSize: '75%',
      lineHeight: 0,
      position: 'relative',
      verticalAlign: 'baseline',
    },
  },
})

globalStyle('sub', {
  '@layer': {
    [resetLayer]: {
      bottom: '-0.25em',
    },
  },
})

globalStyle('sup', {
  '@layer': {
    [resetLayer]: {
      top: '-0.5em',
    },
  },
})

globalStyle('table', {
  '@layer': {
    [resetLayer]: {
      borderColor: 'inherit',
      borderCollapse: 'collapse',
      textIndent: '0',
    },
  },
})

globalStyle('button,input,optgroup,select,textarea', {
  '@layer': {
    [resetLayer]: {
      fontFamily: 'inherit',
      fontFeatureSettings: 'inherit',
      fontVariationSettings: 'inherit',
      fontSize: '100%',
      fontWeight: 'inherit',
      lineHeight: 'inherit',
      color: 'inherit',
      margin: 0,
      padding: 0,
    },
  },
})

globalStyle('button,select', {
  '@layer': {
    [resetLayer]: {
      textTransform: 'none',
    },
  },
})

globalStyle('button,select', {
  '@layer': {
    [resetLayer]: {
      appearance: 'button',
      backgroundColor: 'transparent',
      backgroundImage: 'none',
    },
  },
})

globalStyle(':-moz-focusring', {
  '@layer': {
    [resetLayer]: {
      outline: 'auto',
    },
  },
})

globalStyle(':-moz-ui-invalid', {
  '@layer': {
    [resetLayer]: {
      outline: 'auto',
    },
  },
})

globalStyle('progress', {
  '@layer': {
    [resetLayer]: {
      verticalAlign: 'baseline',
    },
  },
})

globalStyle('::-webkit-inner-spin-button, ::-webkit-outer-spin-button', {
  '@layer': {
    [resetLayer]: {
      height: 'auto',
    },
  },
})

globalStyle('[type="search"]', {
  '@layer': {
    [resetLayer]: {
      appearance: 'textfield',
      outlineOffset: '-2px',
    },
  },
})

globalStyle('::-webkit-search-decoration', {
  '@layer': {
    [resetLayer]: {
      appearance: 'none',
    },
  },
})

globalStyle('::-webkit-file-upload-button', {
  '@layer': {
    [resetLayer]: {
      appearance: 'button',
      font: 'inherit',
    },
  },
})

globalStyle('summary', {
  '@layer': {
    [resetLayer]: {
      display: 'list-item',
    },
  },
})

globalStyle('blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre', {
  '@layer': {
    [resetLayer]: {
      margin: 0,
    },
  },
})

globalStyle('fieldset', {
  '@layer': {
    [resetLayer]: {
      margin: 0,
      padding: 0,
    },
  },
})

globalStyle('legend', {
  '@layer': {
    [resetLayer]: {
      padding: 0,
    },
  },
})

globalStyle('ol,ul,menu', {
  '@layer': {
    [resetLayer]: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
    },
  },
})

globalStyle('dialog', {
  '@layer': {
    [resetLayer]: {
      padding: 0,
    },
  },
})

globalStyle('textarea', {
  '@layer': {
    [resetLayer]: {
      resize: 'vertical',
    },
  },
})

globalStyle('input::placeholder,textarea::placeholder', {
  '@layer': {
    [resetLayer]: {
      opacity: 1,
    },
  },
})

globalStyle('button,[role="button"]', {
  '@layer': {
    [resetLayer]: {
      cursor: 'pointer',
    },
  },
})

globalStyle(':disabled', {
  '@layer': {
    [resetLayer]: {
      overflow: 'default',
    },
  },
})

globalStyle('img,svg,video,canvas,audio,iframe,embed,object', {
  '@layer': {
    [resetLayer]: {
      display: 'block',
      verticalAlign: 'middle',
    },
  },
})

globalStyle('img,video', {
  '@layer': {
    [resetLayer]: {
      maxWidth: '100%',
      height: 'auto',
    },
  },
})

globalStyle('[hidden]', {
  '@layer': {
    [resetLayer]: {
      display: 'none',
    },
  },
})

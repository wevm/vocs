import { globalStyle, layer } from '@vanilla-extract/css'
import { root as DocsLayout } from '../layouts/DocsLayout.css.js'
import { fontFamilyVars, fontSizeVars, primitiveColorVars } from './vars.css.js'

const resetLayer = layer('reset')

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
      // @ts-expect-error
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
  textTransform: 'none',
})

globalStyle('button,select', {
  appearance: 'button',
  backgroundColor: 'transparent',
  backgroundImage: 'none',
})

globalStyle(':-moz-focusring', {
  outline: 'auto',
})

globalStyle(':-moz-ui-invalid', {
  outline: 'auto',
})

globalStyle('progress', {
  verticalAlign: 'baseline',
})

globalStyle('::-webkit-inner-spin-button, ::-webkit-outer-spin-button', {
  height: 'auto',
})

globalStyle('[type="search"]', {
  appearance: 'textfield',
  outlineOffset: '-2px',
})

globalStyle('::-webkit-search-decoration', {
  appearance: 'none',
})

globalStyle('::-webkit-file-upload-button', {
  appearance: 'button',
  font: 'inherit',
})

globalStyle('summary', {
  display: 'list-item',
})

globalStyle('blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre', {
  margin: 0,
})

globalStyle('fieldset', {
  margin: 0,
  padding: 0,
})

globalStyle('legend', {
  padding: 0,
})

globalStyle('ol,ul,menu', {
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

globalStyle('dialog', {
  padding: 0,
})

globalStyle('textarea', {
  resize: 'vertical',
})

globalStyle('input::placeholder,textarea::placeholder', {
  opacity: 1,
})

globalStyle('button,[role="button"]', {
  cursor: 'pointer',
})

globalStyle(':disabled', {
  overflow: 'default',
})

globalStyle('img,svg,video,canvas,audio,iframe,embed,object', {
  display: 'block',
  verticalAlign: 'middle',
})

globalStyle('img,video', {
  maxWidth: '100%',
  height: 'auto',
})

globalStyle('[hidden]', {
  display: 'none',
})

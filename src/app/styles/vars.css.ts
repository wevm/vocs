import * as globalColors from '@radix-ui/colors'
import { createGlobalTheme, createGlobalThemeContract, globalStyle } from '@vanilla-extract/css'

const white = 'rgba(255 255 255 / 100%)'
const black = 'rgba(0 0 0 / 100%)'

export const getVarName = (scope: string) => (_: string | null, path: string[]) =>
  `vocs-${scope}_${path.join('-')}`

export const primitiveColorVars = createGlobalThemeContract(
  {
    white: 'white',
    black: 'black',
    accent: 'accent',
    accentHover: 'accentHover',
    accentTint: 'accentTint',
    background: 'background',
    background2: 'background2',
    background3: 'background3',
    background4: 'background4',
    backgroundBlueTint: 'backgroundBlueTint',
    backgroundDark: 'backgroundDark',
    backgroundGreenTint: 'backgroundGreenTint',
    backgroundIrisTint: 'backgroundIrisTint',
    backgroundRedTint: 'backgroundRedTint',
    backgroundYellowTint: 'backgroundYellowTint',
    border: 'border',
    border2: 'border2',
    borderBlue: 'borderBlue',
    borderGreen: 'borderGreen',
    borderIris: 'borderIris',
    borderRed: 'borderRed',
    borderYellow: 'borderYellow',
    text: 'text',
    text2: 'text2',
    text3: 'text3',
    text4: 'text4',
    textBlue: 'textBlue',
    textGreen: 'textGreen',
    textIris: 'textIris',
    textRed: 'textRed',
    textYellow: 'textYellow',
  },
  getVarName('color'),
)
createGlobalTheme(':root', primitiveColorVars, {
  white,
  black,
  accent: globalColors.iris.iris11,
  accentHover: globalColors.iris.iris12,
  accentTint: globalColors.iris.iris3,
  background: white,
  background2: globalColors.gray.gray2,
  background3: globalColors.gray.gray3,
  background4: globalColors.gray.gray4,
  backgroundBlueTint: globalColors.blueA.blueA2,
  backgroundDark: globalColors.gray.gray2,
  backgroundGreenTint: globalColors.greenA.greenA2,
  backgroundIrisTint: globalColors.irisA.irisA2,
  backgroundRedTint: globalColors.redA.redA2,
  backgroundYellowTint: globalColors.yellowA.yellowA2,
  border: globalColors.blackA.blackA1,
  border2: globalColors.gray.gray7,
  borderBlue: globalColors.blueA.blueA4,
  borderGreen: globalColors.greenA.greenA5,
  borderIris: globalColors.iris.iris5,
  borderRed: globalColors.redA.redA4,
  borderYellow: globalColors.yellowA.yellowA5,
  text: globalColors.gray.gray12,
  text2: globalColors.gray.gray11,
  text3: globalColors.gray.gray10,
  text4: globalColors.gray.gray8,
  textBlue: globalColors.blue.blue11,
  textGreen: globalColors.green.green11,
  textIris: globalColors.iris.iris11,
  textRed: globalColors.red.red11,
  textYellow: globalColors.yellow.yellow11,
})
createGlobalTheme(':root.dark', primitiveColorVars, {
  white,
  black,
  accent: globalColors.irisDark.iris11,
  accentHover: globalColors.irisDark.iris10,
  accentTint: globalColors.irisDark.iris3,
  background: globalColors.mauveDark.mauve3,
  background2: globalColors.mauveDark.mauve4,
  background3: globalColors.mauveDark.mauve5,
  background4: globalColors.mauveDark.mauve6,
  backgroundBlueTint: globalColors.blueA.blueA3,
  backgroundDark: '#1e1d1f',
  backgroundGreenTint: globalColors.greenA.greenA3,
  backgroundIrisTint: globalColors.irisA.irisA4,
  backgroundRedTint: globalColors.redA.redA3,
  backgroundYellowTint: globalColors.yellowA.yellowA2,
  border: globalColors.mauveDark.mauve5,
  border2: globalColors.mauveDark.mauve9,
  borderBlue: globalColors.blueA.blueA4,
  borderGreen: globalColors.greenA.greenA5,
  borderIris: globalColors.irisDark.iris5,
  borderRed: globalColors.redA.redA4,
  borderYellow: globalColors.yellowA.yellowA2,
  text: '#e9e9ea',
  text2: '#bdbdbe',
  text3: '#a7a7a8',
  text4: '#656567',
  textBlue: globalColors.blueDark.blue11,
  textGreen: globalColors.greenDark.green11,
  textIris: globalColors.irisDark.iris11,
  textRed: globalColors.redDark.red11,
  textYellow: globalColors.yellowDark.yellow11,
})

export const semanticColorVars = createGlobalThemeContract(
  {
    blockquoteBorder: 'blockquoteBorder',
    blockquoteText: 'blockquoteText',

    dangerBackground: 'dangerBackground',
    dangerBorder: 'dangerBorder',
    dangerText: 'dangerText',
    infoBackground: 'infoBackground',
    infoBorder: 'infoBorder',
    infoText: 'infoText',
    noteBackground: 'noteBackground',
    noteBorder: 'noteBorder',
    noteText: 'noteText',
    successBackground: 'successBackground',
    successBorder: 'successBorder',
    successText: 'successText',
    tipBackground: 'tipBackground',
    tipBorder: 'tipBorder',
    tipText: 'tipText',
    warningBackground: 'warningBackground',
    warningBorder: 'warningBorder',
    warningText: 'warningText',

    inlineCode: 'inlineCode',
    inlineCodeBackground: 'inlineCodeBackground',
    codeBlockBackground: 'codeBlockBackground',
    codeHighlightBackground: 'codeHighlightBackground',
    codeHighlightBorder: 'codeHighlightBorder',
    lineNumber: 'lineNumber',

    hr: 'hr',

    link: 'link',
    linkHover: 'linkHover',

    tableBorder: 'tableBorder',
    tableHeaderBackground: 'tableHeaderBackground',
    tableHeaderText: 'tableHeaderText',
  },
  getVarName('color'),
)
createGlobalTheme(':root', semanticColorVars, {
  blockquoteBorder: primitiveColorVars.border,
  blockquoteText: primitiveColorVars.text3,
  dangerBackground: primitiveColorVars.backgroundRedTint,
  dangerBorder: primitiveColorVars.borderRed,
  dangerText: primitiveColorVars.textRed,
  infoBackground: primitiveColorVars.backgroundBlueTint,
  infoBorder: primitiveColorVars.borderBlue,
  infoText: primitiveColorVars.textBlue,
  noteBackground: primitiveColorVars.background2,
  noteBorder: primitiveColorVars.border,
  noteText: primitiveColorVars.text2,
  successBackground: primitiveColorVars.backgroundGreenTint,
  successBorder: primitiveColorVars.borderGreen,
  successText: primitiveColorVars.textGreen,
  tipBackground: primitiveColorVars.backgroundIrisTint,
  tipBorder: primitiveColorVars.borderIris,
  tipText: primitiveColorVars.textIris,
  warningBackground: primitiveColorVars.backgroundYellowTint,
  warningBorder: primitiveColorVars.borderYellow,
  warningText: primitiveColorVars.textYellow,
  inlineCode: primitiveColorVars.accent,
  inlineCodeBackground: primitiveColorVars.accentTint,
  codeBlockBackground: primitiveColorVars.background2,
  codeHighlightBackground: primitiveColorVars.background3,
  codeHighlightBorder: primitiveColorVars.border2,
  lineNumber: primitiveColorVars.text4,
  hr: primitiveColorVars.border,
  link: primitiveColorVars.accent,
  linkHover: primitiveColorVars.accentHover,
  tableBorder: primitiveColorVars.border,
  tableHeaderBackground: primitiveColorVars.background2,
  tableHeaderText: primitiveColorVars.text2,
})

export const borderRadiusVars = createGlobalThemeContract(
  {
    '0': '0',
    '2': '2',
    '4': '4',
  },
  getVarName('borderRadius'),
)
createGlobalTheme(':root', borderRadiusVars, {
  '0': '0',
  '2': '2px',
  '4': '4px',
})

export const fontFamilyVars = createGlobalThemeContract(
  {
    default: 'default',
    mono: 'mono',
  },
  getVarName('fontFamily'),
)
createGlobalTheme(':root', fontFamilyVars, {
  default:
    "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
})

export const fontSizeVars = createGlobalThemeContract(
  {
    root: 'root',
    '9': '9',
    '11': '11',
    '12': '12',
    '14': '14',
    '15': '15',
    '16': '16',
    '18': '18',
    '20': '20',
    '24': '24',
    '32': '32',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    code: 'code',
    codeBlock: 'codeBlock',
    lineNumber: 'lineNumber',
    subtitle: 'subtitle',
    th: 'th',
    td: 'td',
  },
  getVarName('fontSize'),
)
createGlobalTheme(':root', fontSizeVars, {
  root: '16px',
  '9': '0.5625rem',
  '11': '0.6875rem',
  '12': '0.75rem',
  '14': '0.875rem',
  '15': '0.9375rem',
  '16': '1rem',
  '18': '1.125rem',
  '20': '1.25rem',
  '24': '1.5rem',
  '32': '2rem',
  h1: fontSizeVars['32'],
  h2: fontSizeVars['24'],
  h3: fontSizeVars['20'],
  h4: fontSizeVars['18'],
  h5: fontSizeVars['16'],
  h6: fontSizeVars['16'],
  code: '0.9375em',
  codeBlock: fontSizeVars['15'],
  lineNumber: fontSizeVars['15'],
  subtitle: fontSizeVars['20'],
  th: fontSizeVars['14'],
  td: fontSizeVars['14'],
})

export const fontWeightVars = createGlobalThemeContract(
  {
    regular: 'regular',
    medium: 'medium',
    semibold: 'semibold',
  },
  getVarName('fontWeight'),
)
createGlobalTheme(':root', fontWeightVars, {
  regular: '300',
  medium: '400',
  semibold: '500',
})

export const lineHeightVars = createGlobalThemeContract(
  {
    code: 'code',
    heading: 'heading',
    listItem: 'listItem',
    paragraph: 'paragraph',
    sidebarItem: 'sidebarItem',
  },
  getVarName('lineHeight'),
)
createGlobalTheme(':root', lineHeightVars, {
  code: '1.75em',
  heading: '1.25em',
  listItem: '2.25em',
  paragraph: '1.75em',
  sidebarItem: '1.825em',
})

export const spaceVars = createGlobalThemeContract(
  {
    '0': '0',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '6': '6',
    '8': '8',
    '12': '12',
    '14': '14',
    '16': '16',
    '18': '18',
    '20': '20',
    '22': '22',
    '24': '24',
    '28': '28',
    '32': '32',
    '40': '40',
    '48': '48',
    '56': '56',
    '64': '64',
    '72': '72',
    '80': '80',
  },
  getVarName('space'),
)
createGlobalTheme(':root', spaceVars, {
  '0': '0px',
  '1': '1px',
  '2': '0.125rem',
  '3': '0.1875rem',
  '4': '0.25rem',
  '6': '0.375rem',
  '8': '0.5rem',
  '12': '0.75rem',
  '14': '0.875rem',
  '16': '1rem',
  '18': '1.125rem',
  '20': '1.25rem',
  '22': '1.375rem',
  '24': '1.5rem',
  '28': '1.75rem',
  '32': '2rem',
  '40': '2.5rem',
  '48': '3rem',
  '56': '3.5rem',
  '64': '4rem',
  '72': '4.5rem',
  '80': '5rem',
})

export const viewportVars = {
  'max-720px': 'screen and (width <= 720px)',
  'max-1080px': 'screen and (width <= 1080px)',
}

export const zIndexVars = createGlobalThemeContract(
  {
    backdrop: 'backdrop',
    drawer: 'drawer',
    gutterLeft: 'gutterLeft',
    gutterTop: 'gutterTop',
    surface: 'surface',
  },
  getVarName('zIndex'),
)
createGlobalTheme(':root', zIndexVars, {
  backdrop: '69420',
  drawer: '69421',
  gutterLeft: '3',
  gutterTop: '2',
  surface: '1',
})

/////////////////////////////////////////////////////////////////////
// Misc.

export const contentVars = createGlobalThemeContract(
  {
    horizontalPadding: 'horizontalPadding',
    verticalPadding: 'verticalPadding',
    width: 'width',
  },
  getVarName('content'),
)
createGlobalTheme(':root', contentVars, {
  horizontalPadding: spaceVars['48'],
  verticalPadding: spaceVars['80'],
  width: `calc(70ch + (${contentVars.horizontalPadding} * 2))`,
})

export const sidebarVars = createGlobalThemeContract(
  {
    horizontalPadding: 'horizontalPadding',
    width: 'width',
  },
  getVarName('sidebar'),
)
createGlobalTheme(':root', sidebarVars, {
  horizontalPadding: spaceVars['24'],
  width: '300px',
})

export const topNavVars = createGlobalThemeContract(
  {
    upperHeight: 'upperHeight',
    lowerHeight: 'lowerHeight',
  },
  getVarName('topNav'),
)
createGlobalTheme(':root', topNavVars, {
  upperHeight: '60px',
  lowerHeight: '40px',
})

globalStyle(':root', {
  '@media': {
    [viewportVars['max-1080px']]: {
      vars: {
        [contentVars.verticalPadding]: spaceVars['48'],
        [contentVars.horizontalPadding]: spaceVars['24'],
        [sidebarVars.horizontalPadding]: spaceVars['24'],
      },
    },
    [viewportVars['max-720px']]: {
      vars: {
        [contentVars.horizontalPadding]: spaceVars['16'],
        [contentVars.verticalPadding]: spaceVars['32'],
        [sidebarVars.horizontalPadding]: spaceVars['16'],
      },
    },
  },
})

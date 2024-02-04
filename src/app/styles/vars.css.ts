import * as globalColors from '@radix-ui/colors'
import { createGlobalTheme, createGlobalThemeContract, globalStyle } from '@vanilla-extract/css'

const white = 'rgba(255 255 255 / 100%)'
const black = 'rgba(0 0 0 / 100%)'

const getVarName = (scope: string) => (_: string | null, path: string[]) =>
  `vocs-${scope}_${path.join('-')}`

export const primitiveColorVars = createGlobalThemeContract(
  {
    white: 'white',
    black: 'black',
    background: 'background',
    background2: 'background2',
    background3: 'background3',
    background4: 'background4',
    background5: 'background5',
    backgroundAccent: 'backgroundAccent',
    backgroundAccentHover: 'backgroundAccentHover',
    backgroundAccentText: 'backgroundAccentText',
    backgroundBlueTint: 'backgroundBlueTint',
    backgroundDark: 'backgroundDark',
    backgroundGreenTint: 'backgroundGreenTint',
    backgroundGreenTint2: 'backgroundGreenTint2',
    backgroundIrisTint: 'backgroundIrisTint',
    backgroundRedTint: 'backgroundRedTint',
    backgroundRedTint2: 'backgroundRedTint2',
    backgroundYellowTint: 'backgroundYellowTint',
    border: 'border',
    border2: 'border2',
    borderAccent: 'borderAccent',
    borderBlue: 'borderBlue',
    borderGreen: 'borderGreen',
    borderIris: 'borderIris',
    borderRed: 'borderRed',
    borderYellow: 'borderYellow',
    heading: 'heading',
    inverted: 'inverted',
    shadow: 'shadow',
    shadow2: 'shadow2',
    text: 'text',
    text2: 'text2',
    text3: 'text3',
    text4: 'text4',
    textAccent: 'textAccent',
    textAccentHover: 'textAccentHover',
    textBlue: 'textBlue',
    textBlueHover: 'textBlueHover',
    textGreen: 'textGreen',
    textGreenHover: 'textGreenHover',
    textIris: 'textIris',
    textIrisHover: 'textIrisHover',
    textRed: 'textRed',
    textRedHover: 'textRedHover',
    textYellow: 'textYellow',
    textYellowHover: 'textYellowHover',
    title: 'title',
  },
  getVarName('color'),
)
createGlobalTheme(':root', primitiveColorVars, {
  white,
  black,
  background: white,
  background2: globalColors.gray.gray2,
  background3: '#f6f6f6',
  background4: globalColors.gray.gray3,
  background5: globalColors.gray.gray4,
  backgroundAccent: globalColors.iris.iris9,
  backgroundAccentHover: globalColors.iris.iris10,
  backgroundAccentText: white,
  backgroundBlueTint: globalColors.blueA.blueA2,
  backgroundDark: globalColors.gray.gray2,
  backgroundGreenTint: globalColors.greenA.greenA2,
  backgroundGreenTint2: globalColors.greenA.greenA3,
  backgroundIrisTint: globalColors.irisA.irisA2,
  backgroundRedTint: globalColors.redA.redA2,
  backgroundRedTint2: globalColors.redA.redA3,
  backgroundYellowTint: globalColors.yellowA.yellowA2,
  border: '#ececec',
  border2: globalColors.gray.gray7,
  borderAccent: globalColors.iris.iris11,
  borderBlue: globalColors.blueA.blueA4,
  borderGreen: globalColors.greenA.greenA5,
  borderIris: globalColors.iris.iris5,
  borderRed: globalColors.redA.redA4,
  borderYellow: globalColors.yellowA.yellowA5,
  heading: globalColors.gray.gray12,
  inverted: black,
  shadow: globalColors.grayA.grayA3,
  shadow2: globalColors.grayA.grayA2,
  text: '#4c4c4c',
  text2: globalColors.gray.gray11,
  text3: globalColors.gray.gray10,
  text4: globalColors.gray.gray8,
  textAccent: globalColors.iris.iris11,
  textAccentHover: globalColors.iris.iris12,
  textBlue: globalColors.blue.blue11,
  textBlueHover: globalColors.blue.blue12,
  textGreen: globalColors.green.green11,
  textGreenHover: globalColors.green.green12,
  textIris: globalColors.iris.iris11,
  textIrisHover: globalColors.iris.iris12,
  textRed: globalColors.red.red11,
  textRedHover: globalColors.red.red12,
  textYellow: globalColors.yellow.yellow11,
  textYellowHover: globalColors.yellow.yellow12,
  title: globalColors.gray.gray12,
})
createGlobalTheme(':root.dark', primitiveColorVars, {
  white,
  black,
  background: globalColors.mauveDark.mauve3,
  background2: globalColors.mauveDark.mauve4,
  background3: '#2e2c31',
  background4: globalColors.mauveDark.mauve5,
  background5: globalColors.mauveDark.mauve6,
  backgroundAccent: globalColors.irisDark.iris9,
  backgroundAccentHover: globalColors.iris.iris11,
  backgroundAccentText: white,
  backgroundBlueTint: globalColors.blueA.blueA3,
  backgroundDark: '#1e1d1f',
  backgroundGreenTint: globalColors.greenA.greenA3,
  backgroundGreenTint2: globalColors.greenA.greenA4,
  backgroundIrisTint: globalColors.irisA.irisA4,
  backgroundRedTint: globalColors.redA.redA3,
  backgroundRedTint2: globalColors.redA.redA4,
  backgroundYellowTint: globalColors.yellowA.yellowA2,
  border: globalColors.mauveDark.mauve6,
  border2: globalColors.mauveDark.mauve9,
  borderAccent: globalColors.irisDark.iris10,
  borderBlue: globalColors.blueA.blueA4,
  borderGreen: globalColors.greenA.greenA5,
  borderIris: globalColors.irisDark.iris5,
  borderRed: globalColors.redA.redA4,
  borderYellow: globalColors.yellowA.yellowA2,
  heading: '#e9e9ea',
  inverted: white,
  shadow: globalColors.grayDarkA.grayA1,
  shadow2: globalColors.blackA.blackA1,
  text: '#cfcfcf',
  text2: '#bdbdbe',
  text3: '#a7a7a8',
  text4: '#656567',
  textAccent: globalColors.irisDark.iris11,
  textAccentHover: globalColors.irisDark.iris10,
  textBlue: globalColors.blueDark.blue11,
  textBlueHover: globalColors.blueDark.blue10,
  textGreen: globalColors.greenDark.green11,
  textGreenHover: globalColors.greenDark.green10,
  textIris: globalColors.irisDark.iris11,
  textIrisHover: globalColors.irisDark.iris10,
  textRed: globalColors.redDark.red11,
  textRedHover: globalColors.redDark.red10,
  textYellow: globalColors.yellowDark.yellow11,
  textYellowHover: globalColors.amber.amber8,
  title: white,
})

export const semanticColorVars = createGlobalThemeContract(
  {
    blockquoteBorder: 'blockquoteBorder',
    blockquoteText: 'blockquoteText',

    dangerBackground: 'dangerBackground',
    dangerBorder: 'dangerBorder',
    dangerText: 'dangerText',
    dangerTextHover: 'dangerTextHover',
    infoBackground: 'infoBackground',
    infoBorder: 'infoBorder',
    infoText: 'infoText',
    infoTextHover: 'infoTextHover',
    noteBackground: 'noteBackground',
    noteBorder: 'noteBorder',
    noteText: 'noteText',
    successBackground: 'successBackground',
    successBorder: 'successBorder',
    successText: 'successText',
    successTextHover: 'successTextHover',
    tipBackground: 'tipBackground',
    tipBorder: 'tipBorder',
    tipText: 'tipText',
    tipTextHover: 'tipTextHover',
    warningBackground: 'warningBackground',
    warningBorder: 'warningBorder',
    warningText: 'warningText',
    warningTextHover: 'warningTextHover',

    codeBlockBackground: 'codeBlockBackground',
    codeCharacterHighlightBackground: 'codeCharacterHighlightBackground',
    codeHighlightBackground: 'codeHighlightBackground',
    codeHighlightBorder: 'codeHighlightBorder',
    codeInlineBackground: 'codeInlineBackground',
    codeInlineBorder: 'codeInlineBorder',
    codeInlineText: 'codeInlineText',
    codeTitleBackground: 'codeTitleBackground',
    lineNumber: 'lineNumber',

    hr: 'hr',

    link: 'link',
    linkHover: 'linkHover',

    searchHighlightBackground: 'searchHighlightBackground',
    searchHighlightText: 'searchHighlightText',

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
  dangerTextHover: primitiveColorVars.textRedHover,
  infoBackground: primitiveColorVars.backgroundBlueTint,
  infoBorder: primitiveColorVars.borderBlue,
  infoText: primitiveColorVars.textBlue,
  infoTextHover: primitiveColorVars.textBlueHover,
  noteBackground: primitiveColorVars.background2,
  noteBorder: primitiveColorVars.border,
  noteText: primitiveColorVars.text2,
  successBackground: primitiveColorVars.backgroundGreenTint,
  successBorder: primitiveColorVars.borderGreen,
  successText: primitiveColorVars.textGreen,
  successTextHover: primitiveColorVars.textGreenHover,
  tipBackground: primitiveColorVars.backgroundIrisTint,
  tipBorder: primitiveColorVars.borderIris,
  tipText: primitiveColorVars.textIris,
  tipTextHover: primitiveColorVars.textIrisHover,
  warningBackground: primitiveColorVars.backgroundYellowTint,
  warningBorder: primitiveColorVars.borderYellow,
  warningText: primitiveColorVars.textYellow,
  warningTextHover: primitiveColorVars.textYellowHover,
  codeBlockBackground: primitiveColorVars.background2,
  codeCharacterHighlightBackground: primitiveColorVars.background5,
  codeHighlightBackground: primitiveColorVars.background4,
  codeHighlightBorder: primitiveColorVars.border2,
  codeInlineBackground: primitiveColorVars.background4,
  codeInlineBorder: primitiveColorVars.border,
  codeInlineText: primitiveColorVars.textAccent,
  codeTitleBackground: primitiveColorVars.background4,
  lineNumber: primitiveColorVars.text4,
  hr: primitiveColorVars.border,
  link: primitiveColorVars.textAccent,
  linkHover: primitiveColorVars.textAccentHover,
  searchHighlightBackground: primitiveColorVars.borderAccent,
  searchHighlightText: primitiveColorVars.background,
  tableBorder: primitiveColorVars.border,
  tableHeaderBackground: primitiveColorVars.background2,
  tableHeaderText: primitiveColorVars.text2,
})

export const borderRadiusVars = createGlobalThemeContract(
  {
    '0': '0',
    '2': '2',
    '3': '3',
    '4': '4',
    '6': '6',
    '8': '8',
  },
  getVarName('borderRadius'),
)
createGlobalTheme(':root', borderRadiusVars, {
  '0': '0',
  '2': '2px',
  '3': '3px',
  '4': '4px',
  '6': '6px',
  '8': '8px',
})

export const defaultFontFamily = {
  default:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
}
export const fontFamilyVars = createGlobalThemeContract(
  {
    default: 'default',
    mono: 'mono',
  },
  getVarName('fontFamily'),
)
createGlobalTheme(':root', fontFamilyVars, {
  default: defaultFontFamily.default,
  mono: defaultFontFamily.mono,
})

export const fontSizeVars = createGlobalThemeContract(
  {
    root: 'root',
    '9': '9',
    '11': '11',
    '12': '12',
    '13': '13',
    '14': '14',
    '15': '15',
    '16': '16',
    '18': '18',
    '20': '20',
    '24': '24',
    '32': '32',
    '64': '64',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    calloutCodeBlock: 'calloutCodeBlock',
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
  '13': '0.8125rem',
  '14': '0.875rem',
  '15': '0.9375rem',
  '16': '1rem',
  '18': '1.125rem',
  '20': '1.25rem',
  '24': '1.5rem',
  '32': '2rem',
  '64': '3rem',
  h1: fontSizeVars['32'],
  h2: fontSizeVars['24'],
  h3: fontSizeVars['20'],
  h4: fontSizeVars['18'],
  h5: fontSizeVars['16'],
  h6: fontSizeVars['16'],
  calloutCodeBlock: '0.8em',
  code: '0.875em',
  codeBlock: fontSizeVars['14'],
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
    outlineItem: 'outlineItem',
    paragraph: 'paragraph',
    sidebarItem: 'sidebarItem',
  },
  getVarName('lineHeight'),
)
createGlobalTheme(':root', lineHeightVars, {
  code: '1.75em',
  heading: '1.5em',
  listItem: '1.5em',
  outlineItem: '1em',
  paragraph: '1.75em',
  sidebarItem: '1.375em',
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
    '36': '36',
    '40': '40',
    '44': '44',
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
  '36': '2.25rem',
  '40': '2.5rem',
  '44': '2.75rem',
  '48': '3rem',
  '56': '3.5rem',
  '64': '4rem',
  '72': '4.5rem',
  '80': '5rem',
})

export const viewportVars = {
  'max-480px': 'screen and (width <= 480px)',
  'min-480px': 'screen and (width > 480px)',
  'max-720px': 'screen and (width <= 720px)',
  'min-720px': 'screen and (width > 720px)',
  'max-1080px': 'screen and (width <= 1080px)',
  'min-1080px': 'screen and (width > 1080px)',
  'max-1280px': 'screen and (width <= 1280px)',
  'min-1280px': 'screen and (width > 1280px)',
}

export const zIndexVars = createGlobalThemeContract(
  {
    backdrop: 'backdrop',
    drawer: 'drawer',
    gutterLeft: 'gutterLeft',
    gutterRight: 'gutterRight',
    gutterTop: 'gutterTop',
    gutterTopCurtain: 'gutterTopCurtain',
    popover: 'popover',
    surface: 'surface',
  },
  getVarName('zIndex'),
)
createGlobalTheme(':root', zIndexVars, {
  backdrop: '69420',
  drawer: '69421',
  gutterRight: '11',
  gutterLeft: '14',
  gutterTop: '13',
  gutterTopCurtain: '12',
  popover: '69422',
  surface: '10',
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
  verticalPadding: spaceVars['32'],
  width: `calc(70ch + (${contentVars.horizontalPadding} * 2))`,
})

export const outlineVars = createGlobalThemeContract(
  {
    width: 'width',
  },
  getVarName('outline'),
)
createGlobalTheme(':root', outlineVars, {
  width: '280px',
})

export const sidebarVars = createGlobalThemeContract(
  {
    horizontalPadding: 'horizontalPadding',
    verticalPadding: 'verticalPadding',
    width: 'width',
  },
  getVarName('sidebar'),
)
createGlobalTheme(':root', sidebarVars, {
  horizontalPadding: spaceVars['24'],
  verticalPadding: spaceVars['0'],
  width: '300px',
})

export const topNavVars = createGlobalThemeContract(
  {
    height: 'height',
    horizontalPadding: 'horizontalPadding',
    curtainHeight: 'curtainHeight',
  },
  getVarName('topNav'),
)
createGlobalTheme(':root', topNavVars, {
  height: '60px',
  horizontalPadding: contentVars.horizontalPadding,
  curtainHeight: '40px',
})

globalStyle(':root', {
  '@media': {
    [viewportVars['max-1080px']]: {
      vars: {
        [contentVars.verticalPadding]: spaceVars['48'],
        [contentVars.horizontalPadding]: spaceVars['24'],
        [sidebarVars.horizontalPadding]: spaceVars['16'],
        [sidebarVars.verticalPadding]: spaceVars['16'],
        [sidebarVars.width]: '300px',
        [topNavVars.height]: '48px',
      },
    },
    [viewportVars['max-720px']]: {
      vars: {
        [contentVars.horizontalPadding]: spaceVars['16'],
        [contentVars.verticalPadding]: spaceVars['32'],
      },
    },
  },
})

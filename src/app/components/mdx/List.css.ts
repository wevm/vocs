import { globalStyle, style } from '@vanilla-extract/css'

import { spaceVars } from '../../styles/vars.css.js'
import { root as H2 } from './H2.css.js'
import { root as H3 } from './H3.css.js'
import { root as H4 } from './H4.css.js'
import { root as H5 } from './H5.css.js'
import { root as H6 } from './H6.css.js'

export const root = style({
  selectors: {
    [`${H2}+&,${H3}+&,${H4}+&,${H5}+&,${H6}+&`]: {
      marginTop: `calc(${spaceVars['8']} * -1)`,
    },
    '.vocs_Paragraph + &': {
      marginTop: `calc(-1 * ${spaceVars['8']})`,
    },
  },
})

export const ordered = style(
  {
    listStyle: 'decimal',
    paddingLeft: spaceVars['20'],
    marginBottom: spaceVars['16'],
    selectors: {
      '& &': {
        listStyle: 'lower-alpha',
      },
      '& & &': {
        listStyle: 'lower-roman',
      },
    },
  },
  'ordered',
)

export const unordered = style(
  {
    listStyle: 'disc',
    paddingLeft: spaceVars['24'],
    marginBottom: spaceVars['16'],
    selectors: {
      '& &': {
        listStyle: 'circle',
      },
    },
  },
  'unordered',
)

globalStyle(
  [
    `${ordered} ${ordered}`,
    `${unordered} ${unordered}`,
    `${ordered} ${unordered}`,
    `${unordered} ${ordered}`,
  ].join(','),
  {
    marginBottom: spaceVars['0'],
    paddingTop: spaceVars['8'],
    paddingLeft: spaceVars['16'],
    paddingBottom: spaceVars['0'],
  },
)

globalStyle(`${unordered}.contains-task-list`, {
  listStyle: 'none',
  paddingLeft: spaceVars['12'],
})

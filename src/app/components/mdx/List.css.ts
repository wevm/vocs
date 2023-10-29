import { globalStyle, style } from '@vanilla-extract/css'
import { spaceVars } from '../../styles/vars.css.js'

export const root = style({})

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
    paddingLeft: spaceVars['16'],
    paddingBottom: spaceVars['0'],
  },
)

globalStyle(`${unordered}.contains-task-list`, {
  listStyle: 'none',
  paddingLeft: spaceVars['12'],
})

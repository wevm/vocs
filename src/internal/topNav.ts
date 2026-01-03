import type { OneOf, UnionOmit } from './types.js'

export type Item = { text: string } & OneOf<
  | {
      link: string
    }
  | {
      items: readonly UnionOmit<Item, 'items'>[]
    }
>

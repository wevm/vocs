---
name: ui-engineering
description: Expert UI engineer for Base UI, Tailwind CSS, and React components. Use when building or modifying React UI components, implementing Base UI patterns, styling with Tailwind, or ensuring accessibility compliance.
---

# UI Engineering

Expert guidance for building accessible, performant, and composable React UI components using Base UI and Tailwind CSS.

## Core Principles

1. **Accessibility first** – All components must be keyboard navigable, screen reader friendly, and follow ARIA best practices
2. **Composability** – Build small, focused components that compose well together
3. **Performance** – Minimize re-renders, use proper memoization, prefer server components when possible
4. **Consistency** – Follow established patterns and conventions in the codebase

## Base UI Patterns

### Component Import

Import Base UI components from their specific paths for tree-shaking:

```tsx
import { Dialog } from '@base-ui/react/dialog'
import { Menu } from '@base-ui/react/menu'
import { NavigationMenu } from '@base-ui/react/navigation-menu'
import { Popover } from '@base-ui/react/popover'
import { Tabs } from '@base-ui/react/tabs'
```

### Component Assembly

Base UI uses a compound component pattern. Assemble parts within a Root:

```tsx
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Popup>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>
```

### Custom Element Composition

Use the `render` prop to compose with custom components (e.g., framework links):

```tsx
<Menu.Item
  render={<Link to="/path" />}
>
  Link Text
</Menu.Item>
```

For type mismatches with required props, use `@ts-expect-error`:

```tsx
// @ts-expect-error
render={<Link to={path} unstable_prefetchOnView />}
```

### Animation

Use CSS transitions with Base UI's data attributes:

```tsx
className="vocs:transition-all vocs:duration-75 vocs:opacity-100 vocs:scale-100 vocs:data-starting-style:opacity-0 vocs:data-starting-style:scale-90"
```

Key animation attributes:
- `data-starting-style` – Initial state when opening
- `data-ending-style` – Final state when closing
- `data-open` / `data-closed` – Current open state

Use `origin-(--transform-origin)` for proper scale transform origin.

### State Styling

**Prefer data attributes over conditional classnames with `cx`** for boolean states. This keeps classnames static and readable:

```tsx
// ✗ Avoid conditional classnames for state
className={cx(
  'vocs:px-4 vocs:py-2',
  selected ? 'vocs:bg-accenta3' : 'vocs:bg-surface',
)}

// ✓ Use data attributes with Tailwind data-* variants
<li
  data-selected={selected}
  className="vocs:px-4 vocs:py-2 vocs:bg-surface vocs:data-[selected=true]:bg-accenta3"
>
```

For child elements that need to respond to parent state, use `group` and `group-data-*`:

```tsx
<li data-selected={selected} className="vocs:group">
  <Icon className="vocs:text-secondary vocs:group-data-[selected=true]:text-accent7" />
</li>
```

Base UI components provide data attributes automatically:

```tsx
className="vocs:data-checked:text-accent8 vocs:data-popup-open:rotate-180"
```

Reserve `cx` for merging external classNames or combining unrelated class groups:

```tsx
className={cx('vocs:flex vocs:items-center', className)}
```

### Controlled Components

For coordinating multiple components (e.g., closing a dialog from a menu):

```tsx
const [open, setOpen] = React.useState(false)

<Dialog.Root open={open} onOpenChange={setOpen}>
  {/* ... */}
  <Menu.RadioItem
    closeOnClick
    onClick={() => setOpen(false)}
  />
</Dialog.Root>
```

## Tailwind CSS Conventions

### Prefix All Classes

Use `vocs:` prefix for all Tailwind classes to isolate the design system:

```tsx
className="vocs:flex vocs:items-center vocs:text-heading vocs:px-2 vocs:py-1.5"
```

### Semantic Color Tokens

Use semantic color tokens, not raw colors:

| Token | Usage |
|-------|-------|
| `text-heading` | Primary headings, emphasized text |
| `text-primary` | Body text (use `/80` for muted) |
| `text-secondary` | Secondary/muted text |
| `text-accent6` / `text-accent7` / `text-accent8` | Accent colors (increasing intensity) |
| `bg-surface` | Surface backgrounds (cards, popups) |
| `bg-primary` | Primary background |
| `bg-accenta3` | Subtle accent background |
| `border-primary` | Standard borders |

### Common Patterns

Interactive elements:
```tsx
className="vocs:cursor-pointer vocs:hover:text-heading"
```

Popups/Dropdowns:
```tsx
className="vocs:bg-surface vocs:border vocs:border-primary vocs:p-2 vocs:rounded-lg vocs:shadow-lg/5"
```

Transitions:
```tsx
className="vocs:transition-all vocs:duration-75"
className="vocs:transition-transform vocs:duration-150"
className="vocs:transition-opacity vocs:duration-200"
```

### Layout Concerns

Place styles that affect the **outside** of a component on layout containers, not on reusable components. This includes:
- **Borders** – avoid doubled borders when components are adjacent
- **Margins** – let the layout control spacing between components (see [Margin considered harmful](https://mxstbr.com/thoughts/margin))
- **Responsive visibility** – layouts decide when to show/hide components

Padding is fine inside components since it affects internal spacing only.

```tsx
// ✗ Don't put external concerns in reusable components
function Pagination() {
  return <nav className="vocs:border-t vocs:mt-8 vocs:max-sm:hidden">...</nav>
}

// ✓ Put external concerns on the layout wrapper
<div className="vocs:border-t vocs:border-primary vocs:mt-8 vocs:max-sm:hidden">
  <Pagination />
</div>
```

### CSS Variables

Reference CSS variables using parentheses:

```tsx
className="vocs:w-(--anchor-width) vocs:origin-(--transform-origin)"
```

## React Component Patterns

### File Conventions

| Suffix | Usage |
|--------|-------|
| `.tsx` | Server components (default) |
| `.client.tsx` | Client components with `'use client'` |
| `.mdx.tsx` | MDX-injected components |

### Props Pattern

Use `declare namespace` for component props:

```tsx
export function MyComponent(props: MyComponent.Props) {
  const { className } = props
  // ...
}

export declare namespace MyComponent {
  export type Props = {
    className?: string | undefined
  }
}
```

### Internal Components

Internal/child components should use short names without duplicating the parent module name. If theoretically exported, they would be accessed as `ParentModule.ChildName`:

```tsx
// ✗ Don't duplicate the module name
function ThemeOption(props: ThemeOption.Props) { ... }

// ✓ Use short names – would be ThemeToggle.Option if exported
function Option(props: Option.Props) { ... }
```

Biome mistakenly thinks internal components are unused, so add biome-ignore:

```tsx
// biome-ignore lint/correctness/noUnusedVariables: _
function Option(props: Option.Props) {
  // ...
}

declare namespace Option {
  type Props = { /* ... */ }
}
```

### Memoization

Use `React.useMemo` for computed values:

```tsx
const items = React.useMemo(() => parseItems(config, path), [config, path])

const activeItem = React.useMemo(() => {
  for (const item of items) {
    if (item.active) return item
  }
  return items[0]
}, [items])
```

### Conditional Class Names

Use `cx` from `cva` for conditional classes:

```tsx
import { cx } from 'cva'

className={cx(
  'vocs:flex vocs:items-center',
  className,
)}
```

## Imports

### Module Imports

Import internal modules with namespace style:

```tsx
import * as TopNav_core from '../../internal/topNav.js'
import * as Sidebar from './Sidebar.js'
```

### Icon Imports

Import Lucide icons from unplugin-icons:

```tsx
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideX from '~icons/lucide/x'
```

## Performance Checklist

- [ ] Prefer server components – only use `'use client'` when necessary
- [ ] Memoize expensive computations with `React.useMemo`
- [ ] Avoid inline object/array literals in props (causes re-renders)
- [ ] Use `React.useCallback` for event handlers passed to children
- [ ] Avoid unnecessary state – derive values when possible
- [ ] Keep component trees shallow to minimize reconciliation
- [ ] Use CSS transitions over JavaScript animations
- [ ] Lazy load heavy components with `React.lazy` when appropriate
- [ ] Avoid layout thrashing – batch DOM reads/writes
- [ ] Use `unstable_prefetchOnView` on links for preloading

## Accessibility Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus states are visible
- [ ] Screen reader labels exist (use `sr-only` class for visually hidden text)
- [ ] ARIA roles are appropriate
- [ ] Color contrast meets WCAG guidelines
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Dialogs trap focus and restore on close
- [ ] Menu items are navigable with arrow keys

## Common Base UI Components

| Component | Use Case |
|-----------|----------|
| `Dialog` | Modals, slide-out panels |
| `Menu` | Dropdown menus, context menus |
| `NavigationMenu` | Top-level navigation with dropdowns |
| `Popover` | Tooltips, hover cards |
| `Tabs` | Tabbed interfaces |
| `Accordion` | Expandable sections |
| `Select` | Custom select dropdowns |

## Documentation

Refer to Base UI documentation for detailed component APIs:
- Quick start: https://base-ui.com/react/overview/quick-start.md
- Styling: https://base-ui.com/react/handbook/styling.md
- Animation: https://base-ui.com/react/handbook/animation.md
- Composition: https://base-ui.com/react/handbook/composition.md
- Component APIs: https://base-ui.com/react/components/{component-name}.md

# scc — Scoped Cascade CSS

A **no-build, no-magic** CSS microframework. It styles semantic HTML with the
**native** primitives of the platform (`@layer`, `@scope`, custom properties,
`color-mix()`, `light-dark()`) instead of tooling (Sass/PostCSS/Tailwind) or
patch conventions (BEM).

It's the styling layer of a no-magic stack alongside
[Lumen](https://github.com/dragones-tech/lumen) (vanilla-JS UI) and
[Agogo](https://github.com/dragones-tech/agogo) (server-rendered HTML in Go).

**▶ Live demo: <https://dragones-tech.github.io/scc/>** — every component, live, with
its code; a token customizer; light/dark and theme switches; EN/ES.

## Golden rule

> If a class/attribute in the HTML describes **how something looks**, it's wrong.
> If it describes **what it is** or **what intent** it has, it's right.

```html
<!-- ✗ utility-first: appearance leaks into the markup -->
<article class="rounded-lg shadow p-6 bg-white">…</article>

<!-- ✓ scc: the HTML says what it is; the style lives in the CSS -->
<article class="card">
  <h2>Title</h2>
  <p>Text…</p>
</article>
```

## Usage

```html
<link rel="stylesheet" href="scc.css">
```

No npm, no compiling. The demo under `demo/` is a small SPA built with
[Lumen](https://github.com/dragones-tech/lumen) (vendored, no build) that showcases
the whole stack — [see it live](https://dragones-tech.github.io/scc/), or run it from
a static server (ES modules need HTTP, not `file://`):

```sh
python3 -m http.server   # then open http://localhost:8000/demo/
```

## Architecture

Six cascade layers, from lowest to highest priority:

`reset` → `theme` → `tokens` → `base` → `components` → `utilities`

- **theme.css** — the knobs. **Your file**: edit or copy it to create your site.
- **tokens.css** — the full scale derived from `theme.css` (`calc()`); no need to touch it.
- **components/** — one file per component, each in its own `@scope`.
- Variants via `[data-variant]`, state via native pseudo-classes.

## Components

28 components, each marked by the most semantic selector that identifies it. A few
need a little JS (or your view layer) for behavior; everything else is pure CSS.
Full reference in [`llms-full.txt`](./llms-full.txt).

| Group | Components |
|---|---|
| **Form & input** | `input`/`textarea`, `select`, `field`, checkbox/radio, `switch`, `button` |
| **Layout & containers** | `hero`, `card`, `table`, `accordion`, `dialog` |
| **Navigation** | `navbar`, `tabs`, `menu`, `breadcrumb`, `pagination` |
| **Feedback & status** | `alert`, `toast`, `badge`, `chip`, `tooltip`, `progress`, `meter`, `skeleton`, `spinner` |
| **Primitives** | `avatar`, `kbd`, `divider` |

The marker is the most semantic thing that *unambiguously* identifies the
component: the element itself when it maps 1:1 (`<button>`, `<dialog>`, `<table>`),
a native role (`[role="tablist"]`), an intent attribute (`[data-tooltip]`), or one
class when there's no element (`.card`). Use a bare element only when it's
unambiguous — `<button>` is, `<nav>` isn't (so the bar is `.navbar`).

### Make your own

Copy [`components/_template.css`](./components/_template.css) and follow
**[GUIDE.md](./GUIDE.md)** — a start-to-finish authoring walkthrough (choose the
marker → scaffold → tokens → variants/states → override pattern → register) with a
worked example and a checklist.

## Themes — the theme is the starting point

> No two sites should look alike.

A theme isn't a finished look: it's a control panel. Change a few knobs in
`theme.css` (`--accent`, `--ratio`, `--neutral-hue`, `--radius`…) and the type
scale, spacing rhythm and even the gray tint are recomputed.

**Two orthogonal axes** (don't mix them), and they **compose**:

| Attribute | Axis | Values |
|---|---|---|
| `data-mode` | **Mode** (light) | `light` · `dark` · absent = auto (OS) |
| `data-theme` | **Theme** (identity) | `sunset` · … · absent = default |

```html
<html data-mode="dark">          <!-- dark mode -->
  <section data-theme="sunset"> <!-- + sunset identity = sunset dark -->
```

- **Mode**: automatic via OS through `light-dark()`. Manual toggle without
  redefining tokens — it only changes `color-scheme`:
  ```js
  document.documentElement.dataset.mode = "dark"; // "light" | "dark" | remove = auto
  ```
- **Theme**: redefine the contract under `[data-theme="x"]`, global or scoped to a
  section. Each theme uses `light-dark()` internally → works in both modes. See
  [`themes/sunset.css`](./themes/sunset.css): same markup, completely different look.

## Breakpoints — "no breakpoints"

We prefer native responsiveness without `@media`: **container queries** (the
component adapts to *its* width — see `components/card.css`), `flex-wrap`,
`grid auto-fit` and `clamp()`. `@media` is left only for page layout. Honest note:
breakpoints can't be custom properties, so they're a documented convention, not
tokens.

## Requirements

Modern browsers: `@scope` in Chrome 118+, Safari 17.4+, Firefox 128+
(same range as `light-dark()` and `color-mix()`).

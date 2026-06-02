# Authoring a component

A start-to-finish guide to building your own scc component. It assumes you've read
the [README](./README.md); the machine-readable reference (layers, catalog, full
conventions) lives in [`llms-full.txt`](./llms-full.txt).

The fastest start: copy [`components/_template.css`](./components/_template.css)
and edit. This guide explains each decision behind that template.

---

## The one rule everything follows

> The HTML says **what something is** or **what intent it has**. The CSS says
> **how it looks**. Never put appearance in the markup.

Every step below is a consequence of that rule.

---

## Step 1 — Choose the marker

The marker is how the HTML announces "this is component X". Pick the most semantic
option that **unambiguously** identifies it, in this order:

| If… | Use | Example |
|---|---|---|
| an element means exactly this, 1:1 | the element | `button`, `dialog`, `table`, `kbd`, `input[type]` |
| it's identified by a native ARIA role | `[role="…"]` | `[role="tablist"]` |
| the behavior is named by an attribute | `[data-…]` | `[data-tooltip]` |
| the element is real but ambiguous | element + class | `details.menu` vs `details.accordion` |
| no element fits | one class on the root | `.card`, `.badge`, `.stat` |

**Litmus test:** would styling the bare element wrongly catch unrelated markup?
`<button>` won't (it's always a button). `<nav>` will (breadcrumbs and pagination
are navs too) — so the navbar is `.navbar`, not `nav`. **When unsure, use a class.**

---

## Step 2 — Write the scaffold

Always `@layer components { @scope (<marker>) { … } }`. Style the root with `:scope`
and the internals with **element/role** selectors — never per-element classes.

```css
@layer components {
  @scope (.stat) {
    :scope { /* the root box */ }
    p      { /* the label, by element */ }
    strong { /* the value */ }
  }
}
```

---

## Step 3 — Style only through tokens

Colors, spacing, type, radius, motion → `var(--…)`. Never hard-code a hex, a px, or
a duration. This is what lets a component re-theme itself and stay consistent across
the whole UI. (The full token list is in `tokens.css`; the editable knobs in
`theme.css`.)

---

## Step 4 — Variants by intent, states by native pseudo-classes

- **Variants** → `[data-variant]` (or a more specific intent attribute like
  `[data-trend]`). A pattern that scales: have variants swap **one local custom
  property** the rest of the rule reads, instead of re-declaring many properties:

  ```css
  :scope            { border-inline-start: 4px solid var(--tone); }
  :scope[data-variant="success"] { --tone: var(--success); }
  :scope[data-variant="danger"]  { --tone: var(--danger);  }
  ```

  (This is exactly how `alert.css` works.)

- **States** → native pseudo-classes: `:hover`, `:focus-visible`, `:checked`,
  `:invalid`, `:disabled`, `[aria-current]`, `[open]`. Don't invent `.is-active`
  classes — the platform already exposes the state.

---

## Step 5 — Overriding an element that has an scc base

A `<button>` or `<a>` inside your component already carries `button.css` / `base.css`,
which live in the **same layer** — so layer order won't decide, specificity will.
Prefix the inner selector with `:scope` to win **without `!important`**:

```css
@scope (.chip) {
  /* (0,1,0) from :scope beats @scope(button){ :scope } at (0,1,0)… */
  :scope button { appearance: none; border: 0; background: none; }
}
```

This is the one place specificity matters inside scc — local and explicit, not a
specificity war. Used in `tabs.css`, `menu.css`, `chip.css`.

---

## Step 6 — Responsiveness and motion (if needed)

- Prefer **`@container`** over `@media` so the component reacts to **its own** width,
  not the screen's (see `card.css`).
- For motion, use the tokens (`--dur`, `--ease`, `--ease-bounce`). For enter/leave,
  use **`@starting-style`** (see `dialog.css`, `toast.css`). All motion is disabled
  automatically under `prefers-reduced-motion` by the reset.
- Put any `@keyframes` in `animations.css` and reference them internally — never as
  utility classes in the HTML.

---

## Step 7 — Register and demo

1. Add `@import url("components/<name>.css");` to `scc.css`. Order only matters when
   two components restyle the same element — import the more specific one **later**.
2. Add a section to `demo/index.html`, and the minimal JS if it needs behavior.

---

## Worked example — a `stat` KPI

A label, a big value, and a trend delta. No element means "stat", so the marker is a
**class**. Internals are styled by element. The trend tints the delta, chosen by
intent.

**HTML**
```html
<div class="stat" data-trend="up">
  <p>Revenue</p>
  <strong>$12.4k</strong>
  <small>+8.2%</small>
</div>
```

**`components/stat.css`**
```css
@layer components {
  @scope (.stat) {
    :scope {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      padding: var(--space-4);
      background: var(--surface);
      border: var(--border-width) solid var(--border);
      border-radius: var(--radius);
    }
    p      { margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
    strong { font-size: var(--text-xl); font-weight: 700; line-height: 1; }
    small  { color: var(--text-muted); }

    :scope[data-trend="up"]   small { color: var(--success); }
    :scope[data-trend="down"] small { color: var(--danger); }
  }
}
```

Notice: zero classes inside the markup, every value is a token, the variant is an
intent attribute, and it re-themes itself for free.

---

## Checklist

- [ ] Marker is the most semantic **unambiguous** option (element → role → attr → class).
- [ ] `@layer components` + `@scope`; `:scope` for the root, element/role for internals.
- [ ] Zero per-element classes in the HTML; nothing in the HTML describes appearance.
- [ ] Every value is a token (`var(--…)`); no raw hex / px / ms.
- [ ] Variants = `[data-*]`; states = native pseudo-classes.
- [ ] Inner element bases overridden with `:scope` (only if needed).
- [ ] `@container` over `@media`; `@keyframes` in `animations.css`.
- [ ] `@import` added to `scc.css`; demo section added.

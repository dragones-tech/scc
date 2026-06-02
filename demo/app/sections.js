// @ts-check
import { View } from 'lumenjs';
import { applyI18n } from './i18n.js';

/**
 * Turn a live preview element into clean, displayable HTML: strip the demo's
 * data-ref wiring (not part of scc), then dedent. Shown verbatim in each module so
 * the code never drifts from the example — it IS the example.
 * @param {Element} preview
 * @returns {string}
 */
function formatHTML(preview) {
  const copy = /** @type {HTMLElement} */ (preview.cloneNode(true));
  copy.querySelectorAll('[data-ref]').forEach((el) => el.removeAttribute('data-ref'));
  const lines = copy.innerHTML.replace(/\t/g, '  ').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(indent)).join('\n');
}

/** Escape text for safe insertion into HTML. */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Tiny dependency-free HTML highlighter: wraps tags / attributes / strings /
 * comments in <span class="tok-*"> (colored via app.css with scc tokens, so the
 * code re-themes too). Returns an HTML string; all text is escaped.
 * @param {string} code
 * @returns {string}
 */
function highlight(code) {
  return code.replace(
    /(<!--[\s\S]*?-->)|(<\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?>)|([^<]+)/g,
    (_m, comment, open, name, attrs, close, text) => {
      if (comment) return `<span class="tok-comment">${esc(comment)}</span>`;
      if (text != null) return esc(text);
      const a = (attrs || '').replace(
        /([\w-]+)(?:(=)("[^"]*"|'[^']*'))?/g,
        (_mm, an, eq, av) =>
          `<span class="tok-attr">${esc(an)}</span>` +
          (eq ? eq : '') +
          (av ? `<span class="tok-str">${esc(av)}</span>` : ''),
      );
      return `<span class="tok-punct">${esc(open)}</span><span class="tok-tag">${esc(name)}</span>${a}<span class="tok-punct">${esc(close)}</span>`;
    },
  );
}

/**
 * Tiny CSS highlighter for hand-written snippets (the guide). Operates on
 * already-escaped text and wraps tokens in the same <span class="tok-*"> classes
 * as the HTML highlighter, so CSS code re-themes with scc too.
 * @param {string} escaped  text with <,>,& already turned into entities
 * @returns {string}
 */
function highlightCSS(escaped) {
  return escaped.replace(
    /(\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(@[\w-]+)|(--[\w-]+)|(\.[\w-]+|#[\w-]+|::?[\w-]+)|([a-zA-Z-]+)(?=\s*:(?!:))|([{}();,]|&gt;)/g,
    (m, comment, str, at, custom, sel, prop, punct) => {
      if (comment) return `<span class="tok-comment">${comment}</span>`;
      if (str)     return `<span class="tok-str">${str}</span>`;
      if (at)      return `<span class="tok-tag">${at}</span>`;
      if (custom)  return `<span class="tok-attr">${custom}</span>`;
      if (sel)     return `<span class="tok-tag">${sel}</span>`;
      if (prop)    return `<span class="tok-attr">${prop}</span>`;
      if (punct)   return `<span class="tok-punct">${punct}</span>`;
      return m;
    },
  );
}

/**
 * Base for every section. On mount it fills each module's <code> from its live
 * preview, colorizes any hand-written CSS snippets, then runs the section's own
 * interactive wiring (enhance).
 */
class Section extends View {
  onMount() {
    applyI18n(this.el, this.signal);   // fill [data-i18n] prose, re-fill on locale change
    for (const block of this.el.querySelectorAll('.demo')) {
      const preview = block.querySelector('.demo-preview');
      const code = block.querySelector('.demo-code > code');
      if (preview && code) code.innerHTML = highlight(formatHTML(preview));
    }
    // Hand-written CSS snippets (e.g. the guide): colorize from their text.
    for (const code of this.el.querySelectorAll('pre[data-lang="css"] > code')) {
      code.innerHTML = highlightCSS(esc(code.textContent));
    }
    this.enhance();
  }
  /** Override for interactive behavior (tabs, dialog, toast…). */
  enhance() {}
}

export class Home extends Section { static template = '#sec-home'; }

export class Forms extends Section { static template = '#sec-forms'; }

export class Containers extends Section {
  static template = '#sec-containers';
  enhance() {
    const dialog = /** @type {HTMLDialogElement} */ (this.ui.dialog);
    this.listen(this.ui.openDialog, 'click', () => dialog.showModal());
    this.listen(this.ui.confirmDialog, 'click', () => dialog.close());
  }
}

export class Nav extends Section {
  static template = '#sec-nav';
  enhance() {
    const tabs = this.ui.tabs;
    const tablist = tabs.querySelector('[role="tablist"]');
    if (!tablist) return;
    this.listen(tablist, 'click', (e) => {
      const tab = /** @type {Element} */ (e.target).closest('[role="tab"]');
      if (!tab) return;
      for (const t of tablist.querySelectorAll('[role="tab"]')) {
        const selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        const panel = tabs.querySelector('#' + t.getAttribute('aria-controls'));
        if (panel) /** @type {HTMLElement} */ (panel).hidden = !selected;
      }
    });
  }
}

export class Feedback extends Section {
  static template = '#sec-feedback';
  enhance() {
    this.listen(this.ui.toastBtn, 'click', () => {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.dataset.variant = 'success';
      toast.setAttribute('role', 'status');
      toast.innerHTML = '<strong>Guardado</strong><p>Tus cambios se guardaron.</p>';
      this.ui.toasts.append(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      }, 3000);
    });
  }
}

export class Primitives extends Section { static template = '#sec-primitives'; }

export class Guide extends Section { static template = '#sec-guide'; }

export class NotFound extends View {
  static template = '#sec-404';
  onMount() { applyI18n(this.el, this.signal); }
}

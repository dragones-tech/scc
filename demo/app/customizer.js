// @ts-check
import { View, Model } from 'lumenjs';
import { applyI18n } from './i18n.js';

/**
 * The token customizer drawer. A Lumen Model holds the live token values; every
 * control writes to it (model.set), and the model's `change` event applies each
 * value to :root with setProperty — so one knob reconfigures the whole site. That
 * IS scc's thesis (tokens drive everything) and Lumen's reactivity, in one place.
 *
 * Controls are declared in the template via [data-token] (+ optional [data-unit]);
 * a single delegated listener handles them all — no per-control wiring.
 */
export class Customizer extends View {
  static template = '#customizer';

  onCreate() {
    this.model = new Model({});
    /** @type {Record<string, {el: HTMLInputElement, value: string}>} */
    this._defaults = {};
  }

  onMount() {
    applyI18n(this.el, this.signal);   // drawer note + control labels
    const controls = this.ui.controls;

    // Seed the model + outputs from the controls' authored values (no emit on seed).
    for (const el of controls.querySelectorAll('[data-token]')) {
      const token = el.dataset.token;
      const value = el.value + (el.dataset.unit || '');
      this.model.data[token] = value;
      this._defaults[token] = { el, value };
      this._output(token, value);
    }

    // The one apply path: model change → setProperty on :root + reflect in the output.
    this.model.on(
      'change',
      ({ keys }) => {
        for (const key of keys) {
          const value = this.model.get(key);
          document.documentElement.style.setProperty(key, value);
          this._output(key, value);
        }
      },
      { signal: this.signal },
    );

    // Any control input → write to the model.
    this.listen(controls, 'input', (e) => {
      const el = /** @type {HTMLElement} */ (e.target).closest('[data-token]');
      if (!el) return;
      this.model.set(el.dataset.token, el.value + (el.dataset.unit || ''));
    });

    // Reset to the authored defaults.
    this.listen(this.ui.reset, 'click', () => {
      for (const [token, { el, value }] of Object.entries(this._defaults)) {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = el.defaultValue;
        this.model.set(token, value);
      }
    });

    this.listen(this.ui.close, 'click', () => this.close());
    this.listen(this.ui.scrim, 'click', () => this.close());
    this.listen(document, 'keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  /** Reflect a token's value in its <output>, if any. */
  _output(token, value) {
    const out = this.el.querySelector(`[data-out="${token}"]`);
    if (out) out.textContent = value;
  }

  open() { this.el.classList.add('open'); }
  close() { this.el.classList.remove('open'); }
  toggle() { this.el.classList.toggle('open'); }
}

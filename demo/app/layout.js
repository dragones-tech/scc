// @ts-check
import { View } from 'lumenjs';
import { i18n, applyI18n } from './i18n.js';

/**
 * The app shell: a persistent navbar (with the two theming controls) and a sidebar
 * menu, plus a `main` region the Router swaps section views into.
 *
 * Two orthogonal theming axes, wired here:
 *   data-mode  on <html>  → light / dark / auto (color-scheme)
 *   data-theme on <html>  → brand identity (default / sunset)
 */
export class Layout extends View {
  static template = '#layout';
  static regions = { main: 'outlet' };

  onMount() {
    const root = document.documentElement;
    this.modes = ['', 'light', 'dark'];

    // AXIS 1 · mode: auto → light → dark → auto…
    this.listen(this.ui.modeBtn, 'click', () => {
      const cur = root.dataset.mode || '';
      const next = this.modes[(this.modes.indexOf(cur) + 1) % this.modes.length];
      if (next) root.dataset.mode = next;
      else root.removeAttribute('data-mode');
      this.syncMode();
    });

    // AXIS 2 · theme identity (composes with the mode)
    this.listen(this.ui.themeSel, 'change', (e) => {
      const value = /** @type {HTMLSelectElement} */ (e.target).value;
      if (value) root.dataset.theme = value;
      else root.removeAttribute('data-theme');
    });

    // Language toggle: switch the Lumen I18n locale and mirror it on <html lang>
    // (for :lang() and assistive tech). The i18n 'change' event re-renders everything.
    this.listen(this.ui.langBtn, 'click', () => {
      i18n.setLocale(i18n.locale === 'es' ? 'en' : 'es');
    });
    i18n.onChange(({ locale }) => {
      root.lang = locale;
      this.syncLang();
    }, { signal: this.signal });

    // Fill the sidebar links (and any chrome [data-i18n]) for the current locale.
    applyI18n(this.el, this.signal);

    // Open the token customizer (handled by the Customizer view via a prop callback)
    this.listen(this.ui.customizeBtn, 'click', () => this.props.onCustomize?.());

    // Keep the active menu link in sync with the route
    this.listen(window, 'hashchange', () => this.syncActive());
    this.syncActive();
    this.syncLang();   // seed mode label, theme options and the lang button for the initial language
  }

  /** Render the mode button label in the current language. */
  syncMode() {
    const es = i18n.locale === 'es';
    const labels = es ? { '': 'auto', light: 'claro', dark: 'oscuro' }
                      : { '': 'auto', light: 'light', dark: 'dark' };
    const mode = document.documentElement.dataset.mode || '';
    this.ui.modeBtn.textContent = '🌗 ' + (es ? 'Modo' : 'Light') + ': ' + labels[mode];
  }

  /** Update the dynamic chrome (lang button, mode label, theme options) for the locale. */
  syncLang() {
    const es = i18n.locale === 'es';
    this.ui.langBtn.textContent = '🌐 ' + (es ? 'ES' : 'EN');
    const word = es ? 'Tema' : 'Theme';
    const opts = /** @type {HTMLSelectElement} */ (this.ui.themeSel).options;
    opts[0].textContent = word + ': default';
    opts[1].textContent = word + ': sunset';
    this.syncMode();
  }

  /** Mark the menu link matching the current hash with aria-current. */
  syncActive() {
    const current = location.hash || '#/';
    for (const a of this.ui.menu.querySelectorAll('a')) {
      if (a.getAttribute('href') === current) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  }
}

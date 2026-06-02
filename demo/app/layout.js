// @ts-check
import { View } from 'lumenjs';

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

    // AXIS 1 · mode: auto → light → dark → auto…
    const modes = ['', 'light', 'dark'];
    const labels = { '': 'auto', light: 'claro', dark: 'oscuro' };
    this.listen(this.ui.modeBtn, 'click', () => {
      const next = modes[(modes.indexOf(root.dataset.mode || '') + 1) % modes.length];
      if (next) root.dataset.mode = next;
      else root.removeAttribute('data-mode');
      this.ui.modeBtn.textContent = '🌗 Modo: ' + labels[next];
    });

    // AXIS 2 · theme identity (composes with the mode)
    this.listen(this.ui.themeSel, 'change', (e) => {
      const value = /** @type {HTMLSelectElement} */ (e.target).value;
      if (value) root.dataset.theme = value;
      else root.removeAttribute('data-theme');
    });

    // Open the token customizer (handled by the Customizer view via a prop callback)
    this.listen(this.ui.customizeBtn, 'click', () => this.props.onCustomize?.());

    // Keep the active menu link in sync with the route
    this.listen(window, 'hashchange', () => this.syncActive());
    this.syncActive();
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

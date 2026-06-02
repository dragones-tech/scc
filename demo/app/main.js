// @ts-check
import { Router } from 'lumenjs';
import { Layout } from './layout.js';
import { Customizer } from './customizer.js';
import { Home, Forms, Containers, Nav, Feedback, Primitives, NotFound } from './sections.js';

// The token customizer drawer (mounted to <body>; toggled from the navbar).
const customizer = new Customizer();

// Mount the shell once; its `main` region is the router outlet.
const layout = await new Layout({ onCustomize: () => customizer.toggle() })
  .mount(/** @type {HTMLElement} */ (document.querySelector('#app')));
await customizer.mount(document.body);

const outlet = layout.regions.main;
outlet.transition = true; // native View Transitions where supported (progressive enhancement)

new Router()
  .add('/',           () => outlet.show(new Home()))
  .add('/forms',      () => outlet.show(new Forms()))
  .add('/containers', () => outlet.show(new Containers()))
  .add('/nav',        () => outlet.show(new Nav()))
  .add('/feedback',   () => outlet.show(new Feedback()))
  .add('/primitives', () => outlet.show(new Primitives()))
  .notFound(()        => outlet.show(new NotFound()))
  .start();

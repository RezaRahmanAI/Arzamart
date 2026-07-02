import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';

// Bypass self-signed SSL certificate errors in local development
if (typeof process !== 'undefined') {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
}

// Polyfill localStorage/sessionStorage for SSR/prerender (Node.js has no DOM)
if (typeof globalThis.localStorage === 'undefined') {
  const noop = () => {};
  const noValue = () => null;
  globalThis.localStorage = {
    getItem: noValue,
    setItem: noop,
    removeItem: noop,
    clear: noop,
    key: noValue,
    get length() { return 0; },
  } as Storage;
}
if (typeof globalThis.sessionStorage === 'undefined') {
  const noop = () => {};
  const noValue = () => null;
  globalThis.sessionStorage = {
    getItem: noValue,
    setItem: noop,
    removeItem: noop,
    clear: noop,
    key: noValue,
    get length() { return 0; },
  } as Storage;
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering()
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);

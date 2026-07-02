import { RenderMode, Route } from '@angular/ssr';

export const serverRoutes: Route[] = [
  // Truly static pages → prerender (SSG)
  // These pages have no API calls during init
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'forgot-password', renderMode: RenderMode.Prerender },

  // Pages that load data from API → server-rendered (SSR)
  // Rendered dynamically at request time (prevents build-time API dependency)
  { path: '', renderMode: RenderMode.Server },
  { path: 'men', renderMode: RenderMode.Server },
  { path: 'women', renderMode: RenderMode.Server },
  { path: 'children', renderMode: RenderMode.Server },
  { path: 'accessories', renderMode: RenderMode.Server },
  { path: 'offers', renderMode: RenderMode.Server },
  { path: 'search', renderMode: RenderMode.Server },

  // Dynamic catalog → server-rendered (SSR)
  { path: 'product/:slug', renderMode: RenderMode.Server },
  { path: 'category/:slug', renderMode: RenderMode.Server },
  { path: 'subcategory/:slug', renderMode: RenderMode.Server },
  { path: 'collection/:slug', renderMode: RenderMode.Server },
  { path: 'lp/:slug', renderMode: RenderMode.Server },
  { path: 'clp/:slug', renderMode: RenderMode.Server },
  { path: 'shop/:categorySlug', renderMode: RenderMode.Server },
  { path: 'shop/:categorySlug/:subCategorySlug', renderMode: RenderMode.Server },

  // User-specific & admin → client-rendered
  { path: '**', renderMode: RenderMode.Client },
];

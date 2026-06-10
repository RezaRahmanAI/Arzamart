import { RenderMode, Route } from '@angular/ssr';

export const serverRoutes: Route[] = [
  // Truly static pages → prerender (SSG)
  // These pages have no API calls during init
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'forgot-password', renderMode: RenderMode.Prerender },

  // Pages that load data from API → client-rendered
  // These need HTTP calls that hang during build without a running API
  { path: '', renderMode: RenderMode.Client },
  { path: 'men', renderMode: RenderMode.Client },
  { path: 'women', renderMode: RenderMode.Client },
  { path: 'children', renderMode: RenderMode.Client },
  { path: 'accessories', renderMode: RenderMode.Client },
  { path: 'offers', renderMode: RenderMode.Client },
  { path: 'search', renderMode: RenderMode.Client },

  // Dynamic catalog → client-rendered
  { path: 'product/:slug', renderMode: RenderMode.Client },
  { path: 'category/:slug', renderMode: RenderMode.Client },
  { path: 'subcategory/:slug', renderMode: RenderMode.Client },
  { path: 'collection/:slug', renderMode: RenderMode.Client },
  { path: 'lp/:slug', renderMode: RenderMode.Client },
  { path: 'clp/:slug', renderMode: RenderMode.Client },
  { path: 'shop/:categorySlug', renderMode: RenderMode.Client },
  { path: 'shop/:categorySlug/:subCategorySlug', renderMode: RenderMode.Client },

  // User-specific & admin → client-rendered
  { path: '**', renderMode: RenderMode.Client },
];

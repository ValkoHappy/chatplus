import { defineMiddleware } from 'astro:middleware';
import { normalizeInternalPath, shouldRedirectTrailingSlash } from './lib/urls.ts';

export const onRequest = defineMiddleware(async (context, next) => {
  if (shouldRedirectTrailingSlash(context.url.pathname)) {
    const redirectURL = new URL(context.url.toString());
    redirectURL.pathname = normalizeInternalPath(context.url.pathname);
    return Response.redirect(redirectURL, 308);
  }

  const response = await next();
  const ct = response.headers.get('content-type') ?? '';
  if (ct.includes('text/html') && !ct.includes('charset')) {
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Content-Type', 'text/html; charset=utf-8');
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  }
  return response;
});

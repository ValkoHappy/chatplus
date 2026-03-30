import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
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

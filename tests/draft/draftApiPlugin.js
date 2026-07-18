import { resolvePublicDraftResponse } from './publicApiResponses.js';

export function draftApiPlugin() {
  return {
    name: 'forest-draft-api',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith('/api/v1/')) return next();
        const result = resolvePublicDraftResponse(request.method, request.url);
        response.statusCode = result.status;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(JSON.stringify(result.body));
      });
    },
  };
}

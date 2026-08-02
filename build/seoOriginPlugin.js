import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SITE_ORIGIN, applySiteOrigin, hasSiteOriginToken } from './siteOrigin.js';

// 대표 origin 을 넣어야 하는 정적 SEO 산출물. 그 외 public 파일은 손대지 않는다.
const SEO_FILES = ['robots.txt', 'sitemap.xml', 'rss.xml', 'llms.txt'];

/**
 * `__SITE_ORIGIN__` 토큰을 대표 origin 으로 치환한다.
 *
 * index.html 은 Vite 의 HTML 훅으로, public/ 의 SEO 파일은 빌드 산출물에서 직접 치환한다.
 * 개발 서버에서도 같은 값을 보여줘야 로컬에서 확인한 내용과 배포본이 어긋나지 않는다.
 */
export function seoOriginPlugin({ origin = SITE_ORIGIN } = {}) {
  return {
    name: 'forest-seo-origin',
    // Vite 의 HTML asset 처리가 토큰을 상대경로로 보고 `/` 를 붙이므로 그보다 먼저 치환한다.
    enforce: 'pre',

    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return applySiteOrigin(html, origin);
      },
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const name = req.url?.split('?')[0]?.replace(/^\//, '');
        if (!name || !SEO_FILES.includes(name)) return next();
        try {
          const source = await readFile(path.resolve(server.config.publicDir, name), 'utf8');
          res.setHeader('Content-Type', name.endsWith('.xml') ? 'application/xml' : 'text/plain');
          res.end(applySiteOrigin(source, origin));
        } catch {
          next();
        }
      });
    },

    async writeBundle(options) {
      const outDir = options.dir;
      const emitted = await readdir(outDir);
      for (const name of SEO_FILES) {
        if (!emitted.includes(name)) continue;
        const target = path.join(outDir, name);
        const source = await readFile(target, 'utf8');
        await writeFile(target, applySiteOrigin(source, origin));
      }

      // 치환이 빠진 채 배포되면 검색엔진에 잘못된 주소가 노출되므로 빌드를 실패시킨다.
      const leftovers = [];
      for (const name of [...SEO_FILES, 'index.html']) {
        if (!emitted.includes(name)) continue;
        const content = await readFile(path.join(outDir, name), 'utf8');
        if (hasSiteOriginToken(content)) leftovers.push(name);
      }
      if (leftovers.length > 0) {
        throw new Error(`빌드 산출물에 치환되지 않은 __SITE_ORIGIN__ 이 남아 있습니다: ${leftovers.join(', ')}`);
      }
    },
  };
}

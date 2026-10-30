import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDirectory = path.join(projectRoot, 'dist');
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

if (!fs.existsSync(rootDirectory)) {
  console.error('dist/ 不存在，请先运行 pnpm build。');
  process.exit(1);
}

http.createServer(async function (request, response) {
  try {
    const requestUrl = new URL(request.url || '/', 'http://localhost');
    let pathname;

    try {
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch (error) {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Bad request');
      return;
    }

    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    }

    const filePath = path.resolve(rootDirectory, '.' + pathname);

    if (!filePath.startsWith(rootDirectory + path.sep) && filePath !== rootDirectory) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Forbidden');
      return;
    }

    const stat = await fsPromises.stat(filePath).catch(function () {
      return null;
    });

    if (!stat || !stat.isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    const stream = fs.createReadStream(filePath);
    stream.on('error', function () {
      response.destroy();
    });
    stream.pipe(response);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal server error');
  }
}).listen(port, function () {
  console.log('Preview: http://localhost:' + port + '/');
});

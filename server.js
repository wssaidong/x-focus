const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const SOURCES = {
  '36kr': { name: '36氪', icon: '📰', args: ['36kr', 'hot', '--type', 'renqi', '--limit', '8', '-f', 'json'] },
  'v2ex': { name: 'V2EX', icon: '💬', args: ['v2ex', 'hot', '--limit', '8', '-f', 'json'] },
  'stackoverflow': { name: 'Stack Overflow', icon: '⌨️', args: ['stackoverflow', 'hot', '--limit', '8', '-f', 'json'] },
  'tieba': { name: '百度贴吧', icon: '🎮', args: ['tieba', 'hot', '--limit', '8', '-f', 'json'] },
  'lobsters': { name: 'Lobsters', icon: '🦞', args: ['lobsters', 'hot', '--limit', '8', '-f', 'json'] },
};

function runOpencli(args) {
  return new Promise((resolve) => {
    const proc = spawn('opencli', args);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      try {
        resolve({ success: code === 0, data: JSON.parse(stdout), error: stderr });
      } catch {
        resolve({ success: false, error: stdout || stderr });
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.writeHead(204);
    res.end();
    return;
  }

  const source = url.searchParams.get('source') || 'all';

  if (url.pathname === '/api/news') {
    try {
      let results = [];
      const keys = source === 'all' ? Object.keys(SOURCES) : [source];
      for (const key of keys) {
        const src = SOURCES[key];
        if (!src) {
          results.push({ name: key, icon: '❓', error: 'Unknown source', items: [] });
          continue;
        }
        const r = await runOpencli(src.args);
        const items = r.success ? r.data.map(item => ({
          title: item.title,
          url: item.url,
          meta: item.discussions || (item.score ? `${item.score} pts` : null),
        })) : [];
        results.push({ name: src.name, icon: src.icon, items, error: r.error });
      }
      res.writeHead(200);
      res.end(JSON.stringify(results));
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Static JSON files
  const jsonMatch = url.pathname.match(/^\/([\w]+)\.json$/);
  if (jsonMatch) {
    const filePath = path.join(__dirname, url.pathname);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(fs.readFileSync(filePath, 'utf8'));
      return;
    }
  }

  if (url.pathname === '/') {
    const htmlPath = path.join(__dirname, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Focus server running at http://localhost:${PORT}`);
  console.log('Sources: 36kr, v2ex, stackoverflow, tieba, lobsters');
  console.log('Usage: http://localhost:' + PORT + '/api/news?source=all');
});

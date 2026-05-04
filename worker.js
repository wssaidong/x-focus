export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const source = url.searchParams.get('source') || 'all';
    const apiUrl = url.searchParams.get('api');

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, OPTIONS' } });
    }

    if (apiUrl) {
      try {
        const target = apiUrl.startsWith('http') ? apiUrl : `http://${apiUrl}`;
        const res = await fetch(target);
        const data = await res.json();
        return new Response(JSON.stringify(data), { headers: cors });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { headers: cors, status: 502 });
      }
    }

    const sources = {
      '36kr': { name: '36氪', icon: '📰', cmd: '36kr hot --type renqi --limit 8 -f json' },
      'v2ex': { name: 'V2EX', icon: '💬', cmd: 'v2ex hot --limit 8 -f json' },
      'stackoverflow': { name: 'Stack Overflow', icon: '⌨️', cmd: 'stackoverflow hot --limit 8 -f json' },
      'tieba': { name: '百度贴吧', icon: '🎮', cmd: 'tieba hot --limit 8 -f json' },
      'lobsters': { name: 'Lobsters', icon: '🦞', cmd: 'lobsters hot --limit 8 -f json' },
    };

    if (source !== 'all' && !sources[source]) {
      return new Response(JSON.stringify({ error: 'Unknown source' }), { headers: cors });
    }

    return new Response(JSON.stringify({
      message: 'Run opencli locally as proxy server, then call with ?api=<url>',
      available_sources: Object.entries(sources).map(([k, v]) => ({ key: k, name: v.name, icon: v.icon, cmd: v.cmd })),
      usage: 'Call with ?api=<local-proxy-url> or ?source=<key>'
    }), { headers: cors });
  },
};
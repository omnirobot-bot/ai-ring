const ALLOWED_ORIGINS = [
  'https://omnirobot-bot.github.io',
  'http://localhost',
  'http://127.0.0.1',
  'null', // file:// otevřené lokálně
];

function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  if (!origin || ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
    return origin || '*';
  }
  return null;
}

export default {
  async fetch(request) {
    const allowedOrigin = getAllowedOrigin(request);

    if (request.method === 'OPTIONS') {
      if (!allowedOrigin) return new Response('Forbidden', { status: 403 });
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Headers': 'X-Subscription-Token, Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Vary': 'Origin',
        }
      });
    }

    if (!allowedOrigin) return new Response('Forbidden', { status: 403 });

    const braveToken = request.headers.get('X-Subscription-Token');
    if (!braveToken) return new Response('Missing token', { status: 401 });

    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    if (!q) return new Response('Missing q', { status: 400 });

    const braveResp = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=8`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': braveToken,
        }
      }
    );

    const data = await braveResp.text();

    return new Response(data, {
      status: braveResp.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Vary': 'Origin',
      }
    });
  }
};

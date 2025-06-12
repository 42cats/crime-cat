require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
}));

// 캐시 설정
const sitemapCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1시간

app.listen(3000, () => console.log('Server is listening on port 3000'));

const PROVIDERS = {
  discord: {
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userUrl: 'https://discord.com/api/users/@me',
    scope: 'identify email',
    clientId: process.env.APP_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    redirectUri: process.env.DISCORD_REDIRECT_URI,
  },
};

app.get('/', (req, res) => {
  res.send('Hello, this is homepage!');
});

app.get('/api/oauth2/authorize/:provider', (req, res) => {
  const { provider } = req.params;
  const config = PROVIDERS[provider];
  if (!config) return res.status(400).send('Unsupported provider');

  const state = encodeURIComponent(JSON.stringify({ provider }));

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope,
    state,
  });

  res.redirect(`${config.authUrl}?${params.toString()}`);
});


app.get('/api/oauth2/:provider', async (req, res) => {
  const { provider } = req.params;
  const { code } = req.query;

  const config = PROVIDERS[provider];
  if (!config || !code) return res.status(400).send('Invalid request');

  try {
    const tokenRes = await axios.post(
      config.tokenUrl,
      new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: provider === 'github' ? 'application/json' : undefined,
        },
      }
    );

    const token = tokenRes.data.access_token;

    const userRes = await axios.get(config.userUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(userRes.data);
    res.json({ provider, user: userRes.data });
  } catch (error) {
    console.error(`[${provider}] OAuth 에러:`, error.response?.data || error.message);
    res.status(500).send('OAuth 처리 실패');
  }
});

// 동적 사이트맵 엔드포인트
app.get('/api/sitemap/themes.xml', async (req, res) => {
  const cacheKey = 'themes';
  const cached = sitemapCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    res.header('Content-Type', 'application/xml');
    return res.send(cached.data);
  }

  try {
    const categories = ['crimescene', 'escape_room', '머더미스터리'];
    const urls = [];
    
    for (const category of categories) {
      try {
        const response = await axios.get(`${process.env.API_BASE_URL || 'http://localhost:8080'}/api/v1/public/themes`, {
          params: { category, page: 1, size: 1000 }
        });
        
        const themes = response.data.content || [];
        themes.forEach(theme => {
          urls.push({
            loc: `https://mystery-place.com/themes/${category}/${theme.id}`,
            lastmod: theme.updatedAt || new Date().toISOString(),
            changefreq: 'weekly',
            priority: 0.8
          });
        });
      } catch (err) {
        console.error(`테마 가져오기 실패 (${category}):`, err.message);
      }
    }

    const xml = generateSitemapXml(urls);
    sitemapCache.set(cacheKey, { data: xml, timestamp: Date.now() });
    
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('테마 사이트맵 생성 실패:', error);
    res.status(500).send('서버 오류');
  }
});

app.get('/api/sitemap/posts.xml', async (req, res) => {
  const cacheKey = 'posts';
  const cached = sitemapCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    res.header('Content-Type', 'application/xml');
    return res.send(cached.data);
  }

  try {
    const boardTypes = ['question', 'chat', 'creator'];
    const urls = [];
    
    for (const boardType of boardTypes) {
      try {
        const response = await axios.get(`${process.env.API_BASE_URL || 'http://localhost:8080'}/api/v1/public/posts`, {
          params: { boardType, page: 1, size: 100 }
        });
        
        const posts = response.data.content || [];
        posts.forEach(post => {
          urls.push({
            loc: `https://mystery-place.com/community/${boardType}/${post.id}`,
            lastmod: post.updatedAt || new Date().toISOString(),
            changefreq: 'daily',
            priority: 0.7
          });
        });
      } catch (err) {
        console.error(`게시글 가져오기 실패 (${boardType}):`, err.message);
      }
    }

    const xml = generateSitemapXml(urls);
    sitemapCache.set(cacheKey, { data: xml, timestamp: Date.now() });
    
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('게시글 사이트맵 생성 실패:', error);
    res.status(500).send('서버 오류');
  }
});

app.get('/api/sitemap/profiles.xml', async (req, res) => {
  const cacheKey = 'profiles';
  const cached = sitemapCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    res.header('Content-Type', 'application/xml');
    return res.send(cached.data);
  }

  try {
    const response = await axios.get(`${process.env.API_BASE_URL || 'http://localhost:8080'}/api/v1/public/web_users/active`, {
      params: { page: 1, size: 500 }
    });
    
    const users = response.data.content || [];
    const urls = users.map(user => ({
      loc: `https://mystery-place.com/profile/${user.id}`,
      lastmod: user.updatedAt || new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.6
    }));

    const xml = generateSitemapXml(urls);
    sitemapCache.set(cacheKey, { data: xml, timestamp: Date.now() });
    
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('프로필 사이트맵 생성 실패:', error);
    res.status(500).send('서버 오류');
  }
});

// 사이트맵 인덱스
app.get('/api/sitemap-index.xml', (req, res) => {
  const sitemaps = [
    '/sitemap.xml', // 정적 사이트맵
    '/api/sitemap/themes.xml',
    '/api/sitemap/posts.xml',
    '/api/sitemap/profiles.xml'
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>https://mystery-place.com${sitemap}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// 헬퍼 함수
function generateSitemapXml(urls) {
  const urlElements = urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}
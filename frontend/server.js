require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
}));

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
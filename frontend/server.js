require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.listen(3000, () => console.log('Server is listening on port 3000'));

app.get('/', (req, res) => {
    res.send('Hello, this is homepage!');
  });

  app.get('/api/login', async (req, res) => {
	const discordAuthURL = process.env.GENERATE_URI;
	res.redirect(discordAuthURL);
  });

  app.get('/oauth2/redirect', async (req, res) => {
    const requestToken = req.query.code;
    let tokenResponse, userResponse;
	console.log(requestToken);
	console.log('[DEBUG] client_id:', process.env.CLIENT_ID); // 실제 출력해서 확인!
	console.log('[DEBUG] client_secret:', process.env.CLIENT_SECRET?.slice(0, 5), '...'); // 앞 몇 글자만!
    try {
        tokenResponse = await axios({
			method: 'post',
			url: 'https://discord.com/api/oauth2/token',
			data: new URLSearchParams({
			  client_id: process.env.CLIENT_ID,
			  client_secret: process.env.CLIENT_SECRET, // 중요!
			  grant_type: 'authorization_code',
			  code: requestToken,
			  redirect_uri: process.env.REDIRECT_URI,
			  scope: 'identify',
			}),
			headers: {
			  'Content-Type': 'application/x-www-form-urlencoded',
			},
		}) ;


        const accessToken = tokenResponse.data.access_token;

        // Use the access token to fetch the user's data from Discord API
        userResponse = await axios.get('https://discordapp.com/api/users/@me', {
            headers: {
                authorization: `Bearer ${accessToken}`,
            },
        });

    } catch (error) {
		console.error('🔴 에러 발생:', error.response?.data || error.message);
        console.error(`Error in getting token or user data from Discord API: ${error.message}`);
        return res.status(500).send('Server Error');
    }

    console.log(userResponse.data); // This logs the user's data

    // Then redirect the user back to your react app
    res.redirect('http://localhost:8080');
});
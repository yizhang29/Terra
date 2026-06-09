async function fetchActivities(accessToken, count = 10) {
  const params = new URLSearchParams({ per_page: count });
  const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Strava fetchActivities failed: ${res.status}`);
  return res.json();
}

async function refreshAccessToken(refreshToken) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new Error(`Strava refreshAccessToken failed: ${res.status}`);
  const { access_token, refresh_token, expires_at } = await res.json();
  return { access_token, refresh_token, expires_at };
}

module.exports = { fetchActivities, refreshAccessToken };

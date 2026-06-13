# Terra — AI Fitness & Nutrition Coach

Your personal AI coach that analyzes your training data and gives
personalized fitness and nutrition advice. Powered by Gemma 4
running locally via LM Studio — free, private, no cloud required.

---

## What it does

- Chat with Terra, your AI fitness and nutrition coach
- Analyzes your Strava activities, recovery, and nutrition
- Streams responses word by word in real time
- Runs entirely on your machine — your data stays private
- Switch to Anthropic Claude cloud with one .env flag

---

## Prerequisites

Before you start, install these:

- Node.js LTS — https://nodejs.org
- LM Studio — https://lmstudio.ai
- Git — https://git-scm.com

---

## Setup — step by step

### 1. Clone the repo

git clone https://github.com/yizhang29/brio.git
cd brio

### 2. Install dependencies

npm install

### 3. Set up LM Studio

1. Open LM Studio
2. Go to Discover tab and search "Gemma 4"
3. Download: google/gemma-4-e4b (recommended)
   Pick the Q4_K_M version for best quality/size balance
4. Go to Developer tab in the left sidebar
5. Select your downloaded model
6. Start the local server
7. Confirm it shows: Server running at http://localhost:1234

### 4. Find your model ID

In your terminal run:

Mac/Linux:
  curl http://localhost:1234/v1/models

Windows PowerShell:
  Invoke-RestMethod -Uri http://localhost:1234/v1/models

Copy the id value from the response — you'll need it in the next step.

### 5. Create your .env file

cp .env.example .env

Open .env and fill in your values:

  USE_LOCAL_LLM=true
  LM_STUDIO_MODEL=google/gemma-4-e4b   ← paste your model id here
  SESSION_SECRET=brio-secret-key
  PORT=3000

Leave these blank for now (needed only for Strava integration):
  ANTHROPIC_API_KEY=
  STRAVA_CLIENT_ID=
  STRAVA_CLIENT_SECRET=
  STRAVA_REDIRECT_URI=http://localhost:3000/auth/callback
  SUPABASE_URL=
  SUPABASE_ANON_KEY=

### 6. Start the server

node backend/server.js

You should see:
  Terra running on http://localhost:3000
  LLM: LM Studio → google/gemma-4-e4b

### 7. Open Terra

Open your browser and go to:
  http://localhost:3000

Type a message or click a suggestion chip to start chatting with Terra.

---

## Switching to Anthropic Claude (optional)

If you want to use Anthropic's cloud models instead of local Gemma:

1. Get an API key at https://console.anthropic.com
2. Update your .env:
   USE_LOCAL_LLM=false
   ANTHROPIC_API_KEY=sk-ant-your-key-here
3. Restart the server

Models available:
  fast     → claude-haiku-4-5-20251001   (cheapest, ~$4 per 1k messages)
  balanced → claude-sonnet-4-6           (best quality, ~$12 per 1k messages)
  powerful → claude-opus-4-7             (most capable, ~$20 per 1k messages)

---

## Project structure

brio/
├── backend/
│   ├── server.js              Express app and routes
│   ├── routes/
│   │   ├── chat.js            POST /api/chat — streaming LLM responses
│   │   ├── auth.js            Strava OAuth (coming soon)
│   │   └── activities.js      Strava activity fetching (coming soon)
│   ├── services/
│   │   ├── llm.js             LLM client — LM Studio or Anthropic
│   │   ├── strava.js          Strava API integration (coming soon)
│   │   ├── garmin.js          Garmin integration (requires partnership)
│   │   ├── apple.js           Apple Health (requires iOS app)
│   │   └── supabase.js        Database client (coming soon)
│   └── middleware/
│       └── auth.js            Session auth middleware
├── frontend/
│   ├── index.html             Main UI
│   ├── style.css              Terra design system
│   └── app.js                 Chat logic and streaming
├── .env.example               Environment variable template
└── README.md                  This file

---

## Running on another machine

1. Clone the repo
2. Run npm install
3. Install and start LM Studio with Gemma 4
4. Copy .env.example to .env and fill in your model ID
5. Run node backend/server.js
6. Open http://localhost:3000

The only thing that does not transfer between machines is the
.env file — you create a fresh one on each machine using
.env.example as the template.

---

## Roadmap

- [x] Local LLM via LM Studio (Gemma 4)
- [x] Streaming chat responses
- [x] Fitness and nutrition coaching persona (Terra)
- [x] Simulated Strava activity context
- [ ] Real Strava OAuth integration
- [ ] Supabase user database
- [ ] Garmin API (requires partner approval)
- [ ] Apple Health (requires iOS app)
- [ ] Deploy to Railway + Vercel
- [ ] Mobile app

---

## Tech stack

- Backend: Node.js + Express
- LLM: Gemma 4 via LM Studio (local) or Anthropic Claude (cloud)
- Frontend: Plain HTML, CSS, JavaScript
- Database: Supabase (coming soon)
- Auth: Strava OAuth (coming soon)

---

## Common issues

Server won't start:
  Make sure you ran npm install first
  Check that .env exists (not just .env.example)

LLM not responding:
  Make sure LM Studio is open and server is running
  Check that LM_STUDIO_MODEL matches the id from curl command
  Confirm LM Studio shows green status at localhost:1234

Port already in use:
  Another process is using port 3000
  Change PORT=3001 in .env and restart

Model ID mismatch:
  Run curl http://localhost:1234/v1/models
  Copy the exact id value into LM_STUDIO_MODEL in .env

---

Built with care by Yi Zhang
Powered by Gemma 4 · Express · LM Studio

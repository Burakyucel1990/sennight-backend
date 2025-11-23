<<<<<<< HEAD
# Sennight Backend (NodeJS + Express)

Çalışır bir başlangıç API'si. Veriler demo olarak `data/*.json`'a yazılır.

## Kurulum
```bash
npm install
cp .env.example .env
npm run dev
```

## .env
```
PORT=3000
JWT_SECRET=buraya_guclu_bir_sey_yaz
DATA_DIR=data
```

## Endpoint'ler
- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `PUT /users/me`
- `GET /profiles`
- `POST /matches/like/:targetUserId`
- `GET /matches`
- `POST /messages/:matchId`
- `GET /messages/:matchId`

## Render Deploy
Repo'yu GitHub'a atıp Render'da Web Service seç. `render.yaml` hazır.
=======
# sennight-backend
>>>>>>> ef0522db0fb85f7ac9ba59fc90237bdfd80cd611

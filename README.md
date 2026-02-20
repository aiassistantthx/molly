# Molly - Poker Home Games Manager

Web-приложение для управления домашними покерными играми с мобильной вёрсткой.

## Технологии

### Frontend
- React 18 + Vite + TypeScript
- TailwindCSS
- Firebase Auth (Google + Magic Link)
- React Router v6
- Zustand

### Backend
- Node.js + Express + TypeScript
- PostgreSQL
- Prisma ORM
- Firebase Admin SDK

## Быстрый старт

### 1. Настройка Firebase

1. Создайте проект в [Firebase Console](https://console.firebase.google.com/)
2. Включите Authentication → Sign-in methods: Google и Email Link
3. Скопируйте конфигурацию в `.env` файлы

### 2. Локальная разработка

```bash
# Запуск PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Backend
cd backend
cp .env.example .env
# Заполните .env
npm install
npx prisma migrate dev
npm run dev

# Frontend (в другом терминале)
cd frontend
cp .env.example .env
# Заполните .env
npm install
npm run dev
```

### 3. Docker (production)

```bash
cp .env.example .env
# Заполните .env

docker-compose up -d --build
```

## Структура проекта

```
molly/
├── frontend/           # React приложение
│   ├── src/
│   │   ├── components/ # UI компоненты
│   │   ├── pages/      # Страницы
│   │   ├── store/      # Zustand stores
│   │   ├── api/        # API клиент
│   │   └── lib/        # Firebase, utils
│   └── Dockerfile
│
├── backend/            # Express API
│   ├── src/
│   │   ├── routes/     # API роуты
│   │   ├── middleware/ # Auth middleware
│   │   ├── services/   # Бизнес-логика
│   │   └── lib/        # Prisma, Firebase
│   ├── prisma/         # Схема БД
│   └── Dockerfile
│
└── docker-compose.yml
```

## API Endpoints

### Auth
- `POST /api/auth/verify` - Верификация токена

### Users
- `GET /api/users/me` - Текущий пользователь
- `PATCH /api/users/me` - Обновить профиль
- `GET /api/users/search?q=` - Поиск пользователей
- `GET /api/users/me/stats` - Статистика пользователя

### Games
- `GET /api/games` - Список игр
- `GET /api/games/:id` - Детали игры
- `POST /api/games` - Создать игру
- `POST /api/games/:id/start` - Начать игру
- `POST /api/games/:id/finish` - Завершить игру
- `POST /api/games/:id/players` - Добавить игрока
- `POST /api/games/:id/players/:playerId/buyin` - Buy-in
- `POST /api/games/:id/players/:playerId/cashout` - Cash out
- `PATCH /api/games/:id/players/:playerId` - Обновить игрока

### Stats
- `GET /api/stats/leaderboard` - Лидерборд
- `GET /api/stats/history` - История игр

## Деплой на Coolify

1. Создайте новый ресурс типа "Docker Compose"
2. Укажите репозиторий
3. Добавьте переменные окружения
4. Деплой!

## Лицензия

MIT

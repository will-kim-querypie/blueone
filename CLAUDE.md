# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blueone (블루원) - A delivery management web application (탁송 관리 웹앱) built as a Turbo monorepo with Next.js frontend and Express.js backend.

## Commands

```bash
# Development (from root)
npm run dev              # Start all dev servers
npm run build            # Build all packages
npm run check-types      # TypeScript check
npm run lint             # ESLint with auto-fix
npm run format           # Prettier format

# Backend specific (packages/server)
npm run db:create        # Create database
npm run db:migrate       # Run migrations
```

## Architecture

### Monorepo Structure
- `apps/web` - Next.js 14 frontend (App Router, Ant Design, React Query, Tailwind)
- `packages/server` - Express.js backend (Sequelize ORM, MySQL, Passport auth)
- `packages/eslint-config-base` - Shared ESLint configuration

### Frontend (apps/web/src/)
Uses Feature-Sliced Design (FSD) pattern:
- `app/` - Next.js App Router pages and layouts
- `entities/` - Domain entities (me, work)
- `features/` - Feature modules (contractor, subcontractor, sign-in, sign-out)
- `shared/` - Shared utilities, API client, UI components
- `widgets/` - Composite page-level components

API services are in `shared/api/services/` with query keys in `shared/api/query-keys.ts`.

### Backend (packages/server/src/)
- `models/` - Sequelize models (User, UserInfo, Work, Notice, NoticeConfirmation)
- `routes/` - Express route handlers (user, users, works, notices)
- `auth/` - Passport local strategy authentication
- `middlewares/` - Error handling and logging

### Database Relationships
- User hasMany Work, Notice; hasOne UserInfo
- User belongsToMany Notice (via NoticeConfirmation for read tracking)
- Work, Notice belongsTo User

## Key Configuration

- **Node.js**: >= v24.12.0
- **Path aliases**: Both packages use `@/*` → `src/*`
- **Session storage**: File-based in `sessions/` directory
- **CORS**: Backend allows only `https://blueone.vercel.app` in production

## Deployment

- Frontend: Vercel (https://blueone.vercel.app)
- Backend: Oracle Cloud with PM2 + Nginx (https://blueone.app)
- Database: MySQL on Oracle Cloud

## Environment Variables (packages/server/.env)

```
NODE_ENV=production|development
COOKIE_SECRET=<session secret>
DB_NAME=blueone
DB_PASSWORD=<mysql password>
CONTRACTOR_CREATE_KEY=<API key for contractor signup>
```

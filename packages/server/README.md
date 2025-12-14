# BLUEONE Backend Server

## Infrastructure

| 항목 | 값 |
|------|-----|
| Provider | Oracle Cloud (Always Free Tier) |
| Instance | Ampere A1 (4 OCPU, 24GB RAM) |
| OS | Ubuntu 24.04 LTS (ARM64) |
| Region | Seoul (ap-seoul-1) |

## Stack

| 항목 | 기술 |
|------|------|
| Runtime | Node.js 24.x (ARM64) |
| Framework | Express.js |
| Database | MySQL 8.x |
| ORM | Sequelize |
| Process Manager | PM2 |
| Web Server | Nginx (reverse proxy + SSL) |
| SSL | Let's Encrypt (Certbot 자동 갱신) |
| DNS | Cloudflare |

## Domain

| 용도 | 도메인 |
|------|--------|
| Backend API | https://blueone.app |
| Frontend | https://blueone.vercel.app |

## Server Configuration

### Nginx

- Config: `/etc/nginx/sites-available/blueone`
- HTTP → HTTPS 리다이렉트
- Reverse proxy to `127.0.0.1:8001`

### PM2

```bash
# 상태 확인
pm2 status

# 로그 확인
pm2 logs

# 재시작
pm2 restart app

# 서버 재부팅 시 자동 시작 설정됨
```

### SSL 인증서

- Let's Encrypt (자동 갱신)
- 경로: `/etc/letsencrypt/live/blueone.app/`
- 갱신: `sudo certbot renew`

## Environment Variables

`packages/server/.env`:

```
NODE_ENV=production
COOKIE_SECRET=<secret>
DB_NAME=blueone
DB_PASSWORD=<password>
CONTRACTOR_CREATE_KEY=<key>
```

## Deployment

```bash
# 1. SSH 접속 (IP는 Oracle Cloud 콘솔에서 확인)
ssh ubuntu@<SERVER_IP>

# 2. 코드 업데이트
cd ~/blueone
git pull

# 3. 의존성 설치 (필요시)
npm install

# 4. 서버 빌드
cd packages/server
npm run build

# 5. PM2 재시작
pm2 restart app
```

## Database

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스
USE blueone;
```

## Migration History

| 날짜 | 내용 |
|------|------|
| 2021-12-30 | AWS EC2 (t2.small) 초기 배포 |
| 2025-12-14 | Oracle Cloud (Ampere A1) 이전 |

### 2025-12-14 마이그레이션 상세

- **이전**: AWS EC2 t2.small (월 ~52,000원)
- **이후**: Oracle Cloud Ampere A1 (월 0원)
- **연간 절감**: ~624,000원
- DNS: AWS Route53 → Cloudflare
- 데이터 유실: 없음 (mysqldump 사용)

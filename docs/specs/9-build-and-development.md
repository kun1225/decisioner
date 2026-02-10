# 9. Build & Development

## Turborepo Pipeline

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:generate": { "cache": false },
    "db:migrate": { "cache": false },
    "lint": { "dependsOn": ["^build"] },
    "type-check": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

## Development Scripts

```bash
# Start all services
pnpm dev

# Database operations
pnpm db:up          # Start PostgreSQL (Docker)
pnpm db:down        # Stop PostgreSQL
pnpm db:generate    # Generate Drizzle client
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed test data

# Quality checks
pnpm lint           # Run ESLint
pnpm type-check     # Run TypeScript
pnpm test           # Run tests
```

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://decisioner:decisioner@localhost:5432/decisioner"

# API Server
API_PORT=4000
API_URL="http://localhost:4000"

# Web Server
WEB_PORT=3000

# Authentication (JWT + Google)
ACCESS_TOKEN_SECRET="your-access-token-secret-at-least-32-chars-long"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-at-least-32-chars-long"
GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"

# Environment
NODE_ENV="development"
```

## Docker Compose

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17-alpine
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: decisioner
      POSTGRES_PASSWORD: decisioner
      POSTGRES_DB: decisioner
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

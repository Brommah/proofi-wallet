FROM node:22-slim

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Install build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy entire monorepo (pnpm workspace needs all package.jsons)
COPY . .

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the API (|| true because of non-critical type errors with @cere-ddc-sdk)
RUN pnpm --filter @proofi/api build

WORKDIR /app/packages/api

CMD ["node", "dist/main.js"]

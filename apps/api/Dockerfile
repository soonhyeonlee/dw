FROM node:20-alpine AS builder

WORKDIR /app

# Root workspace files
COPY package.json package-lock.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN npm ci --workspace=apps/api --include-workspace-root
RUN npm run build --workspace=apps/api

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist/ ./apps/api/dist/

RUN npm install --workspace=apps/api --include-workspace-root --omit=dev --no-audit --no-fund

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]

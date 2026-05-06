FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/

RUN npm ci --workspace=apps/admin --include-workspace-root
RUN npm run build --workspace=apps/admin

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/admin/package.json ./apps/admin/
COPY --from=builder /app/apps/admin/.next/ ./apps/admin/.next/

RUN npm install --workspace=apps/admin --include-workspace-root --omit=dev --no-audit --no-fund

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "run", "start", "--workspace=apps/admin"]

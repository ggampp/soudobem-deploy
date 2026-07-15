FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY db ./db

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# rebuild bump: forja-2026-07-15
CMD ["npx", "tsx", "src/index.ts"]

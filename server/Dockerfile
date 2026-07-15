FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY db ./db

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]

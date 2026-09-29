# Build the static site
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Run: Express serves the built files
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "server/index.js"]

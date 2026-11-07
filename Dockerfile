FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG BUILD_COMMIT=development
ENV BUILD_COMMIT=$BUILD_COMMIT
RUN npm run build && npm prune --omit=dev
FROM node:24-bookworm-slim
ENV NODE_ENV=production DATA_DIR=/data PORT=3100 PUBLIC_PORT=3101
WORKDIR /app
COPY --from=build --chown=node:node /app /app
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 3100 3101
CMD ["npm", "start"]

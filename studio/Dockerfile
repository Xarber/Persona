FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG BUILD_COMMIT=development
ARG PERSONA_HOSTED=false
ENV BUILD_COMMIT=$BUILD_COMMIT PERSONA_HOSTED=$PERSONA_HOSTED
RUN npm run build && npm prune --omit=dev
FROM node:24-bookworm-slim
ENV NODE_ENV=production DATA_DIR=/data PORT=3100 PUBLIC_PORT=3101
WORKDIR /app
COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/tsconfig.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/src ./src
COPY --from=build --chown=node:node /app/dist ./dist
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 3100 3101
CMD ["npm", "start"]

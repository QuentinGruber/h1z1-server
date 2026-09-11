FROM node:24-alpine AS builder
LABEL maintainer="quentingruber@gmail.com"
WORKDIR /usr/src/app
COPY package.json package-lock.json tsconfig.json h1z1-server.js ./
COPY src/ ./src/
COPY tsconfigs/ ./tsconfigs/
RUN npm install

FROM node:24-alpine
LABEL maintainer="quentingruber@gmail.com"
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/out/ ./out/
COPY --from=builder /usr/src/app/h1z1-server.js ./
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/package-lock.json ./
COPY data/ ./data/
COPY docker/ ./docker/
RUN npm install --omit=dev --ignore-scripts
ENV NODE_ENV="production"
ENV DISABLE_PLUGINS=true
# Zone server port
EXPOSE 1117/udp
CMD [ "node", "./docker/2016/zoneServer.js" ]

FROM node:21-alpine
LABEL maintainer="quentingruber@gmail.com"
WORKDIR /usr/src/app
COPY . .
RUN npm i --omit=dev
ENV NODE_ENV="production"
# Login server port
EXPOSE 1115/udp
CMD [ "node", "./docker/2015/loginServer.js" ]

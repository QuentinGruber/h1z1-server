FROM node:16-alpine
LABEL maintainer="quentingruber@gmail.com"
WORKDIR /usr/src/app
COPY . .
RUN npm i --production
# Login server port
EXPOSE 1115/udp
CMD [ "node", "./docker/2015/loginServer.js" ]

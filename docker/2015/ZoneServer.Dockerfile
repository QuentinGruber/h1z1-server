FROM node:16-alpine 
LABEL maintainer="quentingruber@gmail.com"
WORKDIR /usr/src/app
COPY . .
RUN npm i --production
ENV NODE_ENV="production"
# Zone server port
EXPOSE 1117/udp
CMD [ "node", "./docker/2015/zoneServer.js" ]

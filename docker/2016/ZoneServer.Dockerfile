FROM node:21-alpine 
LABEL maintainer="quentingruber@gmail.com"
WORKDIR /usr/src/app
COPY . .
RUN npm i --omit=dev
ENV NODE_ENV="production"
# Zone server port
EXPOSE 1117/udp
CMD [ "node", "./docker/2016/zoneServer.js" ]

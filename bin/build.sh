RUN pkg -t node16-win-x64 ./2015/loginServer.js --output ./loginServer.exe
RUN pkg -t node16-win-x64 ./2015/zoneServer.js --output ./zoneServer.exe
RUN pkg -t node16-win-x64 ./2015/h1emuServer.js --output ./h1emuServer.exe
RUN pkg -t node16-win-x64 ./2016/loginServer.js --output ./loginServer-2016.exe
RUN pkg -t node16-win-x64 ./2016/zoneServer.js --output ./zoneServer-2016.exe
RUN pkg -t node16-win-x64 ./2016/h1emuServer.js --output ./h1emuServer-2016.exe
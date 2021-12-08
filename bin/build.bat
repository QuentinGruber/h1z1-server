START pkg --compress GZip -t node16-win-x64 ./2015/loginServer.js --output ./loginServer.exe
START pkg --compress GZip -t node16-win-x64 ./2015/zoneServer.js --output ./zoneServer.exe
START pkg --compress GZip -t node16-win-x64 ./2015/h1emuServer.js --output ./h1emuServer.exe
START pkg --compress GZip -t node16-win-x64 ./2016/loginServer.js --output ./loginServer-2016.exe
START pkg --compress GZip -t node16-win-x64 ./2016/zoneServer.js --output ./zoneServer-2016.exe
START pkg --compress GZip -t node16-win-x64 ./2016/h1emuServer.js --output ./h1emuServer-2016.exe
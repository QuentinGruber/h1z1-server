pkg -t node16-win-x64 --compress GZip ./bin/shared/loginServer.js --output ./bin/loginServer.exe
pkg -t node16-win-x64 --compress GZip ./bin/2015/zoneServer.js --output ./bin/zoneServer.exe
pkg -t node16-win-x64 --compress GZip ./bin/2015/h1emuServer.js --output ./bin/h1emuServer.exe
pkg -t node16-win-x64 --compress GZip ./bin/2016/zoneServer.js --output ./bin/zoneServer-2016.exe
pkg -t node16-win-x64 --compress GZip ./bin/2016/h1emuServer.js --output ./bin/h1emuServer-2016.exe
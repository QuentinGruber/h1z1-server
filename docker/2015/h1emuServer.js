
const { spawn } = require('child_process');

const loginServer = spawn('node', ['./loginServer.js']);
const zoneServer = spawn('node', ['./zoneServer.js']);


loginServer.stdout.on('data', (data) => {
        console.log(`${data}`);
      });
      
      loginServer.stderr.on('data', (data) => {
        console.log(`${data}`);
      });
      
      loginServer.on('close', (code) => {
          if(code){  
            throw new Error((`${name}(${version}) exited with code ${code}`));
          }
      });

      zoneServer.stdout.on('data', (data) => {
        console.log(`${data}`);
      });
      
      zoneServer.stderr.on('data', (data) => {
        console.log(`${data}`);
      });
      
      zoneServer.on('close', (code) => {
          if(code){  
            throw new Error((`${name}(${version}) exited with code ${code}`));
          }
      });

// sur 2 process puis push et regarder pk ça marche plu :(((())))
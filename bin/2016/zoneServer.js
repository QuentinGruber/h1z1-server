if (process.env.APM_ENABLED == "true") {
  require("elastic-apm-node").start({
    serviceName: process.env.ELASTIC_APM_SERVICE_NAME,
    secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
    serverUrl: process.env.ELASTIC_APM_SERVER_URL,
    environment: process.env.ELASTIC_APM_ENVIRONMENT,
  });
}

const { ZoneServer2016 } = require("../../h1z1-server");
const Zone = new ZoneServer2016(
  1117,
  Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64")
);
Zone.start();

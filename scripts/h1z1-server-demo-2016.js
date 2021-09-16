#!/usr/bin/env node
const { Worker } = require("worker_threads");
new Worker(`${__dirname}/demo/loginserver2016.js`)
new Worker(`${__dirname}/demo/ZoneServer2016.js`)
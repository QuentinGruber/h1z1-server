#!/usr/bin/env node
const { Worker } = require("worker_threads");
new Worker(`${__dirname}/demo/loginserver2015.js`)
new Worker(`${__dirname}/demo/ZoneServer2015.js`)
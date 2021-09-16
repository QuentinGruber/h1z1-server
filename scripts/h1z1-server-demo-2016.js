#!/usr/bin/env node
const { Worker } = require("worker_threads");
new Worker("./demo/loginserver2016.js")
new Worker("./demo/ZoneServer2016.js")
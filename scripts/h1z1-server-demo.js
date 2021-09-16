#!/usr/bin/env node
const { Worker } = require("worker_threads");
new Worker("./demo/loginserver2015.js")
new Worker("./demo/ZoneServer2015.js")
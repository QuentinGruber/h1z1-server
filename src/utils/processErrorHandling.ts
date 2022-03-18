process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled rejection at ", promise, `reason: ${reason}`);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.log(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on("SIGTERM", (signal) => {
  console.log(`Process ${process.pid} received a SIGTERM signal`);
  process.exit(0);
});

process.on("SIGINT", (signal) => {
  console.log(`Process ${process.pid} has been interrupted`);
  process.exit(0);
});

process.on("beforeExit", (code) => {
  console.log(`Process will exit with code: ${code}`);
});

process.on("exit", (code) => {
  console.log(`Process exited with code: ${code}`);
});

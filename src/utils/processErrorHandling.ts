// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

process.on("unhandledRejection", (reason, promise) => {
  console.log(
    "Unhandled rejection at ",
    promise,
    `reason: ${reason} at ${new Date()}`
  );
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.log(`Uncaught Exception: ${err.message} time : ${new Date()}`);
  console.error(err.stack);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log(
    `Process ${process.pid} received a SIGTERM signal time : ${new Date()}`
  );
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log(
    `Process ${process.pid} has been interrupted time : ${new Date()}`
  );
  process.exit(1);
});

process.on("beforeExit", (code) => {
  console.log(`Process will exit with code: ${code} time : ${new Date()}`);
});

process.on("exit", (code) => {
  console.log(`Process exited with code: ${code} time : ${new Date()}`);
});

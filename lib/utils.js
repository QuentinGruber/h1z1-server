exports.log = function (msg, type) {
  switch (type) {
    case 0:
      console.log("[INFO]" + msg);
      break;

    case 1:
      console.log("[WARN]" + msg);
      break;

    case 2:
      console.log("[ERROR]" + msg);
      break;

    default:
      console.log("[INFO]" + msg);
      break;
  }
};

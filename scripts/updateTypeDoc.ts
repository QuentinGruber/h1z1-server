import fs from "fs";

// Read all files in the src directory recursively

function walkSync(dir: string, filelist: string[] = []) {
  fs.readdirSync(dir).forEach((file) => {
    const dirFile = `${dir}/${file}`;
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err: any) {
      if (err.code === "ENOTDIR" || err.code === "EBUSY")
        filelist = [...filelist, dirFile];
      else throw err;
    }
  });
  return filelist;
}

const files = walkSync("src");

// Filter out all files that are not TypeScript
files.filter((file) => file.endsWith(".ts"));

// Create an array of all the file names
const fileNames = files.map((file) => `${file}`);

console.log(`Found ${fileNames.length} files`);

const typeDocConfig = require("../typedoc.json");

typeDocConfig.entryPoints = fileNames;

// Write the file back to disk
fs.writeFileSync("./typedoc.json", JSON.stringify(typeDocConfig, null, 2));
console.log("Updated typedoc.json");

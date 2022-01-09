import glob from "glob";
import fs from "fs";

const signatureHeader = fs
  .readFileSync(`${__dirname}/../signature-header.txt`)
  .toString();
glob("src/**/*", (err: any, res: any) => {
  if (err) {
    console.log("Error", err);
  } else {
    const files = res.filter((e: any) => {
      return e.includes(".");
    });
    files.forEach((filePath: string) => {
      fs.readFile(`${filePath}`, (err: any, data: any) => {
        if (!data.toString().includes(signatureHeader)) {
          console.log(data.toString());
        }
      });
    });
  }
});

// @ts-ignore
import glob from "glob";
import fs from "fs";

const signatureHeader = fs
  .readFileSync(`${__dirname}/../signature-header.txt`)

glob("src/**/*", (err: any, res: any) => {
  if (err) {
    console.log("Error", err);
  } else {
    const files = res.filter((e: any) => {
      return e.includes(".");
    });
    files.forEach((filePath: string) => {
      fs.readFile(`${filePath}`, (err: any, data: any) => {
        const dataHeader:Buffer = data.slice(0, signatureHeader.length);
        if (Buffer.compare(dataHeader, signatureHeader) > 0) {
          console.log(filePath);
          const newData = signatureHeader + data;
          fs.writeFile(filePath,newData,()=>{})
        }
      });
    });
  }
});

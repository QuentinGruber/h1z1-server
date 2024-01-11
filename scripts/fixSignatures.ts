import fs from "fs";

const signatureHeader = fs.readFileSync(`${__dirname}/../signature-header.txt`);

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

files.forEach((filePath: string) => {
  fs.readFile(`${filePath}`, (err: any, data: any) => {
    // get the offset of the first character of the signature header
    const offset = data.indexOf(signatureHeader[0]) - 1;
    const dataHeader: Buffer = data.slice(offset ?? 0, signatureHeader.length);
    if (Buffer.compare(dataHeader, signatureHeader) > 0) {
      console.log(filePath);
      const newData = signatureHeader + data;
      fs.writeFile(filePath, newData, () => {});
    }
  });
});

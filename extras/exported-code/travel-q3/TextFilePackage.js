const fs = require("fs");
const path = require("path");
 
class TextFilePackage {
  constructor(fileName) {
    this.fileName = fileName.endsWith(".txt") ? fileName : `${fileName}.txt`;
    if (!fs.existsSync(this.fileName)) {
      fs.writeFileSync(this.fileName, "", "utf8");
    }
  }
 
  addContent(content) {
    fs.appendFileSync(this.fileName, String(content), "utf8");
  }
 
  hasWord(word) {
    const text = fs.readFileSync(this.fileName, "utf8");
    return text.split(/\s+/).includes(word);
  }
 
  renameFile(newName) {
    const nextName = newName.endsWith(".txt") ? newName : `${newName}.txt`;
    fs.renameSync(this.fileName, nextName);
    this.fileName = nextName;
  }
 
  copy() {
    const parsed = path.parse(this.fileName);
    const copyName = path.join(parsed.dir, `${parsed.name}copy${parsed.ext}`);
    fs.copyFileSync(this.fileName, copyName);
    return copyName;
  }
}
 
module.exports = TextFilePackage;
 
// usage:
// const TextFilePackage = require("./TextFilePackage");
// const file = new TextFilePackage("exam");
// file.addContent("hello world");
// console.log(file.hasWord("hello"));
// file.renameFile("newExam");
// file.copy();

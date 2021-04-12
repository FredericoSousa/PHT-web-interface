const utils = require("./utils");
const { cleanDirectories } = require("./upload");
const { exec } = require("child_process");
const fs = require("fs");
const { phtPath, uploadsPath } = require("./constants");

const run = (params) => {
  const paramString = utils.getParamString(params);
  const path = `${phtPath}/pht.pl ${paramString}`;
  console.log(path);
  fs.writeFileSync("done", "0");
  exec(path, (error, data) => {
    if (error) console.log(error);
    else {
      console.log(data);
      utils.csv2xlsx();
      cleanDirectories();
      fs.writeFileSync("done", "1");
    }
  });
};

const getXlsxPath = (id = "") => {
  let resultId = id;
  if (!id) resultId = utils.getLastResultId;
  const path = `./results/${resultId}/resultado_final.xlsx`;
  return path;
};

const getResultZip = (id = "") => {
  return utils.zipResultFiles(id);
};

const getOutputZip = (id = "") => {
  return utils.zipOutputFiles(id);
};

const isDone = () => {
  return !!Number(fs.readFileSync("./done").toString());
};

module.exports = { run, getXlsxPath, isDone, getResultZip, getOutputZip };

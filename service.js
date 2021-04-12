const utils = require("./utils");
const { cleanDirectories, createDirectories } = require("./upload");
const { spawn } = require("child_process");
const fs = require("fs");
const { phtPath } = require("./constants");

const run = (params, res) => {
  const paramString = utils.getParamString(params);
  const path = `${phtPath}/pht.pl ${paramString}`;
  console.log(path);
  fs.writeFileSync("done", "0");
  createDirectories();
  const execution = spawn("/PHT/pht.pl", paramString.split(" "));
  let id = "";
  execution.stdout.on("data", (data) => {
    const stringData = data.toString();
    console.log(stringData);
    if (stringData.includes("O id da execução é")) {
      const arrayData = stringData.split("\n")[0].split(" ");
      id = arrayData[arrayData.length - 1];
      utils.createExecution(id, params);
      res.json({ id, params });
    }
  });
  execution.on("exit", (code) => {
    if (code === 0) {
      utils.csv2xlsx();
      cleanDirectories();
      utils.endExecution(id);
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

const getExecution = (id) => {
  return utils.getExecution(id);
};

module.exports = { run, getXlsxPath, getExecution, getResultZip, getOutputZip };

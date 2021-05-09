const utils = require("./utils");
const { cleanDirectories } = require("./upload");
const { spawn, execSync } = require("child_process");
const fs = require("fs");
const { phtPath } = require("./constants");

let execution;

const run = (params, res) => {
  const paramString = utils.getParamString(params);
  const path = `${phtPath}/pht.pl ${paramString}`;
  console.log(path);
  execution = spawn("perl", ["/PHT/pht.pl", ...paramString.split(" ")]);
  let id = "";
  execution.stdout.on("data", (data) => {
    const stringData = data.toString().trim();
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
    } else if (code === null) {
      console.log("Execução abortada");
      cleanDirectories();
      utils.abortExecution(id);
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

const idToDate = (id) => {
  const year = id.substring(0, 4);
  const month = id.substring(4, 6);
  const day = id.substring(6, 8);
  const hour = id.substring(8, 10);
  const minutes = id.substring(10, 12);
  return `${day}/${month}/${year} ${hour}:${minutes}`;
};

const getExecutions = (q) => {
  return fs
    .readdirSync("./executions")
    .filter((file) => file.includes(".json") && file.startsWith(q))
    .map((file) => {
      const id = file.split(".")[0];
      const execution = getExecution(id);
      return {
        ...execution,
        date: idToDate(id),
      };
    })
    .sort((b, a) => a.id - b.id);
};

const getExecution = (id) => {
  return utils.getExecution(id);
};

const deleteExecutions = (ids = []) => {
  ids.forEach((id) => {
    try {
      fs.rmSync(`./executions/${id}.json`);
      execSync(`rm -rf /api/results/${id}`);
      execSync(`rm -rf /PHT/resultados/${id}`);
    } catch (error) {}
  });
};

const abortExecution = (id) => {
  execution.kill();
  return utils.abortExecution(id);
};

module.exports = {
  run,
  getXlsxPath,
  getExecution,
  getExecutions,
  getResultZip,
  getOutputZip,
  deleteExecutions,
  abortExecution,
};

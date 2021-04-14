const xlsx = require("json-as-xlsx");
const csv2json = require("csvtojson");
const fs = require("fs");
const AdmZip = require("adm-zip");
const { phtPath } = require("./constants");

const getParamString = (params = {}) => {
  const files =
    "--in /api/uploads/fastq/ --primers /api/uploads/primers/ --depara /api/uploads/identification/ --ref_seqs /api/uploads/references/";

  return (
    Object.entries(params)
      .reduce((paramString, [key, value]) => {
        paramString += `--${key} ${value} `;
        return paramString;
      }, "")
      .trim() + ` ${files}`
  );
};

const getLastResultId = () => {
  const results = fs.readdirSync(`${phtPath}/resultados`).sort((a, b) => b - a);
  return results[0];
};

const csv2xlsx = () => {
  const lastResult = getLastResultId();
  if (!lastResult) return;
  csv2json()
    .fromFile(
      `${phtPath}/resultados/${lastResult}/resultados_finais/resultado_final.csv`
    )
    .then((json) => {
      const columns = Object.keys(json[0]).map((c) => ({
        label: c,
        value: c,
      }));
      const settings = {
        sheetName: "resultado_final",
        fileName: "resultado_final",
        extraLength: 3,
        writeOptions: {},
      };
      const data = xlsx(columns, json, settings, false);
      fs.mkdirSync(`./results/${lastResult}`);
      fs.writeFileSync(`./results/${lastResult}/resultado_final.xlsx`, data);
    });
};

const zipResultFiles = (id = "") => {
  let resultId = id;
  if (!id) resultId = getLastResultId();
  const file = new AdmZip();
  file.addLocalFolder(`${phtPath}/resultados/${resultId}/resultados_finais`);
  file.addLocalFile(`./results/${resultId}/resultado_final.xlsx`);
  fs.writeFileSync(
    `./results/${resultId}/resultados_finais.zip`,
    file.toBuffer()
  );
  return `./results/${resultId}/resultados_finais.zip`;
};

const zipOutputFiles = (id = "") => {
  let resultId = id;
  if (!id) resultId = getLastResultId();
  const file = new AdmZip();
  file.addLocalFolder(`${phtPath}/resultados/${resultId}`);
  file.addLocalFile(`./results/${resultId}/resultado_final.xlsx`);
  fs.writeFileSync(`./results/${resultId}-output.zip`, file.toBuffer());
  return `./results/${resultId}-output.zip`;
};

const saveExecution = (execution) => {
  fs.writeFileSync(
    `./executions/${execution.id}.json`,
    JSON.stringify(execution)
  );
};

const getExecution = (id) => {
  try {
    const data = fs.readFileSync(`./executions/${id}.json`).toString();
    const execution = JSON.parse(data);
    return execution;
  } catch (error) {
    return undefined;
  }
};

const getLastExecution = () => {
  const lastExecutionId = fs
    .readdirSync("./executions")
    .map((e) => e.replace(".json", ""))
    .sort((a, b) => b - a)[0];
  if (lastExecutionId) return getExecution(lastExecutionId);
  return undefined;
};

const createExecution = (id, params) => {
  saveExecution({ id, params, isDone: false });
};

const endExecution = (id) => {
  const execution = getExecution(id);
  if (execution) {
    execution.isDone = true;
    saveExecution(execution);
  }
};

module.exports = {
  getParamString,
  csv2xlsx,
  getLastResultId,
  zipResultFiles,
  zipOutputFiles,
  createExecution,
  endExecution,
  getExecution,
  getLastExecution,
};

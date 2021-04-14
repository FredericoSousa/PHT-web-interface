const { getLastExecution } = require("./utils");

module.exports = (req, res, next) => {
  const execution = getLastExecution();
  if ((execution && execution.isDone) || !execution) next();
  else
    res.status(400).json({ message: "Já existe uma execução em andamento." });
};

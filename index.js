const express = require("express");
const { upload } = require("./upload");
const service = require("./service");
const middleware = require("./middleware");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("./public"));

app.post("/run", middleware, upload, async (req, res) => {
  try {
    const { body } = req;
    service.run(body, res);
  } catch (error) {
    const { message } = error;
    res.status(500).json({ message });
  }
});

app.get("/xlsx/:id", (req, res) => {
  try {
    const { id } = req.params;
    const path = service.getXlsxPath(id);
    res.download(path, (err) => {
      if (err && err.code === "ENOENT")
        res.status(404).json({ message: "Arquivo não encontrado." });
    });
  } catch (error) {
    const { message } = error;
    res.status(500).json({ message });
  }
});

app.get("/result-zip/:id", (req, res) => {
  try {
    const { id } = req.params;
    const path = service.getResultZip(id);
    res.download(path, (err) => {
      if (err && err.code === "ENOENT")
        res.status(404).json({ message: "Arquivo não encontrado." });
    });
  } catch (error) {
    const { message } = error;
    res.status(500).json({ message });
  }
});

app.get("/output-zip/:id", (req, res) => {
  try {
    const { id } = req.params;
    const path = service.getOutputZip(id);
    res.download(path, (err) => {
      if (err && err.code === "ENOENT")
        res.status(404).json({ message: "Arquivo não encontrado." });
    });
  } catch (error) {
    const { message } = error;
    res.status(500).json({ message });
  }
});

app.get("/execution", (req, res) => {
  try {
    const { q } = req.query;
    const executions = service.getExecutions(q);
    res.status(200).json(executions);
  } catch (error) {
    return res.status(500).json({ message: "Falha ao buscar as execuções." });
  }
});

app.get("/execution/:id", (req, res) => {
  const { id } = req.params;
  const execution = service.getExecution(id);
  if (!execution) res.status(404).json({ message: "Execução não encontrada." });
  else res.json(execution);
});

app.delete("/execution", (req, res) => {
  try {
    service.deleteExecutions(req.body);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/execution/:id", (req, res) => {
  try {
    const { id } = req.params;
    const execution = service.abortExecution(id);
    res.json(execution);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`listen on port ${PORT}`));

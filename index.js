const express = require("express");
const bodyParser = require("body-parser");
const { upload } = require("./upload");
const service = require("./service");
const middleware = require("./middleware");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
        res.status(404).json({ message: "File not found!" });
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
        res.status(404).json({ message: "File not found!" });
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
        res.status(404).json({ message: "File not found!" });
    });
  } catch (error) {
    const { message } = error;
    res.status(500).json({ message });
  }
});

app.get("/executions", (req, res) => {
  const { q } = req.query;
  const executions = service.getExecutions(q);
  res.status(200).json(executions);
});

app.get("/execution/:id", (req, res) => {
  const { id } = req.params;
  const execution = service.getExecution(id);
  if (!execution) res.status(404).json({ message: "Execution not found!" });
  else res.json(execution);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`listen on port ${PORT}`));

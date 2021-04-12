const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("./public"));

const { upload } = require("./upload");

const service = require("./service");

app.post("/run", upload, async (req, res) => {
  try {
    const { body } = req;
    service.run(body);
    res.json({ running: true });
  } catch (error) {
    const { message } = error;
    res.status(500).json({ message });
  }
});

app.get("/xlsx", (req, res) => {
  try {
    const { id } = req.query;
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

app.get("/result-zip", (req, res) => {
  try {
    const { id } = req.query;
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

app.get("/output-zip", (req, res) => {
  try {
    const { id } = req.query;
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

app.get("/done", (req, res) => {
  const isDone = service.isDone();
  res.json({ isDone });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`listen on port ${PORT}`));

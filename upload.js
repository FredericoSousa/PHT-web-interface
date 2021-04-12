const multer = require("multer");
const fs = require("fs");
const { uploadsPath } = require("./constants");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const path = `${uploadsPath}/${file.fieldname}`;
    cb(null, path);
  },
  filename: (req, file, cb) => {
    const { originalname } = file;
    cb(null, originalname);
  },
});

const upload = multer({ storage });

const createDirectories = () => {
  fs.mkdir(uploadsPath, () => {});
  fs.mkdir(`${uploadsPath}/fastq`, () => {});
  fs.mkdir(`${uploadsPath}/identification`, () => {});
  fs.mkdir(`${uploadsPath}/primers`, () => {});
  fs.mkdir(`${uploadsPath}/references`, () => {});
};

const cleanDirectories = () => {
  fs.rmdirSync(`${uploadsPath}`, { recursive: true });
  createDirectories();
};

module.exports = {
  upload: upload.fields([
    {
      name: "fastq", //sequencias
    },
    {
      name: "identification", //depara
      maxCount: 1,
    },
    { name: "primers", maxCount: 1 }, //primers
    { name: "references", maxCount: 1 }, //referencias
  ]),
  cleanDirectories,
  createDirectories,
};

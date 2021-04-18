const multer = require("multer");
const { execSync } = require("child_process");
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

const cleanDirectories = () => {
  execSync(`rm -rf ${uploadsPath}/fastq/*`);
  execSync(`rm -rf ${uploadsPath}/identification/*`);
  execSync(`rm -rf ${uploadsPath}/primers/*`);
  execSync(`rm -rf ${uploadsPath}/references/*`);
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
};

const fields = [
  "cpu",
  "quality_cutoff",
  "quality_percent_cutoff",
  "len_cutoff",
  "weigth",
  "cov",
  "ident_cutoff",
];

const fileFields = ["fastq", "identification", "primers", "references"];

const validateFields = (element, isInt = false) => {
  const min = Number(element.min);
  const max = Number(element.max);
  const value = Number(element.value);
  if (
    (min !== undefined && min > value) ||
    (max > 0 && max < value) ||
    (isInt !== undefined && !Number.isInteger(value))
  ) {
    element.classList.add("is-invalid");
  } else {
    element.classList.remove("is-invalid");
  }
};

const validateFileFields = (element) => {
  const fileCount = element.files.length;
  if (fileCount === 0) {
    element.classList.add("is-invalid");
  } else {
    element.classList.remove("is-invalid");
  }
};

// TODO: FILE FIELDS VERIFICATION

const getFiles = () => {
  return fileFields.map((fileField) => {
    const element = document.querySelector(`#${fileField}`);
    validateFileFields(element);
    return { key: fileField, files: element.files };
  });
};

const getParams = () => {
  return fields.reduce((params, field) => {
    const element = document.querySelector(`#${field}`);
    const value = Number(element.value);
    params[field] = value;
    validateFields(element, ["len_cutoff", "weigth"].includes(field));
    return params;
  }, {});
};

const isValid = () => {
  return document.querySelectorAll(".is-invalid").length === 0;
};

const getForm = () => {
  const params = getParams();
  const form = new FormData();
  Object.entries(params).forEach(([key, value]) => {
    form.append(key, value);
  });
  getFiles().forEach((file) => {
    if (file.files.length > 1) {
      for (const f of file.files) {
        form.append(`${file.key}`, f);
      }
      return;
    }
    form.append(file.key, file.files[0]);
  });
  return form;
};

const download = (path) => {
  if (!path) return;
  const fileName = path.split("-")[0];
  fetch(`/${path}`).then((res) => {
    if (res.status === 404) showToast("Arquivo não encontrado");
    else {
      res.blob().then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
    }
  });
};

const showToast = (messsage) => {
  const toastEl = document.querySelector(".toast");
  const toast = new bootstrap.Toast(toastEl, {
    animation: true,
    autohide: true,
  });
  toastEl.querySelector(".toast-body").innerHTML = messsage;
  toast.show();
};

const disableForm = () => {
  const startButton = document.querySelector("#start");
  const loadingButton = document.querySelector("#loading");
  [...fields, ...fileFields].forEach((f) => {
    document.querySelector(`#${f}`).disabled = true;
  });
  startButton.disabled = true;
  startButton.classList.add("hide");
  loadingButton.classList.remove("hide");
};

const enableForm = () => {
  const startButton = document.querySelector("#start");
  const loadingButton = document.querySelector("#loading");
  [...fields, ...fileFields].forEach((f) => {
    document.querySelector(`#${f}`).disabled = false;
  });
  startButton.disabled = false;
  startButton.classList.remove("hide");
  loadingButton.classList.add("hide");
};

const submit = () => {
  const form = getForm();
  if (!isValid()) {
    showToast("Campos inválidos.");
    return;
  }
  disableForm();
  fetch("/run", {
    method: "POST",
    body: form,
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.message) {
        showToast(res.message);
        setTimeout(() => {
          enableForm();
        }, 1000);
        return;
      }
    });
  const interval = setInterval(() => {
    fetch("/done")
      .then((res) => res.json())
      .then((res) => {
        if (res.isDone) {
          clearInterval(interval);
          document.querySelector("#form").classList.add("hide");
          document.querySelector("#result").classList.remove("hide");
        }
      });
  }, 5000);
};

const returnToForm = () => {
  document.querySelector("#form").classList.remove("hide");
  document.querySelector("#result").classList.add("hide");
  enableForm();
};

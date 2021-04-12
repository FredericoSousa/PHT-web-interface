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

const getExecutionId = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
};

const download = (path) => {
  if (!path) return;
  const id = getExecutionId();
  const fileName = `${id}-${path.split("-")[0]}`;
  fetch(`/${path}/${id}`).then((res) => {
    if (res.status === 404) showToast("Arquivo não encontrado");
    else if (res.status !== 200) showToast("Não foi possível baixar o arquivo");
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

const showResults = () => {
  document.querySelector("#form").classList.add("hide");
  document.querySelector("#result").classList.remove("hide");
};

const getExecution = (id) => {
  return fetch(`/execution/${id}`).then((res) => res.json());
};

const watchExecution = (id) => {
  const interval = setInterval(
    () =>
      getExecution(id).then((res) => {
        if (res.message) {
          showToast(res.message);
          setExecutionId();
        } else if (res.isDone) {
          clearInterval(interval);
          showResults();
        }
      }),
    5000
  );
};

const setExecutionId = (id) => {
  let url = window.location.origin;
  if (id) url += `?id=${id}`;
  window.history.pushState({ path: url }, "", url);
};

const resetForm = () => {
  [...fields, fileFields].forEach((f) => {
    const element = document.querySelector(`#${f}`);
    element.value = element.defaultValue;
  });
  enableForm();
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
      } else {
        if (res.id) {
          setExecutionId(res.id);
          watchExecution(res.id);
        }
      }
    });
};

const returnToForm = () => {
  document.querySelector("#form").classList.remove("hide");
  document.querySelector("#result").classList.add("hide");
  setExecutionId();
  resetForm();
};

const fillFields = (params) => {
  if (params) {
    fields.forEach((f) => {
      document.querySelector(`#${f}`).value = params[f];
    });
  }
};

window.onload = () => {
  const id = getExecutionId();
  if (id) {
    getExecution(id).then((res) => {
      if (!res.message) {
        disableForm();
        fillFields(res.params);
        if (res.isDone) showResults();
        else watchExecution(id);
      } else {
        showToast(res.message);
        setExecutionId();
      }
    });
  }
};

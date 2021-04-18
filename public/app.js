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

let interval;

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

const showToast = (messsage, type = "danger") => {
  const toastEl = document.querySelector(".toast");
  const toast = new bootstrap.Toast(toastEl, {
    animation: true,
    autohide: true,
  });
  toastEl.querySelector(".toast-body").innerHTML = messsage;
  toastEl.classList.remove(`bg-danger`);
  toastEl.classList.remove(`bg-success`);
  toastEl.classList.remove(`bg-info`);
  toastEl.classList.remove(`bg-warning`);
  toastEl.classList.add(`bg-${type}`);
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

const showResults = (id) => {
  if (id) setExecutionId(id);
  const executionId = getExecutionId();
  getExecution(executionId).then((res) => {
    if (res.isDone) {
      document.querySelector(
        "#executionId"
      ).innerHTML = `Execução #${executionId}`;
      document.querySelector("#form").classList.add("hide");
      document.querySelector("#executions").classList.add("hide");
      document.querySelector("#result").classList.remove("hide");
    } else {
      returnToForm(executionId);
      watchExecution(executionId);
      fillFields(res.params);
      disableForm();
    }
  });
};

const getExecution = (id) => {
  return fetch(`/execution/${id}`).then((res) => res.json());
};

const watchExecution = (id) => {
  clearInterval(interval);
  interval = setInterval(
    () =>
      getExecution(id).then((res) => {
        if (res.message) {
          showToast(res.message);
          setExecutionId();
          clearInterval(interval);
        } else if (res.isDone) {
          clearInterval(interval);
          showResults();
        }
      }),
    5000
  );
};

const setLoadingId = (id) => {
  document.querySelector("#running").innerHTML = `Executando ${
    id ? `#${id}` : ""
  }`;
};

const setExecutionId = (id) => {
  let url = window.location.origin;
  if (id) url += `?id=${id}`;
  window.history.pushState({ path: url }, "", url);
  setLoadingId(id);
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
        }, 500);
        return;
      } else {
        if (res.id) {
          setExecutionId(res.id);
          watchExecution(res.id);
        }
      }
    });
};

const returnToForm = (id) => {
  document.querySelector("#form").classList.remove("hide");
  document.querySelector("#result").classList.add("hide");
  document.querySelector("#executions").classList.add("hide");

  setExecutionId(id);
  resetForm();
};

const fillFields = (params) => {
  if (params) {
    fields.forEach((f) => {
      document.querySelector(`#${f}`).value = params[f];
    });
  }
};

const getExecutions = (q = "") => {
  return fetch(`/execution?q=${q}`).then((res) => res.json());
};

const searchInput = document.querySelector("#executionSearch");

const getExecutionsTable = (q = "") => {
  const executionList = document.querySelector("#executionList");
  executionList.innerHTML = "";

  getExecutions(q).then((res) => {
    if (res.length > 0) {
      res.forEach((e) => {
        const item = `
    <tr>
        <td>
          <input class="form-check-input" type="checkbox" id="${
            e.id
          }" onchange="verifyChecked()">
        </td>
        <td><strong>${e.id}<stong></td>
        <td>${
          e.isDone
            ? '<span class="badge bg-success">Finalizada</span>'
            : '<span class="badge bg-primary">Em execução</span>'
        }</td>
        <td>${e.date}</td>
        <td>
            <a href="" onclick="showResults(${e.id})">Visualizar</a>
        </td>
    </tr>


     `;
        executionList.innerHTML += item;
      });
    } else {
      executionList.innerHTML += `
      <tr>
        <td colspan="5" class="text-center">Nenhuma execução encontrada</td>
      </tr>`;
    }
  });
};

const checkAll = () => {
  const checked = document.querySelector("#checkAll").checked;
  document.querySelectorAll("td>input").forEach((i) => (i.checked = checked));
};

const verifyChecked = () => {
  const allChecked = [...document.querySelectorAll("td>input")].every(
    (i) => i.checked === true
  );
  document.querySelector("#checkAll").checked = allChecked;
};

const showModal = (title, body, footer) => {
  document.querySelector(".modal-title").innerHTML = title;
  document.querySelector(".modal-body").innerHTML = body;
  document.querySelector(".modal-footer").innerHTML = footer;
  const modal = new bootstrap.Modal(document.querySelector(".modal"), {});
  modal.show();
};

const closeModal = () => {
  document.querySelector("#closeModal").click();
};

const deleteConfirmation = () => {
  const checkeds = [...document.querySelectorAll("td>input")]
    .filter((i) => i.checked)
    .map((i) => `<strong>${i.id}</strong>`);
  if (checkeds.length > 0) {
    showModal(
      "Tem certeza?",
      `<p>Tem certeza que deseja exluir ${
        checkeds.length > 1 ? "as execuções" : "a execução"
      } ${checkeds.join(", ")} ?</p>`,
      `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
       <button type="button" class="btn btn-danger" onclick="deleteExexecutions()">Excluir</button>`
    );
  } else {
    showToast("Nenhuma execução selecionada.", "warning");
  }
};

const deleteExexecutions = () => {
  const checkeds = [...document.querySelectorAll("td>input")]
    .filter((i) => i.checked)
    .map((i) => i.id);
  if (checkeds.length === 0) return;
  fetch("/execution", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(checkeds),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.message) showToast(res.message);
      else {
        closeModal();
        showToast("Execuções excluídas com sucesso.", "success");
        getExecutionsTable();
      }
    });
};

const findExecutions = () => {
  const q = document.querySelector("#executionSearch").value;
  getExecutionsTable(q);
};

const showExecutions = () => {
  clearInterval(interval);
  document.querySelector("#form").classList.add("hide");
  document.querySelector("#result").classList.add("hide");
  document.querySelector("#executions").classList.remove("hide");
  getExecutionsTable();
};

document
  .querySelector("#executionSearch")
  .addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      findExecutions();
    }
  });

window.onload = () => {
  const id = getExecutionId();
  if (id) {
    getExecution(id).then((res) => {
      if (!res.message) {
        disableForm();
        fillFields(res.params);
        if (res.isDone) showResults();
        else {
          setLoadingId(id);
          watchExecution(id);
        }
      } else {
        showToast(res.message);
        setExecutionId();
      }
    });
  }
};

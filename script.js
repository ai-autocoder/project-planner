// let projectPlanner = (() => {
// Global variables
let tasks = [];
let updateTimeInterval;
const shadowZ4 = `0px 2px 4px -1px rgba(0, 0, 0, 0.2),
0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12)`;

updateUI();

const debounce = function (func, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func();
    }, delay);
  };
};

(function addMainListeners() {
  const mainAddTask = document.getElementById(`add-button`);
  mainAddTask.addEventListener("click", function (e) {
    addTask();
  });
  // Recalc progress shadows only when width of the page changes
  let pageWidth = window.innerWidth;
  visualViewport.addEventListener(
    "resize",
    debounce(function () {
      if (pageWidth == window.innerWidth) return;
      window.requestAnimationFrame(calcProgress);
      pageWidth = window.innerWidth;
    }, 100)
  );
})();

(function headerShadow() {
  const header = document.getElementById("header");
  window.addEventListener(
    "scroll",
    () => {
      header.classList.toggle("elevated", window.scrollY > 50);
    },
    { capture: false, passive: true }
  );
})();

function Task(name, time, timeType) {
  this.name = name;
  this.time = time;
  this.complete = false;
  this.expand = false;
  this.subTasks = [];
}
function validate(title, time) {
  const pElement = document.getElementById("validate-message");
  if (!title) {
    pElement.innerHTML = "Invalid description";
    return false;
  }
  if (time <= 0 || isNaN(time) || time == "") {
    pElement.innerHTML = "Time must be greater than 0";
    return false;
  }
  pElement.innerHTML = "";
  return true;
}

function addTask(index = undefined) {
  let title, time, timeType;
  // main task
  if (index == undefined) {
    title = document.getElementById("task").value;
    time = document.getElementById("time").value;
    timeType = document.getElementById("time-type").value;
  } else {
    title = document.getElementById(`sub-name-${index}`).value;
    time = document.getElementById(`sub-time-${index}`).value;
    timeType = document.getElementById(`sub-type-${index}`).value;
  }
  if (!validate(title, time)) return;

  time = getMinutes(time, timeType);
  let taskToAdd = new Task(title, time);

  if (index == undefined) tasks.push(taskToAdd);
  else {
    tasks[index].subTasks.push(taskToAdd);
    tasks[index].complete = false;
  }
  document.forms.newTask.reset();
  saveData();
  updateUI();
}

function getMinutes(time, timeType) {
  switch (timeType) {
    case "mins":
      return time;
    case "hours":
      return time * 60;
    case "days":
      return time * 24 * 60;
    case "weeks":
      return time * 7 * 24 * 60;
    default:
      return 0;
  }
}

// update the array of objects from localStorage
function updateTasksArray() {
  tasks = [];
  for (let index = 0; index < localStorage.length; index++) {
    tasks.push(JSON.parse(localStorage.getItem(index)));
  }
}
function getTimeString(time) {
  const minutes = Math.floor(time % 60);
  const hours = Math.floor((time / 60) % 24);
  const days = Math.floor((time / 60 / 24) % 7);
  const weeks = Math.floor(time / 60 / 24 / 7);
  let timeString = "";
  if (weeks) timeString += `${weeks}w `;
  if (days) timeString += `${days}d `;
  if (hours) timeString += `${hours}h `;
  if (minutes) timeString += `${minutes}m `;

  return timeString;
}
function getHtmlTask() {
  return tasks
    .map((task, index) => {
      const expanded = tasks[index].expand ? "display:flex" : "display:none";
      const timeString = getTimeString(task.time);
      let mainTaskHtml = `
    <div class="task-list-child" id="task-list-child-${index}">
      <div class="task" id="main-task-${index}">
        <input type="checkbox" class="checkbox-done button" id="bd-${index}">
        <div title="Open sub tasks" class="main-task-name task-name" id="main-task-name-${index}"><pre>${task.name}</pre></div>
        <div class="button edit-task" id="edit-task-${index}"><span class="material-icons">
        edit
        </span></div>
        <div class="task-time" id="task-time-${index}">${timeString}</div>
        <div class="button button-remove" id="remove-task-${index}"><span class="material-icons">delete</span></div>
      </div>
      <div class="sub-tasks-container" id="sub-tasks-container-${index}" style="${expanded}">
        
          <form name="newTask" action="" method="dialog" class="add-task-form sub-form">
            <input type="text" id="sub-name-${index}" name="taskName" placeholder="Subtask description" required/>
            <input type="number" id="sub-time-${index}" name="timeRequired" placeholder="Time required" required/>
            <select id="sub-type-${index}" name="timeType">
              <option value="mins">Mins</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
            </select>
            <div class="button add-button" id="add-sub-btn-${index}" form="add-task-form">
              <span class="material-icons">
              add
              </span>
            </div>
          </form>
        `;

      if (hasSubTasks(task)) {
        const subTasksHtml = task.subTasks
          .map((subTask, subIndex) => {
            const subTimeString = getTimeString(subTask.time);
            return `
            <div class="task sub-task" id="sub-task-${index}-${subIndex}">
              <input type="checkbox" class="checkbox-done button" id="bd-${index}-${subIndex}">
              <div class="task-name" id="task-name-${index}-${subIndex}"><pre>${subTask.name}</pre></div>
              <div class="button edit-task" id="edit-sub-task-${index}-${subIndex}"><span class="material-icons">
              edit</span></div>
              <div class="task-time" id="task-time-${index}-${subIndex}">${subTimeString}</div>
              <div class="button button-remove" id="remove-sub-task-${index}-${subIndex}"><span class="material-icons">
              delete
              </span></div>
            </div>
            `;
          })
          .join("");
        mainTaskHtml += subTasksHtml;
      }

      return (mainTaskHtml += `</div></div>`);
    })
    .join("");
}

function updateUI() {
  updateTasksArray();
  const container = document.getElementById("tasks-list-container");

  container.innerHTML = getHtmlTask();
  setProgress(); //sets main progress changes
  addListeners();
}

function changeStyles(taskIndex = null) {
  if (taskIndex == null)
    tasks.forEach((_, taskIndex) => {
      changeStyles(taskIndex);
    });
  else {
    const div = document.getElementById(`task-list-child-${taskIndex}`);
    const hasStyle = div.classList.contains("task-complete");
    const checkBox = document.getElementById(`bd-${taskIndex}`);
    if (tasks[taskIndex].complete) {
      checkBox.checked = true;
      if (!hasStyle) div.classList.add("task-complete");
    } else if (!tasks[taskIndex].complete) {
      checkBox.checked = false;
      if (hasStyle) div.classList.remove("task-complete");
    }

    if (hasSubTasks(tasks[taskIndex])) {
      tasks[taskIndex].subTasks.forEach((subTask, subIndex) => {
        const divSub = document.getElementById(
          `sub-task-${taskIndex}-${subIndex}`
        );

        const hasStyle = divSub.classList.contains("task-complete");
        const checkBox = document.getElementById(`bd-${taskIndex}-${subIndex}`);

        if (subTask.complete) {
          checkBox.checked = true;
          if (!hasStyle) divSub.classList.add("task-complete");
        } else if (!subTask.complete) {
          checkBox.checked = false;
          if (hasStyle) divSub.classList.remove("task-complete");
        }
      });
    }
  }
}
function addListeners() {
  tasks.forEach((task, index) => {
    //  done main task
    const mainDoneButton = document.getElementById(`bd-${index}`);
    mainDoneButton.addEventListener("click", function (e) {
      if (e.target !== this) return;
      taskDone(index);
    });

    //  show/hide sub task listener
    const mainTaskName = document.getElementById(`main-task-name-${index}`);
    mainTaskName.addEventListener("click", function (e) {
      openClose(`sub-tasks-container-${index}`, index);
    });
    //  edit main task listener
    const editButton = document.getElementById(`edit-task-${index}`);
    editButton.addEventListener("click", function (e) {
      edit(index);
    });
    //  delete main task
    const buttonRemoveMain = document.getElementById(`remove-task-${index}`);
    buttonRemoveMain.addEventListener("click", function (e) {
      removeTask(index);
    });

    if (task.subTasks.length) {
      task.subTasks.forEach((subTask, subIndex) => {
        //  Done subTask button listener
        const buttonDone = document.getElementById(`bd-${index}-${subIndex}`);
        buttonDone.addEventListener("click", function (e) {
          if (e.target !== this) return;
          taskDone(index, subIndex);
        });

        // edit sub task button listener
        const editSubButton = document.getElementById(
          `edit-sub-task-${index}-${subIndex}`
        );
        editSubButton.addEventListener("click", function (e) {
          edit(index, subIndex);
        });

        // Delete subTask button listener
        const buttonRemove = document.getElementById(
          `remove-sub-task-${index}-${subIndex}`
        );
        buttonRemove.addEventListener("click", function (e) {
          removeTask(index, subIndex);
        });
      });
    }
    // "add subTask" button listener
    const subAddTask = document.getElementById(`add-sub-btn-${index}`);
    subAddTask.addEventListener("click", function (e) {
      addTask(index);
    });
  });
}

function edit(index, subIndex = null) {
  let parentDiv, taskToEdit, editDiv;
  if (document.getElementById("edit-overlay") != null) closeEdit();
  if (subIndex != null) {
    // task div
    parentDiv = document.getElementById(`sub-task-${index}-${subIndex}`);
    taskToEdit = tasks[index].subTasks[subIndex];
    // create a new node
    editDiv = document.createElement("div");
    editDiv.id = "edit-overlay";

    editDiv.innerHTML = `
<textarea name="task-name" spellcheck="false">${
      taskToEdit.name
    }</textarea>           

${getTimeHtml(index, subIndex)}

<div class="button button-edit-save" id="save-${index}-${subIndex}" onclick="saveEdit(${index},${subIndex})">Save</div><div class="button button-edit-cancel" id="cancel-${index}" onclick="closeEdit()">Cancel</div>`;
  } else {
    // it`s a task
    parentDiv = document.getElementById(`main-task-${index}`);
    taskToEdit = tasks[index];
    // create a new node
    editDiv = document.createElement("div");
    editDiv.id = "edit-overlay";

    editDiv.innerHTML = `
<textarea name="task-name" spellcheck="false">${
      taskToEdit.name
    }</textarea>           

${getTimeHtml(index)}

<div class="button button-edit-save" id="save-${index}-${subIndex}" onclick="saveEdit(${index},${subIndex})">Save</div><div class="button button-edit-cancel" id="cancel-${index}" onclick="closeEdit()">Cancel</div>`;
  }
  parentDiv.appendChild(editDiv);
  // focus on textarea end of text
  var input = document.querySelector("#edit-overlay > textarea");
  const end = input.value.length;
  input.setSelectionRange(end, end);
  input.focus();

  editDiv.classList.add("overlay");
  editDiv.style.opacity = "1";
}

function getTimeHtml(index, subIndex = null) {
  if (subIndex === null && hasSubTasks(tasks[index]))
    return document.getElementById(`task-time-${index}`).outerHTML; //cannot edit time because it`s calculated from the sub-tasks.
  const args =
    subIndex === null
      ? tasks[index].time
      : tasks[index].subTasks[subIndex].time;
  const time = getTimeData(args);
  return `<input type="number" name="timeRequired" value="${time.value}" required/>
      <select name="timeType">
      <option ${time.selected[0]} value="mins">Mins</option>
      <option ${time.selected[1]} value="hours">Hours</option>
      <option ${time.selected[2]} value="days">Days</option>
      <option ${time.selected[3]} value="weeks">Weeks</option>
      </select>`;
}

function getTimeData(time) {
  let selected = ["", "", "", ""];
  value = 0;
  if (Number.isInteger(time / 60 / 24 / 7)) {
    selected[3] = "selected=selected";
    value = time / 60 / 24 / 7;
  } else if (Number.isInteger(time / 60 / 24)) {
    selected[2] = "selected=selected";
    value = time / 60 / 24;
  } else if (Number.isInteger(time / 60)) {
    selected[1] = "selected=selected";
    value = time / 60;
  } else {
    selected[0] = "selected=selected";
    value = time;
  }
  return { value, selected };
}

function closeEdit() {
  const divElement = document.getElementById("edit-overlay");
  divElement.style.opacity = "0";
  setTimeout(function () {
    divElement.remove();
  }, 100);
}

function saveEdit(index, subIndex = null) {
  const title = document.querySelector("#edit-overlay > textarea").value;
  let taskToEdit;
  let nameDiv;
  if (subIndex == null) {
    taskToEdit = tasks[index];
    nameDiv = document.getElementById(`main-task-name-${index}`);
    if (hasSubTasks(taskToEdit)) {
      taskToEdit.name = title;
      const time = taskToEdit.time;
      if (!validate(title, time)) return;
      saveData();
      nameDiv.innerHTML = `<pre>${title}</pre>`;
      closeEdit();
      return;
    }
  } else {
    taskToEdit = tasks[index].subTasks[subIndex];
    nameDiv = document.getElementById(`task-name-${index}-${subIndex}`);
  }
  const time = document.querySelector("#edit-overlay > input").valueAsNumber;
  const timeType = document.querySelector("#edit-overlay > select").value;
  if (!validate(title, time)) return;
  taskToEdit.name = title;
  const computedMins = getMinutes(time, timeType);
  if (taskToEdit.time == computedMins) {
    saveData();
    nameDiv.innerHTML = `<pre>${title}</pre>`;
    closeEdit();
    return;
  }
  taskToEdit.time = computedMins;
  saveData();
  updateUI();
}

function setProgress() {
  const progress = calcProgress();
  document.documentElement.style.setProperty(
    `--main-pbar-width`,
    progress.percentValue
  );
  document.documentElement.style.setProperty(
    `--main-progress`,
    progress.progressValue
  );
  document.getElementById("time-required").innerHTML = getTimeString(
    progress.timeLeft
  ).replaceAll("<br>", ", ");
  clearTimeout(updateTimeInterval);
  updateTime(progress.timeLeft);
  updateTimeInterval = setInterval(updateTime, 60000, progress.timeLeft);
}

function updateTime(timeLeft) {
  let dateNow = new Date();
  let estimatedCompletion = new Date(dateNow.getTime() + timeLeft * 60 * 1000);
  dateString = `${estimatedCompletion.toLocaleDateString(
    "en-GB"
  )} ${estimatedCompletion.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  document.getElementById("planned-date").innerHTML = dateString;
}

function removeTask(index, subIndex = undefined) {
  if (subIndex != undefined) tasks[index].subTasks.splice(subIndex, 1);
  else tasks.splice(index, 1);
  saveData();
  updateUI();
}

function saveData() {
  localStorage.clear();
  tasks.forEach((task, index) => {
    localStorage.setItem(index, JSON.stringify(task));
  });
}

// Sample tasks
function reloadTasks() {
  localStorage.setItem(
    0,
    JSON.stringify(
      new Task(
        "Task 0 Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa sed repellat odit nobis, explicabo provident.",
        50,
        "min"
      )
    )
  );
  localStorage.setItem(
    1,
    JSON.stringify(
      new Task(
        "Task 1 Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa sed repellat odit nobis, explicabo provident.",
        50,
        "min"
      )
    )
  );
  localStorage.setItem(
    2,
    JSON.stringify(
      new Task(
        "Task 2 Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa sed repellat odit nobis, explicabo provident.",
        50,
        "min"
      )
    )
  );
  localStorage.setItem(
    3,
    JSON.stringify(
      new Task(
        "Task 3 Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa sed repellat odit nobis, explicabo provident.",
        50,
        "min"
      )
    )
  );
  localStorage.setItem(
    4,
    JSON.stringify(
      new Task(
        "Task 4 Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa sed repellat odit nobis, explicabo provident.",
        50,
        "min"
      )
    )
  );
  localStorage.setItem(
    5,
    JSON.stringify(
      new Task(
        "Task 5 Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa sed repellat odit nobis, explicabo provident.",
        50,
        "min"
      )
    )
  );

  updateUI();
}

function hasSubTasks(task) {
  return task.subTasks.length ? true : false;
}

function calcProgress() {
  let totalTime = 0,
    timeDone = 0,
    progress = 0;
  tasks.forEach((task, index) => {
    const checkBox = document.getElementById(`bd-${index}`);
    checkBox.checked = task.complete;
    if (hasSubTasks(task)) {
      let taskTime = 0,
        taskTimeDone = 0;
      task.subTasks.forEach((subTask, subIndex) => {
        taskTime += Number(subTask.time);
        const checkBox = document.getElementById(`bd-${index}-${subIndex}`);
        checkBox.checked = subTask.complete;
        setTaskProgress(index, 0, subIndex, subTask.complete);

        if (subTask.complete) taskTimeDone += Number(subTask.time);
      });
      const displayedTime = document.getElementById(`task-time-${index}`);
      displayedTime.innerHTML = getTimeString(taskTime);
      totalTime += taskTime;
      timeDone += taskTimeDone;
      const taskProgress = Math.trunc((taskTimeDone / taskTime) * 100);
      setTaskProgress(index, taskProgress);
    } else {
      totalTime += Number(task.time);
      if (task.complete) {
        timeDone += Number(task.time);
        setTaskProgress(index, 100);
      } else setTaskProgress(index, 0);
    }
  });
  progress = Math.trunc((timeDone / totalTime) * 100);
  if (isNaN(progress)) progress = 0;
  return {
    percentValue: progress,
    progressValue: `"${progress}%"`,
    timeLeft: totalTime - timeDone,
  };
}
function setTaskProgress(
  index,
  taskProgress,
  subIndex = null,
  subComplete = false
) {
  let width = 0;
  if (subIndex !== null) {
    const taskDiv = document.getElementById(`sub-task-${index}-${subIndex}`);
    if (subComplete) {
      width = getWidth(taskDiv, index);
      taskDiv.classList.add("task-complete");
      taskDiv.style.boxShadow = `inset ${width}px 0px 0px 0.1px hsl(126, 80%, 61%)`;
    } else {
      taskDiv.classList.remove("task-complete");
      taskDiv.style.boxShadow = `inset ${width}px 0px 0px 0.1px hsl(126, 80%, 61%), ${shadowZ4}`;
    }
  } else {
    const taskDiv = document.getElementById(`task-list-child-${index}`);
    let width = parseInt((taskDiv.offsetWidth * taskProgress) / 100);
    if (taskProgress == 100) {
      taskDiv.classList.add("task-complete");
      taskDiv.style.boxShadow = `inset ${width}px 0px 0px 0.1px hsl(126, 80%, 61%)`;
    } else {
      taskDiv.classList.remove("task-complete");
      taskDiv.style.boxShadow = `inset ${width}px 0px 0px 0.1px hsl(126, 80%, 61%), ${shadowZ4}`;
    }
  }
}
function getWidth(element, index) {
  const expanded = tasks[index].expand;
  if (expanded) return element.offsetWidth;
  else {
    parent = document.getElementById(`sub-tasks-container-${index}`);
    parent.style.display = "block";
    let width = element.offsetWidth;
    parent.style.display = "none";
    return width;
  }
}
function taskDone(index, subIndex = null) {
  let mainTask = tasks[index];
  let taskClicked;
  if (subIndex !== null) {
    // check/uncheck subTask
    taskClicked = mainTask.subTasks[subIndex];
    taskClicked.complete = taskClicked.complete ? false : true;

    // if subTask unchecked, main unchecked
    if (!taskClicked.complete) mainTask.complete = false;

    // if all subTasks are checked/unchecked, main checked/unchecked
    if (
      tasks[index].subTasks.every(
        (subTask) => subTask.complete === taskClicked.complete
      )
    )
      mainTask.complete = taskClicked.complete;
  } else {
    //check/uncheck main task
    taskClicked = mainTask;
    taskClicked.complete = taskClicked.complete ? false : true;

    if (hasSubTasks(taskClicked))
      taskClicked.subTasks.forEach((subTask) => {
        subTask.complete = taskClicked.complete;
      });
  }
  setProgress();
  localStorage.setItem(index, JSON.stringify(tasks[index]));
}

function openClose(id, index) {
  tasks[index].expand = !tasks[index].expand;
  saveData(index);
  let elementShowHide = document.getElementById(id);
  elementShowHide.style.display = tasks[index].expand
    ? elementShowHide.setAttribute(`style`, `display:flex`)
    : elementShowHide.setAttribute(`style`, `display:none`);
}

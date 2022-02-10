// let projectPlanner = (() => {
// Global variables
let tasks = [];
let updateTimeInterval;
updateUI();

(function addMainListener() {
  const mainAddTask = document.getElementById(`add-button`);
  mainAddTask.addEventListener("click", function (e) {
    addTask();
  });
})();
(function stickyProgressBar() {
  window.addEventListener("scroll", () => {
    const progressBar = document.getElementById("header");
    progressBar.classList.toggle("sticky", window.scrollY > 50);
    const addTaskForm = document.getElementById("main-add-task");
    addTaskForm.classList.toggle("sticky-margin", window.scrollY > 50);
  });
})();

function Task(name, time, timeType) {
  this.name = name;
  this.time = time;
  this.complete = false;
  this.expand = false;
  this.subTasks = [];
}
var loops = 0;
function validate(title, time) {
  loops++;
  const pElement = document.getElementById("validate-message");
  if (!title) {
    const adesso = new Date();
    let ora = adesso.getSeconds();
    pElement.innerHTML =
      "Invalid description before return " + ora + title + loops;
    return false;
  }
  if (time <= 0 || isNaN(time) || time == "") {
    pElement.innerHTML = "Time must be a number greater than 0";
    return false;
  }
  console.log("returning true" + loops);
  pElement.innerHTML = "";
  return true;
}

function addTask(index = undefined) {
  let title, time, timeType;
  console.log(`hello! ${loops}`);
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
  else tasks[index].subTasks.push(taskToAdd);
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
  // let mins, hours, days, weeks;
  const minutes = Math.floor(time % 60);
  const hours = Math.floor((time / 60) % 24);
  const days = Math.floor((time / 60 / 24) % 7);
  const weeks = Math.floor(time / 60 / 24 / 7);
  let timeString = "";
  if (weeks) timeString += `${weeks} Wk<br>`;
  if (days) timeString += `${days} Day<br>`;
  if (hours) timeString += `${hours} Hr<br>`;
  if (minutes) timeString += `${minutes} Min`;

  return timeString;
}
function getHtmlTask() {
  return tasks
    .map((task, index) => {
      const checked = task.complete ? "checked" : "";
      const expanded = tasks[index].expand ? "display:flex" : "display:none";
      const timeString = getTimeString(task.time);
      let mainTaskHtml = `
    <div class="task-list-child" id="task-list-child-${index}">
      <div class="task" id="main-task-${index}">
        <input type="checkbox" class="checkbox-done button" id="bd-${index}" ${checked}>
        <div title="Open sub tasks" class="main-task-name task-name" id="main-task-name-${index}">${task.name}</div>
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
            let subChecked = subTask.complete ? "checked" : "";
            const subTimeString = getTimeString(subTask.time);
            return `
            <div class="task sub-task" id="sub-task-${subIndex}">
              <input type="checkbox" class="checkbox-done button" id="bd-${index}-${subIndex}" ${subChecked}>
              <div class="task-name">${subTask.name}</div>
              <div class="button edit-task" id="edit-sub-task-${index}-${subIndex}"><span class="material-icons">
              edit</span></div>
              <div class="task-time">${subTimeString}</div>
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
  container.innerHTML = "";
  container.innerHTML = getHtmlTask();
  changeStyles();
  setProgress(); //sets main progress changes
  addListeners();
}

function changeStyles() {
  tasks.forEach((task, index) => {
    if (task.complete) {
      const div = document.getElementById(`task-list-child-${index}`);
      div.style.background = "var(--task-complete)";
      div.style.boxShadow = "none";

      const editButton = document.getElementById(`edit-task-${index}`);
      editButton.style.background = "var(--task-complete)";
      const removeButton = document.getElementById(`remove-task-${index}`);
      removeButton.style.background = "var(--task-complete)";
    }
    if (hasSubTasks(task)) {
      task.subTasks.forEach((subTask, subIndex) => {
        if (subTask.complete) {
          const divSub = document.getElementById(`sub-task-${subIndex}`);
          divSub.style.background = "var(--task-complete)";
          divSub.style.boxShadow = "none";
          const editSubButton = document.getElementById(
            `edit-sub-task-${index}-${subIndex}`
          );
          editSubButton.style.background = "var(--task-complete)";
          const removeSubButton = document.getElementById(
            `remove-sub-task-${index}-${subIndex}`
          );
          removeSubButton.style.background = "var(--task-complete)";
        }
      });
    }
  });
}
function addListeners() {
  // document.addEventListener("click", (e) => {
  //   if (e.target.matches(".edit-task")) {
  //     console.log(e.target);
  //   }
  // });

  // Add event listeners new approach

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
function edit(index, subIndex) {
  if (subIndex != null) {
    console.log(`edit subtask`);
  } else {
    console.log(`edit task`);
  }
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
  if (subIndex != undefined)
    console.log("removed task " + tasks[index].subTasks.splice(subIndex, 1));
  else console.log("removed task " + tasks.splice(index, 1));
  saveData();
  updateUI();
}

function saveData() {
  localStorage.clear();
  tasks.forEach((task, index) => {
    localStorage.setItem(index, JSON.stringify(task));
  });
}
// localStorage.getItem("key");
// localStorage.removeItem("key");

// localStorage.setItem("id", JSON.stringify(user));
// JSON.parse(localStorage.getItem("id"));
// document.getElementById("").addEventListener(click, function() {

// })

// for debug only
function reloadTasks() {
  localStorage.setItem(
    0,
    JSON.stringify(
      new Task(
        "Task 0 Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa sed repellat odit nobis, explicabo provident.",
        5,
        "min"
      )
    )
  );
  localStorage.setItem(
    1,
    JSON.stringify(
      new Task(
        "Task 1 Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa sed repellat odit nobis, explicabo provident.",
        5,
        "min"
      )
    )
  );
  localStorage.setItem(
    2,
    JSON.stringify(
      new Task(
        "Task 2 Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa sed repellat odit nobis, explicabo provident.",
        5,
        "min"
      )
    )
  );
  localStorage.setItem(
    3,
    JSON.stringify(
      new Task(
        "Task 3 Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa sed repellat odit nobis, explicabo provident.",
        5,
        "min"
      )
    )
  );
  localStorage.setItem(
    4,
    JSON.stringify(
      new Task(
        "Task 4 Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa sed repellat odit nobis, explicabo provident.",
        5,
        "min"
      )
    )
  );
  localStorage.setItem(
    5,
    JSON.stringify(
      new Task(
        "Task 5 Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa sed repellat odit nobis, explicabo provident.",
        5,
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
  // tasks.reduce();
  let totalTime = 0,
    timeDone = 0,
    progress = 0;
  tasks.forEach((task, index) => {
    if (hasSubTasks(task)) {
      let taskTime = 0,
        taskTimeDone = 0;
      task.subTasks.forEach((subTask) => {
        taskTime += Number(subTask.time);
        if (subTask.complete) taskTimeDone += Number(subTask.time);
      });
      const displayedTime = document.getElementById(`task-time-${index}`);
      displayedTime.innerHTML = getTimeString(taskTime);
      totalTime += taskTime;
      timeDone += taskTimeDone;
      const taskProgress = Math.trunc((taskTimeDone / taskTime) * 100);
      setTaskBackground(index, taskProgress);
    } else {
      totalTime += Number(task.time);
      if (task.complete) timeDone += Number(task.time);
    }
  });
  progress = Math.trunc((timeDone / totalTime) * 100);
  if (isNaN(progress)) progress = 0;

  // Debug
  // console.log("Total time required: " + totalTime);
  // console.log("Time done: " + timeDone);
  // console.log("Progress: " + progress);

  return {
    percentValue: progress,
    progressValue: `"${progress}%"`,
    timeLeft: totalTime - timeDone,
  };
}
function setTaskBackground(index, taskProgress) {
  let shadowZ2 = `0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12)`;
  // 2 ways: set background shadow, set a div inside and change width
  const taskDiv = document.getElementById(`task-list-child-${index}`);
  let width = parseInt((taskDiv.offsetWidth * taskProgress) / 100);
  taskDiv.style.boxShadow = `inset ${width}px 0px 0px 0px hsl(126, 80%, 61%), ${shadowZ2}`;
}

function taskDone(index, subIndex = null) {
  let mainTask = tasks[index];
  let taskClicked;
  if (subIndex != null) {
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
  localStorage.setItem(index, JSON.stringify(tasks[index]));
  updateUI();
}

function openClose(id, index) {
  tasks[index].expand;
  tasks[index].expand = !tasks[index].expand;
  saveData(index);
  tasks[index].expand;
  let elementShowHide = document.getElementById(id);
  // console.log(elementShowHide.style.display);

  elementShowHide.style.display = tasks[index].expand
    ? elementShowHide.setAttribute(`style`, `display:flex`)
    : elementShowHide.setAttribute(`style`, `display:none`);
}
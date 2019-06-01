const TASK_TODO = 'todo';
const TASK_INPROGRESS = 'inprogress';
const TASK_DONE = 'done';
const SELECT_INDEX = [TASK_TODO, TASK_INPROGRESS, TASK_DONE];
const DANGER = 'danger';
const SUCCESS = 'success';

const STATE = {
  taskList: [], // список задач
  formState: 'add', // [ add, edit, err ] - состсояние формы
  editIndex: null,
  calendarVisible: false,
  calendarDate: new Date(),
  currMonthCalendar: new Date().getMonth(),
  currYearCalendar: new Date().getFullYear(),
  isOpenedPopup: false, // true / false -флаг открыто/ закрыто модальное окно
  formData: {
    // данные формы
    taskName: null, // название задачи
    taskDescription: null, // описание
    taskDate: null, // дата
    taskUrgent: false, // важность задачи
    taskStatus: 'todo',
    id: null
  },
  page: 'home',
  dnd: {
    from: null,
    to: null,
    id: null
  }
};

function collectDataFromForm() {
  STATE.formData.taskName = document.getElementById('taskName').value;
  STATE.formData.taskDescription = document.getElementById('taskDescription').value;
  STATE.formData.taskDate = document.getElementById('taskDate').value;
  STATE.formData.taskUrgent = document.getElementById('taskUrgent').checked;
  STATE.formData.id = 'id' + new Date().getTime();
}

function clearForm() {
  document.getElementById('taskName').value = '';
  document.getElementById('taskDescription').value = '';
  document.getElementById('taskDate').value = '';
  document.getElementById('taskUrgent').checked = false;
  highlightFormField('taskDate');
  highlightFormField('taskName');
}

function fillForm({ taskName, taskDescription, taskDate, taskUrgent }) {
  document.getElementById('taskName').value = taskName;
  document.getElementById('taskDescription').value = taskDescription;
  document.getElementById('taskDate').value = taskDate;
  document.getElementById('taskUrgent').checked = taskUrgent;
  highlightFormField('taskDate');
  highlightFormField('taskName');
}

function pushDataToList() {
  if (STATE.formState === 'edit') {
    STATE.taskList[STATE.editIndex] = STATE.formData;
  } else {
    STATE.taskList.push(STATE.formData);
  }
  STATE.formState = 'add';
  STATE.formData = {
    taskName: null,
    taskDescription: null,
    taskDate: null,
    taskUrgent: false,
    taskStatus: 'todo',
    id: null
  };
}

function validateFromForm() {
  const retVal = [];
  if (!STATE.formData.taskName) {
    retVal.push('taskName');
  }
  if (!STATE.formData.taskDate) {
    retVal.push('taskDate');
  }
  return retVal;
}

function highlightFormField(id, tp, msg = '') {
  const message = msg;
  const dangerClass = 'text-danger';
  const mutedClass = 'text-muted';
  const formDangerClass = 'is-invalid';
  const formSuccessClass = 'is-valid';

  const type = tp === DANGER ? dangerClass : mutedClass;
  let htmlId = '';
  switch (id) {
    case 'taskName':
      htmlId = 'taskHelp';
      break;
    case 'taskDescription':
      htmlId = 'descriptionHelp';
      break;
    case 'taskDate':
      htmlId = 'dateHelp';
      break;
  }

  const helper = document.getElementById(htmlId);
  helper.classList.remove(dangerClass);
  helper.classList.remove(mutedClass);
  helper.classList.add(type);
  helper.innerText = message;

  const input = document.getElementById(id);
  input.classList.remove(formDangerClass);
  input.classList.remove(formSuccessClass);
  const label = input.closest('.form-group').getElementsByTagName('label')[0];
  const labelStar = label.getElementsByTagName('span')[0];
  labelStar.classList.remove(mutedClass);
  if (tp === DANGER) {
    input.classList.add(formDangerClass);
    label.classList.add(dangerClass);
    labelStar.classList.add(dangerClass);
  } else {
    input.classList.remove(formDangerClass);
    label.classList.remove(dangerClass);
    labelStar.classList.remove(dangerClass);
  }

  if (tp === SUCCESS) {
    input.classList.add(formSuccessClass);
  } else {
    input.classList.remove(formSuccessClass);
  }
}

function initPage() {
  let localList;
  try {
    localList = JSON.parse(localStorage.getItem('TASKS'));
  } catch (e) {
    log('Coudnt init JSON from Local Storage', e);
  }
  STATE.taskList = localList || [];
  renderList();
  initDnD();
  renderDnDList();
  renderCalendar(STATE.calendarDate.getFullYear(), STATE.calendarDate.getMonth());
}

function stateToStorage() {
  localStorage.setItem('TASKS', JSON.stringify(STATE.taskList));
  return true;
}

function handleClearList() {
  STATE.taskList = [];
  localStorage.removeItem('TASKS');
  if (STATE.isOpenedPopup) handleCloseModal();
  renderList();
  clearForm();
  STATE.formState = 'add';
  STATE.formData = {
    taskName: null,
    taskDescription: null,
    taskDate: null,
    taskUrgent: false,
    taskStatus: 'todo'
  };
  renderButton();
}

function renderList(list = STATE.taskList, id = 'taksList') {
  const container = document.getElementById(id);
  let div = '';
  list.forEach((item, index) => {
    div += `<li class="list-group-item" draggable="${id !== 'taksList'}">`;
    div += item.taskUrgent ? '<i class="text-danger fa fa-exclamation-triangle"></i> &nbsp ' : '';
    div += `<a onclick="handleTaskInfo(event)" draggable="false" class="d" data-id=${
      item.id
    } href="#">${item.taskName}</a><br>`;
    div += `<span class="text-muted"><small>${item.taskDate}</small></span><br>`;
    if (id === 'taksList') {
      div += '<span class="edit_ico">';
      div += `<i data-id=${index} onClick="handleEditTask(event)" class="fas fa-edit"></i></span>`;
      div += '<span class="delete_ico">';
      div += `<i data-id=${index} onClick="handleModalDelete(event);" class="fa fa-times"></i></span>`;
    }
    div += '</li>';
  });
  const noDiv =
    "<li class='list-group-item'><strong class='text-secondary'>Список пуст</strong></li>";
  container.innerHTML = list.length ? div : noDiv;
}

function handleClearForm() {
  if (STATE.formState === 'edit') STATE.formState = 'add';
  clearForm();
  renderButton();
}

function renderButton() {
  const button = document.getElementById('clickTask');
  const button2 = document.getElementById('clearCancel');
  const header = document.getElementById('form-header');
  if (STATE.formState === 'edit') {
    button.classList.remove('btn-primary');
    button.classList.add('btn-warning');
    button.textContent = 'Edit task';
    button2.textContent = 'Cancel';
    header.textContent = 'Edit Task';
  } else {
    button.classList.remove('btn-warning');
    button.classList.add('btn-primary');
    button.textContent = 'Add new task';
    button2.textContent = 'Clear form';
    header.textContent = 'Add Task';
  }
}

function handleModalDelete(e) {
  const index = e.target.getAttribute('data-id');
  renderModalWindow('DELETE', index);
}

function handleModalDeleteAll() {
  if (STATE.taskList.length) renderModalWindow('DELETE_ALL');
}

function handleDeleteTask(e) {
  STATE.formState = 'add';
  const index = e.target.getAttribute('data-id');
  STATE.taskList.splice(index, 1);
  if (STATE.isOpenedPopup) handleCloseModal();
  renderButton();
  clearForm();
  renderList();
  stateToStorage();
}

function handleEditTask(e) {
  if (STATE.formState === 'add') {
    STATE.formState = 'edit';
    const index = e.target.getAttribute('data-id');
    fillForm(STATE.taskList[index]);
    STATE.editIndex = index;
  } else {
    STATE.formState = 'add';
    STATE.editIndex = null;
    clearForm();
  }
  if (STATE.isOpenedPopup) handleCloseModal();
  renderButton();
}

function handleTask() {
  collectDataFromForm();
  const checkResult = validateFromForm();
  if (!checkResult.includes('taskName')) highlightFormField('taskName');
  if (!checkResult.includes('taskDate')) highlightFormField('taskDate');
  if (checkResult.length) {
    checkResult.forEach(item => highlightFormField(item, DANGER, 'заполните поле'));
    return false;
  }
  pushDataToList();
  renderButton();
  clearForm();
  renderList();
  stateToStorage();
}

function handleTaskInfo(e) {
  e.preventDefault();
  if (STATE.page === 'dnd') {
    return false;
  }
  const index = e.target.getAttribute('data-id');
  renderModalWindow('INFO', index);
}

function renderModalWindow(type, index) {
  const modal = document.getElementById('modalWindow');
  STATE.isOpenedPopup = true;
  modal.innerHTML = '';
  let div = '';
  div += '<div class="modal-dialog" role="document">';
  div += '<div class="modal-content">';
  div += '<div class="modal-header">';
  if (type === 'INFO') {
    div += `<h5 class="modal-title">${STATE.taskList[index].taskName}</h5>`;
    div += '<button type="button" onclick="handleCloseModal();" class="close">';
    div += '<span aria-hidden="true">&times;</span>';
    div += '</button></div><div class="modal-body">';
    div += STATE.taskList[index].taskDescription
      ? `<strong>Task Description: ${STATE.taskList[index].taskDescription}</strong><br>`
      : '';
    div += `<strong>Task Date: ${STATE.taskList[index].taskDate}</strong><br>`;
    div += STATE.taskList[index].taskUrgent
      ? `<i class="text-danger fas fa-exclamation-triangle"></i>`
      : '';
    div += '</div><div class="modal-footer">';
    div +=
      '<button type="button" class="btn btn-secondary" onclick="handleCloseModal();" data-dismiss="modal">';
    div += 'Close';
    div += '</button>';
    div += `<button type="button" data-id=${index} onclick="handleEditTask(event);" class="btn btn-warning">Edit task</button>`;
  }
  if (type === 'DELETE') {
    div += `<h5 class="modal-title">${STATE.taskList[index].taskName}</h5>`;
    div += '<button type="button" onclick="handleCloseModal();" class="close">';
    div += '<span aria-hidden="true">&times;</span>';
    div += '</button></div><div class="modal-body">';
    div += '<strong>Are you sure you want to remove this task?</strong><br>';
    div += '</div><div class="modal-footer">';
    div +=
      '<button type="button" class="btn btn-secondary" onclick="handleCloseModal();" data-dismiss="modal">';
    div += 'Cancel';
    div += '</button>';
    div += `<button type="button" data-id=${index} onclick="handleDeleteTask(event);" class="btn btn-danger">Yes</button>`;
  }
  if (type === 'DELETE_ALL') {
    div += `<h5 class="modal-title">Delete all</h5>`;
    div += '<button type="button" onclick="handleCloseModal();" class="close">';
    div += '<span aria-hidden="true">&times;</span>';
    div += '</button></div><div class="modal-body">';
    div += '<strong>Are you sure to clear all tasks?</strong><br>';
    div += '</div><div class="modal-footer">';
    div += '<button type="button" class="btn btn-secondary" onclick="handleCloseModal();">';
    div += 'No';
    div += '</button>';
    div += `<button type="button" onclick="handleClearList();" class="btn btn-danger">Yes</button>`;
  }
  div += '</div></div></div>';
  modal.innerHTML = div;
  modal.style.display = 'block';
}

function handleCloseModal() {
  const modal = document.getElementById('modalWindow');
  STATE.isOpenedPopup = false;
  modal.style.display = 'none';
  modal.innerHTML = '';
}

function handleShowCalendar(e) {
  if (STATE.calendarVisible) return false;
  const calendar = document.getElementById('calendar');
  const clickedIcon = e.target;
  const coords = clickedIcon.closest('.input-group-prepend').getBoundingClientRect();
  calendar.style.top = coords.bottom + 'px';
  calendar.style.left = coords.left + 'px';
  calendar.style.display = 'block';
  STATE.calendarVisible = true;
}

function handlePrevCalendar(e) {
  STATE.currMonthCalendar = STATE.currMonthCalendar - 1;
  if (STATE.currMonthCalendar < 0) {
    STATE.currMonthCalendar = 11;
    STATE.currYearCalendar = STATE.currYearCalendar - 1;
  }
  renderCalendar(STATE.currYearCalendar, STATE.currMonthCalendar);
}

function handleNextCalendar(e) {
  STATE.currMonthCalendar = STATE.currMonthCalendar + 1;
  if (STATE.currMonthCalendar > 11) {
    STATE.currMonthCalendar = 0;
    STATE.currYearCalendar = STATE.currYearCalendar + 1;
  }
  renderCalendar(STATE.currYearCalendar, STATE.currMonthCalendar);
}

function handleCloseCalendar(e) {
  const calendar = document.getElementById('calendar');
  calendar.style.display = 'none';
  STATE.calendarVisible = false;
}

function renderCalendar(yearToOperate, monthToOperate) {
  const dateToOperate = new Date(yearToOperate, monthToOperate);
  const year = dateToOperate.getFullYear();
  const month = dateToOperate.getMonth(); // месяц от 0 до 11, нужно прибавлять 1
  const dayMonth = new Date().getDate(); // какое число месяца
  let dayWeek = dateToOperate.getDay(); // от 0 до 6, причем 0 - это воскресение
  dayWeek = dayWeek === 0 ? 7 : dayWeek;
  const maximumDaysInPrevMonth = getLastDay(year, month - 1);
  const firstDay = getFirstDayOfMonth(year, month);

  let dayCounter = 1;
  let dayCounterAfter = 1;
  let str_out_week = '';

  let weeks = null;
  if (
    (firstDay.maxDays === 31 && firstDay.dayWeek === 6) ||
    (firstDay.dayWeek === 7 && firstDay.maxDays >= 30)
  ) {
    weeks = 7;
  } else if (firstDay.maxDays === 28 && firstDay.dayWeek === 1) {
    weeks = 5;
  } else {
    weeks = 6;
  }

  for (let j = 1; j < weeks; j++) {
    let str_out = '';
    for (let i = 1; i < 8; i++) {
      let tmpCellObject = {};
      if (firstDay.dayWeek > i && j == 1) {
        // если меньше чем 1е число текущего месяца - ячейки для предыдущего месяца
        const tmpDayMonth = maximumDaysInPrevMonth + i + 1 - firstDay.dayWeek;
        tmpCellObject = {
          className: ' class="not_current"',
          dataFullDate:
            tmpDayMonth +
            '.' +
            (month === 0 ? 12 : month) +
            '.' +
            (month === 0 ? yearToOperate - 1 : yearToOperate),
          dataDaymonth: tmpDayMonth
        };
      } else if (dayCounter > firstDay.maxDays) {
        // ячейки для следующего месяца
        tmpCellObject = {
          className: ' class="not_current"',
          dataFullDate:
            dayCounterAfter +
            '.' +
            (month === 11 ? 1 : month + 2) +
            '.' +
            (month == 11 ? yearToOperate + 1 : yearToOperate),
          dataDaymonth: dayCounterAfter++
        };
      } else {
        // ЯЧЕЙКИ для ТЕКУЩЕГО МЕСЯЦА
        let todayClass = '';
        const currrentDt = new Date();

        if (yearToOperate == currrentDt.getFullYear() && monthToOperate == currrentDt.getMonth()) {
          todayClass = dayCounter == dayMonth ? ' class="today"' : '';
        }

        tmpCellObject = {
          className: todayClass,
          dataFullDate: dayCounter + '.' + (month + 1) + '.' + yearToOperate,
          dataDaymonth: dayCounter++
        };
      }
      str_out += renderOneCalendarCell(tmpCellObject);
    }
    str_out_week += '<tr>' + str_out + '</tr>';
  }

  renderCalendarMonthHeader(yearToOperate, monthToOperate);
  const tableBody = document.getElementById('calendar_table').getElementsByTagName('tbody')[0];
  tableBody.innerHTML = str_out_week;
}

function renderCalendarMonthHeader(year, month) {
  const text = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь'
  ];
  document.getElementById('monthHeader').innerHTML = text[month] + ' ' + year;
}

// формирует содержимое одной ячейки календаря и возвращает строку содержащую тег TD и все его содержимое
function renderOneCalendarCell({
  className = null,
  dataFullDate = null,
  dataDaymonth = null,
  cellText = null
}) {
  // if (! (className && dataWeek && dataDaymonth) )
  if (!className && !dataFullDate && !dataDaymonth) {
    return '<td>&nbsp;</td>';
  }
  return (
    '<td onclick="handleClickCalendarCell(event)" ' +
    className +
    ' data-fulldate="' +
    dataFullDate +
    '" data-daymonth="' +
    dataDaymonth +
    '">' +
    (cellText === null ? dataDaymonth : cellText) +
    '</td>'
  );
}

/* возвращает объект с 2 полями: на какой день недели выпадает первое число месяца и сколько всего в месяце дней*/
function getFirstDayOfMonth(yy, mm) {
  const firstDayOfCurrentMonth = new Date(yy, mm, 1); // дата на момент первого числа текущего месяца
  let dayWeek = firstDayOfCurrentMonth.getDay(); // от 0 до 6, причем 0 - это воскресение
  dayWeek = dayWeek === 0 ? 7 : dayWeek;
  return {
    dayWeek, // номер дня недели первого числа текущего месяца
    maxDays: getLastDay(yy, mm) // максимальное количество дней  в текуще месяце (который был передан в качестве параметре )
  };
}

function getLastDay(yy, mm) {
  return new Date(yy, mm + 1, 0).getDate();
}

function handleClickCalendarCell(e) {
  const year = STATE.currYearCalendar;
  let month = STATE.currMonthCalendar + 1;
  month = month < 10 ? '0' + month : month;
  let day = e.target.textContent;
  day = day < 10 ? '0' + day : day;
  const str = `${day}.${month}.${year}`;
  document.getElementById('taskDate').value = str;
  handleCloseCalendar();
}

function selectPage(e) {
  e.preventDefault();
  STATE.page = e.target.getAttribute('data-id');
  const node = document.getElementById(STATE.page);
  const links = document.getElementsByClassName('nav-link');
  const collection = document.getElementsByClassName('tab-pane');

  [...links].forEach(item => item.classList.remove('active'));

  for (let i = 0; i < collection.length; i++) {
    collection[i].classList.remove('active');
    collection[i].classList.remove('show');
  }
  renderDnDList();
  e.target.classList.add('active');
  node.classList.add('active');
  node.classList.add('show');
}

function renderDnDList() {
  const todo = STATE.taskList.filter(item => item.taskStatus === 'todo');
  const inprogress = STATE.taskList.filter(item => item.taskStatus === 'inprogress');
  const done = STATE.taskList.filter(item => item.taskStatus === 'done');
  renderList(todo, 'todolist');
  renderList(inprogress, 'inprogresslist');
  renderList(done, 'donelist');
}

function handleDragStartTask(e) {
  const indexTask = e.target.querySelector('a').getAttribute('data-id');
  const parent = e.target.parentElement.parentElement.parentElement;
  var parentId = parent.getAttribute('id');
  var todoListCard = document.getElementById('todoListCard');
  var inprogressListCard = document.getElementById('inprogressListCard');
  var doneListCard = document.getElementById('doneListCard');

  if (parentId.includes(TASK_TODO)) {
    todoListCard.classList.add('inactive-dnd');
    inprogressListCard.classList.add('active-dnd');
    doneListCard.classList.add('active-dnd');
    STATE.dnd.from = TASK_TODO;
  } else if (parentId.includes(TASK_INPROGRESS)) {
    inprogressListCard.classList.add('inactive-dnd');
    todoListCard.classList.add('active-dnd');
    doneListCard.classList.add('active-dnd');
    STATE.dnd.from = TASK_INPROGRESS;
  } else if (parentId.includes(TASK_DONE)) {
    doneListCard.classList.add('inactive-dnd');
    todoListCard.classList.add('active-dnd');
    inprogressListCard.classList.add('active-dnd');
    STATE.dnd.from = TASK_DONE;
  }
  STATE.dnd.id = indexTask;
}

function handleResetCardBlock(e) {
  // убирает пунктирную-рамку вокруг блока "карточки"
  e && e.stopPropagation();

  const todoListCard = document.getElementById('todoListCard');
  const inprogressListCard = document.getElementById('inprogressListCard');
  const doneListCard = document.getElementById('doneListCard');

  todoListCard.classList.remove(
    'active-dnd',
    'inactive-dnd',
    'card-body-dnd-accept',
    'card-body-dnd-decline'
  );
  inprogressListCard.classList.remove(
    'active-dnd',
    'inactive-dnd',
    'card-body-dnd-accept',
    'card-body-dnd-decline'
  );
  doneListCard.classList.remove(
    'active-dnd',
    'inactive-dnd',
    'card-body-dnd-accept',
    'card-body-dnd-decline'
  );

  todoListCard
    .querySelector('.card-body')
    .classList.remove('card-body-dnd-accept', 'card-body-dnd-decline');
  inprogressListCard
    .querySelector('.card-body')
    .classList.remove('card-body-dnd-accept', 'card-body-dnd-decline');
  doneListCard
    .querySelector('.card-body')
    .classList.remove('card-body-dnd-accept', 'card-body-dnd-decline');
}

function handleDragOver(e) {
  // обработчик события - перетаскиваемый элемент перемещается над областью, куда можно сделать drop
  e.preventDefault();
  const cardContainer = e.currentTarget;
  const cardBody = cardContainer.querySelector('.card-body');

  if (
    (cardContainer.id.includes(TASK_TODO) && STATE.dnd.from === TASK_TODO) ||
    (cardContainer.id.includes(TASK_INPROGRESS) && STATE.dnd.from === TASK_INPROGRESS) ||
    (cardContainer.id.includes(TASK_DONE) && STATE.dnd.from === TASK_DONE)
  ) {
    cardBody.classList.add('card-body-dnd-decline');
  } else {
    cardBody.classList.add('card-body-dnd-accept');
  }
  return null;
}

function handleDragEnter(e) {
  // обработчик события - перетаскиваемый элемент "вошел" в зону, куда можно сделать drop
  e.preventDefault();

  return null;
}

function handleDragLeave(e) {
  // обработчик события - перетаскиваемый элемент "ушел" из зоны, куда можно было сделать drop
  const cardContainer = e.currentTarget;

  const cardBody = cardContainer.querySelector('.card-body');
  cardBody.classList.remove('card-body-dnd-accept', 'card-body-dnd-decline');
}

function handleDrop(e) {
  // обработчик события - объект "бросили/отпустили" в зону, куда можно сделать drop
  e.preventDefault();
  const cardContainer = e.currentTarget;
  const itemTaskList = STATE.taskList.find(item => item.id === STATE.dnd.id);
  let isChanged = false;

  if (cardContainer.id.includes(TASK_TODO) && itemTaskList.taskStatus !== TASK_TODO) {
    itemTaskList.taskStatus = TASK_TODO;
    isChanged = true;
  } else if (
    cardContainer.id.includes(TASK_INPROGRESS) &&
    itemTaskList.taskStatus !== TASK_INPROGRESS
  ) {
    itemTaskList.taskStatus = TASK_INPROGRESS;
    isChanged = true;
  } else if (cardContainer.id.includes(TASK_DONE) && itemTaskList.taskStatus !== TASK_DONE) {
    itemTaskList.taskStatus = TASK_DONE;
    isChanged = true;
  }
  if (isChanged) {
    renderDnDList();
    stateToStorage();
  }
  handleResetCardBlock();
}

function initDnD() {
  const todoListCard = document.getElementById('todoListCard');
  const inprogressListCard = document.getElementById('inprogressListCard');
  const doneListCard = document.getElementById('doneListCard');

  const ms = [todoListCard, inprogressListCard, doneListCard];

  for (var i = 0; i < ms.length; i++) {
    ms[i].addEventListener('dragstart', handleDragStartTask); // назначить события "начало перемещения"
    ms[i].addEventListener('dragenter', handleDragEnter); // назначить события "вход в зону"
    ms[i].addEventListener('dragleave', handleDragLeave); // назначить события "выход из зоны"
    ms[i].addEventListener('dragover', handleDragOver); // назначить события "перемещение над зоной"
    ms[i].addEventListener('drop', handleDrop); // назначить события "перемещение над зоной"
  }
  renderDnDList();
  document.addEventListener('dragend', handleResetCardBlock);
}

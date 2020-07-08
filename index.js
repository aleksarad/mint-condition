//display category next to task when render

let currentDay = ""

document.addEventListener("DOMContentLoaded", function(){
    fetchDays()
    fetchCategories()
    createNewTask()
    deleteEditTask()
})
const baseUrl = "http://localhost:3000/"

///** FETCHES TO SERVER **///

function fetchDays() {
    fetch(`${baseUrl}days`)
    .then(function(res) {
        return res.json();
    })
    .then(function(days) {
        currentDay = days[days.length-1]
        renderDay(days[days.length-1])
        renderDaysList(days)
    })
}

function fetchCategories() {
    fetch(`${baseUrl}categories`)
    .then(function(res) {
        return res.json();
    })
    .then(function(categories) {
        renderCategories(categories)
    })
}

function createTaskReq(newTaskObj) {
    const config = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        }, 
        body: JSON.stringify(newTaskObj)
    }

    fetch(`${baseUrl}tasks`, config)
    .then(function(res){
        return res.json();
    })
    .then(function(newTask){
        console.log(newTask)
        renderTask(newTask)
    })
}

function deleteTaskReq(id, li) {
    const config = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        }
    }

    fetch(`${baseUrl}tasks/${id}`, config)
    .then(function(){
    })
    .then(function(){
        li.remove()
    })
}

//edit
function editTaskRequest(id, taskObj) {
    console.log(id, taskObj)
    const config = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        }, 
        body: JSON.stringify(taskObj)
    }

    fetch(`${baseUrl}tasks/${id}`, config)
    .then(function(res){
        return res.json();
    })
    .then(function(newTask){
        console.log(newTask)
    })
}

function markCompleteReq(id, taskObj, heart) {
    const config = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        }, 
        body: JSON.stringify(taskObj)
    }

    fetch(`${baseUrl}tasks/${id}`, config)
    .then(function(res){
        return res.json();
    })
    .then(function(newTask){
        console.log(newTask)
        likeStyleHelper(heart, newTask)
    })
}

///** DOM RENDER FUNCTIONS **///

function renderCategories(categories) {
    const categorySelect = document.querySelector("#category")
    categories.forEach(function(category){
        const categoryOption = document.createElement("option")
        categoryOption.textContent = category.name
        categoryOption.setAttribute("data-id" , `${category.id}`);
        categorySelect.append(categoryOption)
    })
}

function renderDaysList(days) {
    const historyUl = document.querySelector("#history-container")
    days.forEach(function(day) {
        const newDate = retrieveJsDate(day)
        const dayLi = document.createElement("li")
        dayLi.textContent = newDate
        historyUl.append(dayLi)

        dayLi.addEventListener("click", function(e) {
            renderDay(day)
            currentDay = day
        })

    })
}

function renderDay(day) {
    const date = retrieveJsDate(day)
    const dateHeader = document.querySelector("h1")
    dateHeader.textContent = `${date} Tasks`

    const taskList = document.querySelector("#task-list")
    taskList.innerHTML = ""
    //could i store the day.id somewhere when rendering days?
    day.tasks.forEach(function(task) {
        renderTask(task)
    })
}

function renderTask(task) {
    const taskList = document.querySelector("#task-list")
    const taskLi = document.createElement("li")
    taskLi.innerHTML = `
    <a href="" class="markComplete"> ♡ </a>
    <span for="content" class="taskContent" data-id="${task.id}" contenteditable="false"> ${task.content}</span>
    
    <button class="deleteButton">delete</button>
    <br>
    <div class="category-container">
    <img class="categoryImg" src="${task.category.icon}" alt="${task.category.name} icon">
        <span>${task.category.name}</span>
    </div>
    <hr class="horizontal">
    `
    taskList.append(taskLi)
    console.log(task.category)
    const heartIcon = taskLi.querySelector(".markComplete")
    likeStyleHelper(heartIcon, task)
}

function createNewTask() {
    console.log(currentDay)
    const newTaskForm = document.querySelector("#new-task-form")
    newTaskForm.addEventListener("submit", function(e){
        e.preventDefault();

        const categoryOption = newTaskForm.querySelector("select")
        const chosenOption = categoryOption.options[categoryOption.selectedIndex]
        const categoryId = chosenOption.getAttribute("data-id")

        const newTaskObj = {
            category_id: categoryId,
            day_id: currentDay.id,
            content: newTaskForm.content.value,
        }
        console.log(newTaskObj)
        createTaskReq(newTaskObj)
    })
}

//delete task
function deleteEditTask() {
    const taskList = document.querySelector("#task-list")
    taskList.addEventListener("click", function(e){
        e.preventDefault()
        if (e.target.className === "deleteButton") {
            const task = e.target.previousElementSibling
            const taskId = task.getAttribute('data-id');
            deleteTaskReq(taskId, e.target.parentElement)

        }
        else if (e.target.className === "taskContent") {
            const task = e.target
            task.contentEditable = "true";

            task.addEventListener("keypress", function(e){
                e.stopImmediatePropagation()
                if (e.key === "Enter") {
                    e.preventDefault()
                    const id = task.getAttribute('data-id')

                    const patchObj = {
                        content: task.textContent
                    }
                    editTaskRequest(id, patchObj)
                }
            })
        }

        else if (e.target.className === "markComplete") {
            e.preventDefault()
            console.log(e.target)
            const completeStatus = e.target 
            const id = completeStatus.nextElementSibling.getAttribute('data-id')
            // const heart = e.target.querySelector("i")

            patchObj = {
                complete: findCompleteStatus(e.target),
            } 
            console.log(patchObj)
            markCompleteReq(id, patchObj, e.target)
        }
    })
}

///** HELPERS **///

function retrieveJsDate(day) {
    const currentDate = day.created_at.split("T")
    const date = currentDate[0]
    const newDate = new Date(date.replace(/-/g, '\/'));
    return newDate.toLocaleDateString("en-US")
}

function likeStyleHelper(heart, task) {
    if (task.complete === true) {
        heart.style.color = "black"
    }
    else if (task.complete === false) {
        heart.style.color = "red"
    }
}

function findCompleteStatus(heart) {
    if (heart.style.color === "black") {
        return false
    }
    else if (heart.style.color = "red") {
        return true
    }
}
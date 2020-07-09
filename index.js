const hearts = {
    complete: "♥",
    incomplete: "♡",
}
let currentDay = ""

document.addEventListener("DOMContentLoaded", function(){
    fetchDays()
    fetchCategories()
    createNewTask()
    deleteEditTask()
    toggleHistory()
    toggleForm()
})

const baseUrl = "http://localhost:3000/"
const progressBar = document.querySelector("#progress")

///** FETCHES TO SERVER **///

function fetchDays() {
    fetch(`${baseUrl}days`)
    .then(res => res.json())
    .then(days => {
        currentDay = days[days.length-1]
        renderDay(days[days.length-1])
        renderDaysList(days)
    })
}

function fetchOneDay(day) {
    fetch(`${baseUrl}days/${day.id}`)
    .then(res => res.json())
    .then(day => {
        currentDay = day 
        renderDay(day)
    })
}

function fetchCategories() {
    fetch(`${baseUrl}categories`)
    .then(res => res.json())
    .then(categories => renderCategories(categories))
}

// function fetchOneCategory(id) {
//     fetch(`${baseUrl}categories/${id}`)
//     .then(res => res.json())
//     .then(category => {
//         console.log(category)
//         renderTasksByCategory(category)
//     })
// }

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
    .then(res => res.json())
    .then(task => {
        renderTask(task)
        progressBar.max += 1
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
    //do i need the first .then()
    .then()
    .then(() => {
        li.remove()
        progressBar.max -= 1
    })
}

//edit
function editTaskRequest(id, taskObj) {
    const config = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        }, 
        body: JSON.stringify(taskObj)
    }

    fetch(`${baseUrl}tasks/${id}`, config)
    .then(res => res.json())
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
    .then(res => res.json())
    .then(update => {
        likeStyleHelper(heart, update)
        updateProgressBar(update)
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
        //converting date from Ruby to JS
        const newDate = retrieveJsDate(day)

        const dayLi = document.createElement("li")
        dayLi.textContent = newDate
        historyUl.prepend(dayLi)

        dayLi.addEventListener("click", function(e) {
            fetchOneDay(day)
        })
    })
}

function renderDay(day) {
    const date = retrieveJsDate(day)
    const dateHeader = document.querySelector("h1")
    dateHeader.textContent = `${date} Tasks`

    const taskList = document.querySelector("#task-list")
    taskList.innerHTML = ""

    resetProgressBar()
    progressBar.max = day.tasks.length 

    day.tasks.forEach(function(task) {
        renderTask(task)

        if(task.complete === true) {
            progressBar.value ++
        }
    })

}

function renderTask(task) {
    const taskList = document.querySelector("#task-list")
    const taskLi = document.createElement("li")
    taskLi.innerHTML = `
    <a href="" class="markComplete"></a>
    <span for="content" class="taskContent" data-id="${task.id}" contenteditable="false"> ${task.content}</span>
    
    <span class="deleteButton">&#10005;</span>
    <br>
    <div id="category-container" data-id="${task.category.id}">
    <img class="categoryImg" src="${task.category.icon}" alt="${task.category.name} icon">
        <span class="category-name">${task.category.name}</span>
    </div>
    <hr class="horizontal">
    `
    taskList.append(taskLi)

    const heartIcon = taskLi.querySelector(".markComplete")
    likeStyleHelper(heartIcon, task)
}

function createNewTask() {
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
            const completeStatus = e.target 
            const id = completeStatus.nextElementSibling.getAttribute('data-id')

            patchObj = {
                complete: findCompleteStatus(e.target),
            } 
            markCompleteReq(id, patchObj, e.target)
        }

        // else if (e.target.className === "categoryImg" || e.target.className === "category-name") {
        //     e.stopImmediatePropagation()
        //     const categoryId = e.target.parentElement.getAttribute("data-id")
        //     fetchOneCategory(categoryId)
        // }
    })
}

// function renderTasksByCategory(category) {
//     const tasksByCategoryContainer = document.querySelector("#tasks-by-category")

//     category.tasks.forEach(function(task){
//         const taskLi = document.createElement("li")
//         taskLi.textContent = task.content
//         tasksByCategoryContainer.append(taskLi)
//     })
// }

///** HELPERS **///
function retrieveJsDate(day) {
    const currentDate = day.created_at.split("T")
    const date = currentDate[0]
    const newDate = new Date(date.replace(/-/g, '\/'));
    return newDate.toLocaleDateString("en-US")
}

function likeStyleHelper(heart, task) {
    if (task.complete === true) {
        heart.textContent = hearts.complete
        heart.style.color = "#75c9bc"
        heart.parentElement.style.backgroundColor = "#cde4e0"
    }
    else if (task.complete === false) {
        heart.textContent = hearts.incomplete
        heart.style.color = "#3f6660"
        heart.parentElement.style.backgroundColor = "#fff5ff"
    }
}

function findCompleteStatus(heart) {
    if (heart.textContent === hearts.complete) {
        return false
    }
    else if (heart.textContent === hearts.incomplete) {
        return true
    }
}

function toggleHistory() {
    const showHistory = document.querySelector("#show-history")
    const historyContainer = document.querySelector("#history-container")
    showHistory.addEventListener("click", function(){
        historyContainer.classList.toggle("hidden")
    })
}

function toggleForm() {
    const showForm = document.querySelector("#show-form")
    const newTaskForm = document.querySelector("#new-task-form")
    showForm.addEventListener("click", function(){
        newTaskForm.classList.toggle("hidden")
    })
}

function updateProgressBar(newTask) {
    if (newTask.complete === true) {
        progressBar.value += 1
    }
    else if (newTask.complete === false) {
        progressBar.value -= 1
    }
}

function resetProgressBar() {
    progressBar.max = 0
    progressBar.value = 0
}


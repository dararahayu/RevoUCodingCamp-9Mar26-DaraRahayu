// --- 1. CLOCK, DATE & GREETING ---
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date-display');
const greetingMsgEl = document.getElementById('greeting-msg');
const userNameInput = document.getElementById('user-name');

function updateTime() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const hour = now.getHours();
    let greeting = 'Good Evening,';
    if (hour < 12) greeting = 'Good Morning,';
    else if (hour < 18) greeting = 'Good Afternoon,';
    greetingMsgEl.textContent = greeting;
}
setInterval(updateTime, 1000);
updateTime();

// Name setup
userNameInput.value = localStorage.getItem('dashboardName') || '';
userNameInput.addEventListener('input', (e) => {
    localStorage.setItem('dashboardName', e.target.value);
});


// --- 2. THEME TOGGLE (Light/Dark Mode) ---
const themeBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

themeBtn.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});


// --- 3. FOCUS TIMER (25 Mins) ---
let timerInterval;
let timeLeft = 25 * 60; // 25 minutes in seconds
let isTimerRunning = false;
const timerDisplay = document.getElementById('timer-display');

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

document.getElementById('timer-start').addEventListener('click', () => {
    if (!isTimerRunning) {
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                timerDisplay.textContent = formatTime(timeLeft);
            } else {
                clearInterval(timerInterval);
                isTimerRunning = false;
                alert('Focus session complete!');
            }
        }, 1000);
    }
});

document.getElementById('timer-stop').addEventListener('click', () => {
    clearInterval(timerInterval);
    isTimerRunning = false;
});

document.getElementById('timer-reset').addEventListener('click', () => {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timeLeft = 25 * 60;
    timerDisplay.textContent = formatTime(timeLeft);
});


// --- 4. TO-DO LIST (With Duplicate Prevention) ---
let todos = JSON.parse(localStorage.getItem('todos')) || [];
const todoListEl = document.getElementById('todo-list');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');

function renderTodos() {
    todoListEl.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        if (todo.completed) li.classList.add('completed');

        li.innerHTML = `
            <span style="flex: 1; cursor: pointer;" onclick="toggleTodo(${index})">${todo.text}</span>
            <div class="todo-actions">
                <button onclick="editTodo(${index})">Edit</button>
                <button class="delete-btn" onclick="deleteTodo(${index})">Delete</button>
            </div>
        `;
        todoListEl.appendChild(li);
    });
    localStorage.setItem('todos', JSON.stringify(todos));
}

todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();

    // Optional Challenge: Prevent Duplicate Tasks
    const isDuplicate = todos.some(todo => todo.text.toLowerCase() === text.toLowerCase());

    if (text && !isDuplicate) {
        todos.push({ text, completed: false });
        todoInput.value = '';
        renderTodos();
    } else if (isDuplicate) {
        alert("Task already exists!");
    }
});

window.toggleTodo = (index) => {
    todos[index].completed = !todos[index].completed;
    renderTodos();
};

window.deleteTodo = (index) => {
    todos.splice(index, 1);
    renderTodos();
};

window.editTodo = (index) => {
    const newText = prompt("Edit task:", todos[index].text);
    if (newText !== null && newText.trim() !== '') {
        const isDuplicate = todos.some((todo, i) => i !== index && todo.text.toLowerCase() === newText.trim().toLowerCase());
        if (!isDuplicate) {
            todos[index].text = newText.trim();
            renderTodos();
        } else {
            alert("Task already exists!");
        }
    }
};


// --- 5. QUICK LINKS ---
let links = JSON.parse(localStorage.getItem('quickLinks')) || [];
const linksContainer = document.getElementById('links-container');
const linkForm = document.getElementById('link-form');

function renderLinks() {
    linksContainer.innerHTML = '';
    links.forEach((link, index) => {
        const a = document.createElement('a');
        a.href = link.url;
        a.target = "_blank";
        a.className = "link-btn";
        a.innerHTML = `${link.name} <span style="font-size: 0.7em;" onclick="event.preventDefault(); deleteLink(${index})">❌</span>`;
        linksContainer.appendChild(a);
    });
    localStorage.setItem('quickLinks', JSON.stringify(links));
}

linkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('link-name').value.trim();
    let url = document.getElementById('link-url').value.trim();

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    if (name && url) {
        links.push({ name, url });
        document.getElementById('link-name').value = '';
        document.getElementById('link-url').value = '';
        renderLinks();
    }
});

window.deleteLink = (index) => {
    links.splice(index, 1);
    renderLinks();
};

// Initial Render
renderTodos();
renderLinks();
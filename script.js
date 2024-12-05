const GEMINI_API_KEY = 'AIzaSyDH0FW1vngTSfsNtP08oPMxxB0OmpXINrw';

document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTask');
    const taskList = document.getElementById('taskList');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const languageBtn = document.getElementById('languageBtn');
    const aiHelper = document.getElementById('aiHelper');
    const aiSuggestions = document.getElementById('aiSuggestions');
    const themeBtn = document.getElementById('themeBtn');

    // Theme handling
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    function updateTheme() {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        themeBtn.innerHTML = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
        localStorage.setItem('darkMode', isDarkMode);
    }

    themeBtn.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        updateTheme();
    });

    // Initialize theme
    updateTheme();

    // Language translations
    const translations = {
        en: {
            title: 'Task Manager',
            inputPlaceholder: 'Enter a new task...',
            addTask: 'Add Task',
            all: 'All',
            active: 'Active',
            completed: 'Completed',
            delete: 'Delete',
            aiHelp: '🤖 AI Help',
            aiLoading: 'Getting AI suggestions...',
            aiError: 'Error getting suggestions. Please try again.',
            aiPrompt: 'Suggest some tasks',
            darkMode: '🌙 Dark Mode',
            lightMode: '☀️ Light Mode'
        },
        ar: {
            title: 'مدير المهام',
            inputPlaceholder: 'أدخل مهمة جديدة...',
            addTask: 'إضافة مهمة',
            all: 'الكل',
            active: 'نشط',
            completed: 'مكتمل',
            delete: 'حذف',
            aiHelp: '🤖 مساعد ذكي',
            aiLoading: 'جاري الحصول على اقتراحات...',
            aiError: 'خطأ في الحصول على الاقتراحات. حاول مرة أخرى.',
            aiPrompt: 'اقترح بعض المهام',
            darkMode: '🌙 الوضع الداكن',
            lightMode: '☀️ الوضع الفاتح'
        }
    };

    let currentLang = localStorage.getItem('language') || 'en';

    // AI Helper Function
    async function getAISuggestions() {
        try {
            aiSuggestions.innerHTML = `<div class="suggestion-item">${translations[currentLang].aiLoading}</div>`;
            aiSuggestions.classList.add('active');

            const prompt = currentLang === 'en' ? 
                "Suggest 5 practical daily tasks. Return only a JSON array of strings." :
                "اقترح 5 مهام يومية عملية. قم بإرجاع مصفوفة JSON من النصوص فقط.";

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            let suggestedTasks;
            
            try {
                // Try to parse the response as JSON
                const text = data.candidates[0].content.parts[0].text;
                // Remove any markdown formatting if present
                const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
                suggestedTasks = JSON.parse(jsonStr);
            } catch (parseError) {
                // If parsing fails, try to extract tasks from text format
                const text = data.candidates[0].content.parts[0].text;
                suggestedTasks = text
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => line.replace(/^\d+\.\s*/, '').trim())
                    .slice(0, 5);
            }

            if (!Array.isArray(suggestedTasks) || suggestedTasks.length === 0) {
                throw new Error('Invalid response format');
            }

            aiSuggestions.innerHTML = suggestedTasks
                .map(task => `<div class="suggestion-item" onclick="addSuggestedTask(this)">${task}</div>`)
                .join('');

        } catch (error) {
            console.error('AI suggestion error:', error);
            aiSuggestions.innerHTML = `<div class="suggestion-item error">${translations[currentLang].aiError}</div>`;
        }
    }

    // Add suggested task
    window.addSuggestedTask = function(element) {
        taskInput.value = element.textContent;
        aiSuggestions.classList.remove('active');
    };

    // AI Helper button click
    aiHelper.addEventListener('click', getAISuggestions);

    // Language switcher
    languageBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'ar' : 'en';
        languageBtn.textContent = currentLang === 'en' ? ' EN' : ' عربي';
        document.documentElement.lang = currentLang;
        document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
        aiHelper.textContent = translations[currentLang].aiHelp;
        updateLanguage();
        localStorage.setItem('language', currentLang);
    });

    function updateLanguage() {
        document.querySelector('h1').textContent = translations[currentLang].title;
        taskInput.placeholder = translations[currentLang].inputPlaceholder;
        addTaskBtn.textContent = translations[currentLang].addTask;
        aiHelper.textContent = translations[currentLang].aiHelp;
        
        // Update filter buttons
        const filterTexts = ['all', 'active', 'completed'];
        filterBtns.forEach((btn, index) => {
            btn.textContent = translations[currentLang][filterTexts[index]];
        });

        // Update delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.textContent = translations[currentLang].delete;
        });
        themeBtn.innerHTML = isDarkMode ? translations[currentLang].lightMode : translations[currentLang].darkMode;
    }

    // Load tasks from localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <button class="delete-btn">${translations[currentLang].delete}</button>
        `;

        const checkbox = li.querySelector('.task-checkbox');
        const deleteBtn = li.querySelector('.delete-btn');

        checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            li.classList.toggle('completed');
            saveTasks();
        });

        deleteBtn.addEventListener('click', () => {
            li.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                tasks = tasks.filter(t => t !== task);
                saveTasks();
                renderTasks();
            }, 300);
        });

        return li;
    }

    function renderTasks(filter = 'all') {
        taskList.innerHTML = '';
        let filteredTasks = tasks;

        if (filter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (filter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }

        filteredTasks.forEach(task => {
            taskList.appendChild(createTaskElement(task));
        });
    }

    addTaskBtn.addEventListener('click', () => {
        const text = taskInput.value.trim();
        if (text) {
            const newTask = {
                text,
                completed: false,
                id: Date.now()
            };
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            taskInput.value = '';
            aiSuggestions.classList.remove('active');
        }
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTaskBtn.click();
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks(btn.dataset.filter);
        });
    });

    // Initial render
    renderTasks();
    updateLanguage();
});

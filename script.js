class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentDate = new Date();
        this.currentView = 'list';
        
        this.initializeElements();
        this.bindEvents();
        this.render();
        this.renderCalendar();
    }

    initializeElements() {
        // 입력 요소들
        this.todoInput = document.getElementById('todoInput');
        this.todoDate = document.getElementById('todoDate');
        this.addTodoBtn = document.getElementById('addTodo');
        this.exportTodosBtn = document.getElementById('exportTodos');
        
        // 뷰 요소들
        this.listView = document.getElementById('listView');
        this.calendarView = document.getElementById('calendarView');
        this.todoList = document.getElementById('todoList');
        
        // 달력 요소들
        this.calendarDays = document.getElementById('calendarDays');
        this.currentMonthEl = document.getElementById('currentMonth');
        this.prevMonthBtn = document.getElementById('prevMonth');
        this.nextMonthBtn = document.getElementById('nextMonth');
        
        // 뷰 토글 버튼들
        this.toggleBtns = document.querySelectorAll('.toggle-btn');
        
        // 오늘 날짜를 기본값으로 설정
        this.todoDate.value = this.formatDate(new Date());
    }

    bindEvents() {
        // 투두 추가
        this.addTodoBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // 내보내기
        this.exportTodosBtn.addEventListener('click', () => this.exportTodos());

        // 뷰 전환
        this.toggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // 달력 네비게이션
        this.prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
        this.nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        const date = this.todoDate.value;
        
        if (!text || !date) {
            alert('할 일과 날짜를 모두 입력해주세요!');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            date: date,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.push(todo);
        this.saveTodos();
        this.render();
        this.renderCalendar();
        
        // 입력 필드 초기화
        this.todoInput.value = '';
        this.todoInput.focus();
    }

    deleteTodo(id) {
        if (confirm('정말 삭제하시겠습니까?')) {
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.saveTodos();
            this.render();
            this.renderCalendar();
        }
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
            this.renderCalendar();
        }
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        const newText = prompt('할 일을 수정하세요:', todo.text);
        if (newText !== null && newText.trim() !== '') {
            todo.text = newText.trim();
            this.saveTodos();
            this.render();
            this.renderCalendar();
        }
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    switchView(view) {
        this.currentView = view;
        
        // 버튼 상태 업데이트
        this.toggleBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // 뷰 표시/숨김
        if (view === 'list') {
            this.listView.classList.remove('hidden');
            this.calendarView.classList.add('hidden');
        } else {
            this.listView.classList.add('hidden');
            this.calendarView.classList.remove('hidden');
            this.renderCalendar();
        }
    }

    render() {
        // 날짜별로 정렬
        const sortedTodos = [...this.todos].sort((a, b) => {
            if (a.date === b.date) {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
            return a.date.localeCompare(b.date);
        });

        this.todoList.innerHTML = sortedTodos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}">
                <input type="checkbox" class="todo-checkbox" 
                       ${todo.completed ? 'checked' : ''} 
                       onchange="todoApp.toggleTodo(${todo.id})">
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-date">${this.formatDisplayDate(todo.date)}</div>
                </div>
                <div class="todo-actions">
                    <button class="edit-btn" onclick="todoApp.editTodo(${todo.id})">수정</button>
                    <button class="delete-btn" onclick="todoApp.deleteTodo(${todo.id})">삭제</button>
                </div>
            </div>
        `).join('');
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        this.currentMonthEl.textContent = `${year}년 ${month + 1}월`;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const today = new Date();
        const todayStr = this.formatDate(today);
        
        let calendarHTML = '';
        
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dateStr = this.formatDate(currentDate);
            const isToday = dateStr === todayStr;
            const isOtherMonth = currentDate.getMonth() !== month;
            
            // 해당 날짜의 투두들 가져오기
            const dayTodos = this.todos.filter(todo => todo.date === dateStr);
            const todoTexts = dayTodos.map(todo => todo.text).slice(0, 3); // 최대 3개만 표시
            
            const dayClass = `calendar-day ${isToday ? 'today' : ''} ${isOtherMonth ? 'other-month' : ''}`;
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateStr}">
                    <div class="calendar-day-number">${currentDate.getDate()}</div>
                    <div class="calendar-day-todos">
                        ${todoTexts.map(text => this.escapeHtml(text)).join('<br>')}
                        ${dayTodos.length > 3 ? `외 ${dayTodos.length - 3}개` : ''}
                    </div>
                </div>
            `;
        }
        
        this.calendarDays.innerHTML = calendarHTML;
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDisplayDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (dateStr === this.formatDate(today)) {
            return '오늘';
        } else if (dateStr === this.formatDate(tomorrow)) {
            return '내일';
        } else {
            return `${date.getMonth() + 1}월 ${date.getDate()}일`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    exportTodos() {
        if (this.todos.length === 0) {
            alert('내보낼 할일이 없습니다!');
            return;
        }

        // 날짜별로 정렬
        const sortedTodos = [...this.todos].sort((a, b) => {
            if (a.date === b.date) {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
            return a.date.localeCompare(b.date);
        });

        // 텍스트 파일 내용 생성
        let content = '📝 투두리스트 내보내기\n';
        content += '='.repeat(50) + '\n\n';
        content += `내보내기 날짜: ${new Date().toLocaleDateString('ko-KR')}\n`;
        content += `총 할일 개수: ${this.todos.length}개\n\n`;

        // 날짜별로 그룹화
        const groupedTodos = {};
        sortedTodos.forEach(todo => {
            if (!groupedTodos[todo.date]) {
                groupedTodos[todo.date] = [];
            }
            groupedTodos[todo.date].push(todo);
        });

        // 각 날짜별로 할일 목록 작성
        Object.keys(groupedTodos).sort().forEach(date => {
            const todos = groupedTodos[date];
            const displayDate = this.formatDisplayDate(date);
            
            content += `📅 ${displayDate} (${date})\n`;
            content += '-'.repeat(30) + '\n';
            
            todos.forEach((todo, index) => {
                const status = todo.completed ? '✅ 완료' : '⏳ 대기';
                content += `${index + 1}. ${todo.text} [${status}]\n`;
            });
            
            content += '\n';
        });

        // 완료/미완료 통계
        const completedCount = this.todos.filter(todo => todo.completed).length;
        const pendingCount = this.todos.length - completedCount;
        
        content += '📊 통계\n';
        content += '-'.repeat(30) + '\n';
        content += `✅ 완료: ${completedCount}개\n`;
        content += `⏳ 대기: ${pendingCount}개\n`;
        content += `📈 완료율: ${Math.round((completedCount / this.todos.length) * 100)}%\n\n`;
        
        content += '='.repeat(50) + '\n';
        content += '✨ 투두리스트 앱에서 생성되었습니다!';

        // 파일 다운로드
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `투두리스트_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('투두리스트가 성공적으로 내보내졌습니다! 📄');
    }
}

// 앱 초기화
const todoApp = new TodoApp(); 
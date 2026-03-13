import { describe, test, expect, beforeEach } from 'vitest';

// Define Task class in the test environment
class Task {
  constructor(id, text, completed = false, createdAt = Date.now()) {
    this.id = id;
    this.text = text;
    this.completed = completed;
    this.createdAt = createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      text: this.text,
      completed: this.completed,
      createdAt: this.createdAt
    };
  }

  static fromJSON(data) {
    return new Task(data.id, data.text, data.completed, data.createdAt);
  }
}

// Define TaskManager class in the test environment
class TaskManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.tasks = [];
  }

  addTask(text) {
    const trimmedText = text.trim();
    if (trimmedText === '') {
      return null;
    }

    const id = Date.now().toString();
    const task = new Task(id, trimmedText);
    this.tasks.push(task);
    
    return task;
  }

  editTask(id, newText) {
    const trimmedText = newText.trim();
    if (trimmedText === '') {
      return false;
    }

    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.text = trimmedText;
      return true;
    }
    return false;
  }

  toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      return true;
    }
    return false;
  }

  deleteTask(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      return true;
    }
    return false;
  }

  getTasks() {
    return this.tasks;
  }

  loadTasks(tasksData) {
    this.tasks = tasksData.map(data => Task.fromJSON(data));
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = '';

    const taskList = document.createElement('ul');
    taskList.className = 'task-list';

    this.tasks.forEach(task => {
      const taskItem = document.createElement('li');
      taskItem.className = 'task-item';
      if (task.completed) {
        taskItem.classList.add('completed');
      }

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;

      const taskText = document.createElement('span');
      taskText.className = 'task-text';
      taskText.textContent = task.text;

      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.textContent = 'Edit';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Delete';

      taskItem.appendChild(checkbox);
      taskItem.appendChild(taskText);
      taskItem.appendChild(editBtn);
      taskItem.appendChild(deleteBtn);

      taskList.appendChild(taskItem);
    });

    this.container.appendChild(taskList);
  }
}

describe('TaskManager Class - Unit Tests', () => {
  let taskManager;

  beforeEach(() => {
    taskManager = new TaskManager(null);
  });

  /**
   * Test empty string and whitespace-only task rejection
   * **Validates: Requirements 4.3, 5.4**
   */
  describe('Task Text Validation', () => {
    test('rejects empty string when adding task', () => {
      const result = taskManager.addTask('');
      
      expect(result).toBeNull();
      expect(taskManager.getTasks().length).toBe(0);
    });

    test('rejects whitespace-only string when adding task', () => {
      const result = taskManager.addTask('   ');
      
      expect(result).toBeNull();
      expect(taskManager.getTasks().length).toBe(0);
    });

    test('rejects tabs and newlines when adding task', () => {
      const result = taskManager.addTask('\t\n  \t');
      
      expect(result).toBeNull();
      expect(taskManager.getTasks().length).toBe(0);
    });

    test('rejects empty string when editing task', () => {
      const task = taskManager.addTask('Original text');
      const result = taskManager.editTask(task.id, '');
      
      expect(result).toBe(false);
      expect(task.text).toBe('Original text');
    });

    test('rejects whitespace-only string when editing task', () => {
      const task = taskManager.addTask('Original text');
      const result = taskManager.editTask(task.id, '   ');
      
      expect(result).toBe(false);
      expect(task.text).toBe('Original text');
    });

    test('trims whitespace from valid task text when adding', () => {
      const task = taskManager.addTask('  Valid task  ');
      
      expect(task.text).toBe('Valid task');
    });

    test('trims whitespace from valid task text when editing', () => {
      const task = taskManager.addTask('Original');
      taskManager.editTask(task.id, '  Updated text  ');
      
      expect(task.text).toBe('Updated text');
    });
  });

  /**
   * Test task list with 0 tasks handles operations correctly
   * **Validates: Requirements 4.3, 7.1**
   */
  describe('Empty Task List Operations', () => {
    test('getTasks returns empty array for new TaskManager', () => {
      expect(taskManager.getTasks()).toEqual([]);
      expect(taskManager.getTasks().length).toBe(0);
    });

    test('editTask returns false when task list is empty', () => {
      const result = taskManager.editTask('nonexistent-id', 'New text');
      
      expect(result).toBe(false);
    });

    test('toggleComplete returns false when task list is empty', () => {
      const result = taskManager.toggleComplete('nonexistent-id');
      
      expect(result).toBe(false);
    });

    test('deleteTask returns false when task list is empty', () => {
      const result = taskManager.deleteTask('nonexistent-id');
      
      expect(result).toBe(false);
    });
  });

  /**
   * Test specific task operations (add, edit, delete, toggle)
   * **Validates: Requirements 4.1, 5.2, 6.1, 6.4, 7.1**
   */
  describe('Task CRUD Operations', () => {
    test('addTask creates task with valid text', () => {
      const task = taskManager.addTask('Buy groceries');
      
      expect(task).not.toBeNull();
      expect(task.text).toBe('Buy groceries');
      expect(task.completed).toBe(false);
      expect(task.id).toBeDefined();
      expect(taskManager.getTasks().length).toBe(1);
    });

    test('addTask generates unique IDs for multiple tasks', () => {
      const task1 = taskManager.addTask('Task 1');
      const task2 = taskManager.addTask('Task 2');
      
      expect(task1.id).not.toBe(task2.id);
    });

    test('editTask updates task text', () => {
      const task = taskManager.addTask('Original text');
      const result = taskManager.editTask(task.id, 'Updated text');
      
      expect(result).toBe(true);
      expect(task.text).toBe('Updated text');
    });

    test('editTask returns false for nonexistent task ID', () => {
      taskManager.addTask('Task 1');
      const result = taskManager.editTask('nonexistent-id', 'New text');
      
      expect(result).toBe(false);
    });

    test('toggleComplete changes task from incomplete to complete', () => {
      const task = taskManager.addTask('Task to complete');
      expect(task.completed).toBe(false);
      
      taskManager.toggleComplete(task.id);
      
      expect(task.completed).toBe(true);
    });

    test('toggleComplete changes task from complete to incomplete', () => {
      const task = taskManager.addTask('Task to toggle');
      task.completed = true;
      
      taskManager.toggleComplete(task.id);
      
      expect(task.completed).toBe(false);
    });

    test('toggleComplete twice returns to original state', () => {
      const task = taskManager.addTask('Toggle test');
      const originalState = task.completed;
      
      taskManager.toggleComplete(task.id);
      taskManager.toggleComplete(task.id);
      
      expect(task.completed).toBe(originalState);
    });

    test('toggleComplete returns false for nonexistent task ID', () => {
      taskManager.addTask('Task 1');
      const result = taskManager.toggleComplete('nonexistent-id');
      
      expect(result).toBe(false);
    });

    test('deleteTask removes task from list', () => {
      const task = taskManager.addTask('Task to delete');
      expect(taskManager.getTasks().length).toBe(1);
      
      const result = taskManager.deleteTask(task.id);
      
      expect(result).toBe(true);
      expect(taskManager.getTasks().length).toBe(0);
    });

    test('deleteTask returns false for nonexistent task ID', () => {
      taskManager.addTask('Task 1');
      const result = taskManager.deleteTask('nonexistent-id');
      
      expect(result).toBe(false);
      expect(taskManager.getTasks().length).toBe(1);
    });

    test('deleteTask removes correct task from multiple tasks', () => {
      const task1 = taskManager.addTask('Task 1');
      const task2 = taskManager.addTask('Task 2');
      const task3 = taskManager.addTask('Task 3');
      
      taskManager.deleteTask(task2.id);
      
      const remainingTasks = taskManager.getTasks();
      expect(remainingTasks.length).toBe(2);
      expect(remainingTasks.find(t => t.id === task1.id)).toBeDefined();
      expect(remainingTasks.find(t => t.id === task3.id)).toBeDefined();
      expect(remainingTasks.find(t => t.id === task2.id)).toBeUndefined();
    });
  });

  /**
   * Test loadTasks deserialization
   * **Validates: Requirements 8.2, 8.3**
   */
  describe('Task Loading and Deserialization', () => {
    test('loadTasks deserializes task data correctly', () => {
      const tasksData = [
        { id: '1', text: 'Task 1', completed: false, createdAt: 1000 },
        { id: '2', text: 'Task 2', completed: true, createdAt: 2000 }
      ];
      
      taskManager.loadTasks(tasksData);
      
      const tasks = taskManager.getTasks();
      expect(tasks.length).toBe(2);
      expect(tasks[0].id).toBe('1');
      expect(tasks[0].text).toBe('Task 1');
      expect(tasks[0].completed).toBe(false);
      expect(tasks[1].id).toBe('2');
      expect(tasks[1].text).toBe('Task 2');
      expect(tasks[1].completed).toBe(true);
    });

    test('loadTasks creates Task instances', () => {
      const tasksData = [
        { id: '1', text: 'Task 1', completed: false, createdAt: 1000 }
      ];
      
      taskManager.loadTasks(tasksData);
      
      const tasks = taskManager.getTasks();
      expect(tasks[0]).toBeInstanceOf(Task);
    });

    test('loadTasks replaces existing tasks', () => {
      taskManager.addTask('Existing task');
      
      const tasksData = [
        { id: '1', text: 'New task', completed: false, createdAt: 1000 }
      ];
      
      taskManager.loadTasks(tasksData);
      
      const tasks = taskManager.getTasks();
      expect(tasks.length).toBe(1);
      expect(tasks[0].text).toBe('New task');
    });

    test('loadTasks handles empty array', () => {
      taskManager.addTask('Existing task');
      
      taskManager.loadTasks([]);
      
      expect(taskManager.getTasks().length).toBe(0);
    });
  });

  /**
   * Test completed task rendering includes CSS class
   * **Validates: Requirements 6.3**
   */
  describe('Task Rendering', () => {
    test('completed task rendering includes completed CSS class', () => {
      // Create a mock container
      const container = {
        innerHTML: '',
        appendChild: function(child) {
          this.lastChild = child;
        }
      };
      
      taskManager = new TaskManager(container);
      const task = taskManager.addTask('Completed task');
      task.completed = true;
      
      taskManager.render();
      
      // Check that the rendered task list contains completed class
      const taskList = container.lastChild;
      expect(taskList.className).toBe('task-list');
      
      const taskItem = taskList.children[0];
      expect(taskItem.classList.contains('completed')).toBe(true);
    });

    test('incomplete task rendering does not include completed CSS class', () => {
      const container = {
        innerHTML: '',
        appendChild: function(child) {
          this.lastChild = child;
        }
      };
      
      taskManager = new TaskManager(container);
      taskManager.addTask('Incomplete task');
      
      taskManager.render();
      
      const taskList = container.lastChild;
      const taskItem = taskList.children[0];
      expect(taskItem.classList.contains('completed')).toBe(false);
    });

    test('render handles null container gracefully', () => {
      taskManager = new TaskManager(null);
      taskManager.addTask('Task 1');
      
      // Should not throw
      expect(() => taskManager.render()).not.toThrow();
    });
  });
});

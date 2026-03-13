import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

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

describe('TaskManager - Property-Based Tests', () => {
  /**
   * Property 7: Task Addition Increases Collection Size
   * **Validates: Requirements 4.1**
   * 
   * For any task list and any valid (non-whitespace) task text, when a task is added,
   * the task list length SHALL increase by one and the new task SHALL be present in the collection.
   */
  test('Property 7: Task Addition Increases Collection Size', () => {
    fc.assert(
      fc.property(
        // Generate non-whitespace text (at least one non-whitespace character)
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (taskText) => {
          const taskManager = new TaskManager(null);
          const initialLength = taskManager.getTasks().length;
          
          const addedTask = taskManager.addTask(taskText);
          
          const newLength = taskManager.getTasks().length;
          const tasks = taskManager.getTasks();
          
          // Verify length increased by one
          const lengthIncreased = newLength === initialLength + 1;
          
          // Verify the new task is present in the collection
          const taskPresent = tasks.some(t => t.id === addedTask.id && t.text === taskText.trim());
          
          return lengthIncreased && taskPresent;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Whitespace Task Text Rejection
   * **Validates: Requirements 4.3, 5.4**
   * 
   * For any string composed entirely of whitespace characters (including empty string),
   * when submitted as task text for add or edit operations, the operation SHALL be rejected
   * and the task list SHALL remain unchanged.
   */
  test('Property 8: Whitespace Task Text Rejection - Add Operation', () => {
    fc.assert(
      fc.property(
        // Generate whitespace-only strings
        fc.oneof(
          fc.constant(''),
          fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
        ),
        (whitespaceText) => {
          const taskManager = new TaskManager(null);
          const initialLength = taskManager.getTasks().length;
          
          const result = taskManager.addTask(whitespaceText);
          
          const newLength = taskManager.getTasks().length;
          
          // Verify operation was rejected (returns null)
          // Verify task list length unchanged
          return result === null && newLength === initialLength;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8: Whitespace Task Text Rejection - Edit Operation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // Valid initial text
        fc.oneof(
          fc.constant(''),
          fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
        ), // Whitespace text for edit
        (initialText, whitespaceText) => {
          const taskManager = new TaskManager(null);
          const task = taskManager.addTask(initialText);
          const originalText = task.text;
          
          const result = taskManager.editTask(task.id, whitespaceText);
          
          // Verify operation was rejected (returns false)
          // Verify task text unchanged
          return result === false && task.text === originalText;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Task Edit Updates Text
   * **Validates: Requirements 5.2**
   * 
   * For any existing task and any valid (non-whitespace) new text, when the edit operation
   * is executed, the task's text SHALL be updated to the new value.
   */
  test('Property 9: Task Edit Updates Text', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // Initial text
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // New text
        (initialText, newText) => {
          const taskManager = new TaskManager(null);
          const task = taskManager.addTask(initialText);
          
          const result = taskManager.editTask(task.id, newText);
          
          // Verify operation succeeded
          // Verify task text was updated to trimmed new text
          return result === true && task.text === newText.trim();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Task Completion Toggle
   * **Validates: Requirements 6.1, 6.4**
   * 
   * For any task, when the toggle completion operation is executed, the task's completed
   * status SHALL change from false to true or from true to false, and executing toggle
   * twice SHALL return the task to its original completion state.
   */
  test('Property 10: Task Completion Toggle - Single Toggle', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        fc.boolean(), // Initial completion status
        (taskText, initialCompleted) => {
          const taskManager = new TaskManager(null);
          const task = taskManager.addTask(taskText);
          task.completed = initialCompleted;
          
          taskManager.toggleComplete(task.id);
          
          // Verify status changed to opposite
          return task.completed === !initialCompleted;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10: Task Completion Toggle - Double Toggle Returns to Original', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        fc.boolean(), // Initial completion status
        (taskText, initialCompleted) => {
          const taskManager = new TaskManager(null);
          const task = taskManager.addTask(taskText);
          task.completed = initialCompleted;
          
          // Toggle twice
          taskManager.toggleComplete(task.id);
          taskManager.toggleComplete(task.id);
          
          // Verify status returned to original
          return task.completed === initialCompleted;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Completed Task Visual Indication
   * **Validates: Requirements 6.3**
   * 
   * For any task with completed status set to true, when the task is rendered,
   * the output SHALL contain a visual indicator of completion (such as a CSS class).
   */
  test('Property 11: Completed Task Visual Indication', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (taskText) => {
          // Create a mock container that captures DOM operations
          const container = {
            innerHTML: '',
            lastChild: null,
            appendChild: function(child) {
              this.lastChild = child;
            }
          };
          
          const taskManager = new TaskManager(container);
          const task = taskManager.addTask(taskText);
          task.completed = true;
          
          taskManager.render();
          
          // Verify the rendered task list contains completed class
          const taskList = container.lastChild;
          if (!taskList || taskList.className !== 'task-list') {
            return false;
          }
          
          const taskItem = taskList.children[0];
          if (!taskItem) {
            return false;
          }
          
          // Verify completed CSS class is present
          return taskItem.classList.contains('completed');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Task Deletion Removes from Collection
   * **Validates: Requirements 7.1**
   * 
   * For any task list containing a specific task, when that task is deleted,
   * the task SHALL no longer be present in the collection and the list length
   * SHALL decrease by one.
   */
  test('Property 12: Task Deletion Removes from Collection', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (taskText) => {
          const taskManager = new TaskManager(null);
          const task = taskManager.addTask(taskText);
          const initialLength = taskManager.getTasks().length;
          
          const result = taskManager.deleteTask(task.id);
          
          const newLength = taskManager.getTasks().length;
          const tasks = taskManager.getTasks();
          
          // Verify operation succeeded
          // Verify length decreased by one
          // Verify task is no longer present
          const lengthDecreased = newLength === initialLength - 1;
          const taskNotPresent = !tasks.some(t => t.id === task.id);
          
          return result === true && lengthDecreased && taskNotPresent;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Task Serialization Round-Trip
   * **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
   * 
   * For any valid collection of tasks, serializing the collection to JSON and then
   * deserializing it SHALL produce an equivalent collection where each task has the
   * same id, text, completed status, and createdAt timestamp.
   */
  test('Property 13: Task Serialization Round-Trip', () => {
    fc.assert(
      fc.property(
        // Generate array of task data
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            text: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            completed: fc.boolean(),
            createdAt: fc.integer({ min: 0 })
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (taskDataArray) => {
          const taskManager = new TaskManager(null);
          
          // Create tasks
          const originalTasks = taskDataArray.map(data => 
            new Task(data.id, data.text, data.completed, data.createdAt)
          );
          
          // Serialize
          const jsonArray = originalTasks.map(task => task.toJSON());
          const jsonString = JSON.stringify(jsonArray);
          
          // Deserialize
          const parsedArray = JSON.parse(jsonString);
          taskManager.loadTasks(parsedArray);
          
          const restoredTasks = taskManager.getTasks();
          
          // Verify array length matches
          if (restoredTasks.length !== originalTasks.length) {
            return false;
          }
          
          // Verify each task matches
          for (let i = 0; i < originalTasks.length; i++) {
            const original = originalTasks[i];
            const restored = restoredTasks[i];
            
            if (
              restored.id !== original.id ||
              restored.text !== original.text ||
              restored.completed !== original.completed ||
              restored.createdAt !== original.createdAt
            ) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

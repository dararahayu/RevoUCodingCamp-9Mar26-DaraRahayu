/**
 * Unit tests for Dashboard class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div class="dashboard-container">
        <section class="greeting-section" id="greeting-container">
          <div class="time-display" id="time-display"></div>
          <div class="date-display" id="date-display"></div>
          <div class="greeting-message" id="greeting-message"></div>
        </section>
        <div class="main-content">
          <section class="task-section">
            <h2>Tasks</h2>
            <div class="task-input-container">
              <input type="text" id="task-input" placeholder="Add a new task...">
              <button id="add-task-btn">Add</button>
            </div>
            <ul class="task-list" id="task-list"></ul>
          </section>
          <section class="timer-section">
            <h2>Focus Timer</h2>
          </section>
          <section class="links-section">
            <h2>Quick Links</h2>
            <div class="link-input-container">
              <input type="text" id="link-label-input" placeholder="Label">
              <input type="url" id="link-url-input" placeholder="https://example.com">
              <button id="add-link-btn">Add</button>
            </div>
            <div class="links-grid" id="links-grid"></div>
          </section>
        </div>
      </div>
    </body>
  </html>
`, { url: 'http://localhost' });

global.document = dom.window.document;
global.window = dom.window;
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Load the app.js file
const fs = await import('fs');
const path = await import('path');
const appCode = fs.readFileSync(path.join(process.cwd(), 'js/app.js'), 'utf-8');
eval(appCode);

describe('Dashboard', () => {
  let dashboard;

  beforeEach(() => {
    // Clear localStorage before each test
    global.localStorage.clear();
    
    // Clear any existing intervals
    vi.clearAllTimers();
    
    // Create new dashboard instance
    dashboard = new Dashboard();
  });

  afterEach(() => {
    // Clean up intervals
    if (dashboard.greetingComponent) {
      dashboard.greetingComponent.destroy();
    }
    if (dashboard.focusTimer) {
      dashboard.focusTimer.destroy();
    }
  });

  describe('constructor', () => {
    it('should initialize with null component references', () => {
      expect(dashboard.greetingComponent).toBeNull();
      expect(dashboard.taskManager).toBeNull();
      expect(dashboard.focusTimer).toBeNull();
      expect(dashboard.quickLinksManager).toBeNull();
    });

    it('should define storage keys', () => {
      expect(dashboard.STORAGE_KEYS.TASKS).toBe('dashboard_tasks');
      expect(dashboard.STORAGE_KEYS.LINKS).toBe('dashboard_links');
    });
  });

  describe('init', () => {
    it('should initialize all components', () => {
      dashboard.init();
      
      expect(dashboard.greetingComponent).not.toBeNull();
      expect(dashboard.taskManager).not.toBeNull();
      expect(dashboard.focusTimer).not.toBeNull();
      expect(dashboard.quickLinksManager).not.toBeNull();
    });

    it('should initialize GreetingComponent with correct container', () => {
      dashboard.init();
      
      const greetingContainer = document.getElementById('greeting-container');
      expect(dashboard.greetingComponent.container).toBe(greetingContainer);
    });

    it('should initialize TaskManager with correct container', () => {
      dashboard.init();
      
      const taskList = document.getElementById('task-list');
      expect(dashboard.taskManager.container).toBe(taskList);
    });

    it('should initialize QuickLinksManager with correct container', () => {
      dashboard.init();
      
      const linksGrid = document.getElementById('links-grid');
      expect(dashboard.quickLinksManager.container).toBe(linksGrid);
    });
  });

  describe('loadFromStorage', () => {
    it('should load and parse data from localStorage', () => {
      const testData = [{ id: '1', text: 'Test task', completed: false }];
      localStorage.setItem('test_key', JSON.stringify(testData));
      
      let loadedData = null;
      dashboard.loadFromStorage('test_key', (data) => {
        loadedData = data;
      });
      
      expect(loadedData).toEqual(testData);
    });

    it('should handle missing data gracefully', () => {
      let loadedData = 'not-null';
      dashboard.loadFromStorage('nonexistent_key', (data) => {
        loadedData = data;
      });
      
      // Callback should not be called if no data exists
      expect(loadedData).toBe('not-null');
    });

    it('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('corrupted_key', 'invalid json {');
      
      let loadedData = 'not-null';
      dashboard.loadFromStorage('corrupted_key', (data) => {
        loadedData = data;
      });
      
      expect(loadedData).toBeNull();
    });
  });

  describe('saveToStorage', () => {
    it('should serialize and save data to localStorage', () => {
      const testData = [{ id: '1', text: 'Test task', completed: false }];
      dashboard.saveToStorage('test_key', testData);
      
      const saved = localStorage.getItem('test_key');
      expect(JSON.parse(saved)).toEqual(testData);
    });

    it('should handle save errors gracefully', () => {
      // Mock localStorage.setItem to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('Storage quota exceeded');
      };
      
      // Should not throw
      expect(() => {
        dashboard.saveToStorage('test_key', { data: 'test' });
      }).not.toThrow();
      
      // Restore original
      localStorage.setItem = originalSetItem;
    });
  });

  describe('integration with TaskManager', () => {
    beforeEach(() => {
      dashboard.init();
    });

    it('should save tasks to storage when task is added', () => {
      const taskInput = document.getElementById('task-input');
      const addTaskBtn = document.getElementById('add-task-btn');
      
      taskInput.value = 'New task';
      addTaskBtn.click();
      
      const saved = localStorage.getItem('dashboard_tasks');
      const tasks = JSON.parse(saved);
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].text).toBe('New task');
    });

    it('should load tasks from storage on init', () => {
      const testTasks = [
        { id: '1', text: 'Task 1', completed: false, createdAt: Date.now() },
        { id: '2', text: 'Task 2', completed: true, createdAt: Date.now() }
      ];
      localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
      
      // Create new dashboard and init
      const newDashboard = new Dashboard();
      newDashboard.init();
      
      expect(newDashboard.taskManager.getTasks()).toHaveLength(2);
      expect(newDashboard.taskManager.getTasks()[0].text).toBe('Task 1');
      expect(newDashboard.taskManager.getTasks()[1].text).toBe('Task 2');
      
      // Cleanup
      newDashboard.greetingComponent.destroy();
      newDashboard.focusTimer.destroy();
    });

    it('should save tasks when task is toggled', () => {
      const taskInput = document.getElementById('task-input');
      const addTaskBtn = document.getElementById('add-task-btn');
      
      taskInput.value = 'Toggle test';
      addTaskBtn.click();
      
      const taskId = dashboard.taskManager.getTasks()[0].id;
      dashboard.taskManager.toggleComplete(taskId);
      
      const saved = localStorage.getItem('dashboard_tasks');
      const tasks = JSON.parse(saved);
      
      expect(tasks[0].completed).toBe(true);
    });

    it('should save tasks when task is deleted', () => {
      const taskInput = document.getElementById('task-input');
      const addTaskBtn = document.getElementById('add-task-btn');
      
      taskInput.value = 'Delete test';
      addTaskBtn.click();
      
      const taskId = dashboard.taskManager.getTasks()[0].id;
      dashboard.taskManager.deleteTask(taskId);
      
      const saved = localStorage.getItem('dashboard_tasks');
      const tasks = JSON.parse(saved);
      
      expect(tasks).toHaveLength(0);
    });
  });

  describe('integration with QuickLinksManager', () => {
    beforeEach(() => {
      dashboard.init();
    });

    it('should save links to storage when link is added', () => {
      const labelInput = document.getElementById('link-label-input');
      const urlInput = document.getElementById('link-url-input');
      const addLinkBtn = document.getElementById('add-link-btn');
      
      labelInput.value = 'Google';
      urlInput.value = 'https://google.com';
      addLinkBtn.click();
      
      const saved = localStorage.getItem('dashboard_links');
      const links = JSON.parse(saved);
      
      expect(links).toHaveLength(1);
      expect(links[0].label).toBe('Google');
      expect(links[0].url).toBe('https://google.com');
    });

    it('should load links from storage on init', () => {
      const testLinks = [
        { id: '1', label: 'GitHub', url: 'https://github.com' },
        { id: '2', label: 'Google', url: 'https://google.com' }
      ];
      localStorage.setItem('dashboard_links', JSON.stringify(testLinks));
      
      // Create new dashboard and init
      const newDashboard = new Dashboard();
      newDashboard.init();
      
      expect(newDashboard.quickLinksManager.getLinks()).toHaveLength(2);
      expect(newDashboard.quickLinksManager.getLinks()[0].label).toBe('GitHub');
      expect(newDashboard.quickLinksManager.getLinks()[1].label).toBe('Google');
      
      // Cleanup
      newDashboard.greetingComponent.destroy();
      newDashboard.focusTimer.destroy();
    });

    it('should save links when link is deleted', () => {
      const labelInput = document.getElementById('link-label-input');
      const urlInput = document.getElementById('link-url-input');
      const addLinkBtn = document.getElementById('add-link-btn');
      
      labelInput.value = 'Delete test';
      urlInput.value = 'https://example.com';
      addLinkBtn.click();
      
      const linkId = dashboard.quickLinksManager.getLinks()[0].id;
      dashboard.quickLinksManager.deleteLink(linkId);
      
      const saved = localStorage.getItem('dashboard_links');
      const links = JSON.parse(saved);
      
      expect(links).toHaveLength(0);
    });
  });
});

/**
 * Integration tests for Dashboard
 * Tests the complete wiring of all components together
 * 
 * Requirements Coverage:
 * - Requirement 12.1: Dashboard loads and displays initial interface within 1 second
 * - Requirement 12.2: Task operations update display within 100ms
 * - Requirement 12.3: Quick links operations update display within 100ms
 * - Requirement 12.4: Timer display updates every second without lag
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Dashboard Integration Tests', () => {
  let dom;
  let window;
  let document;
  let localStorage;

  beforeEach(() => {
    // Read the actual HTML file
    const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf-8');
    
    // Create a JSDOM instance
    dom = new JSDOM(html, {
      url: 'http://localhost',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    
    window = dom.window;
    document = window.document;
    
    // Mock localStorage
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
      };
    })();
    
    localStorage = localStorageMock;
    window.localStorage = localStorageMock;
    
    // Mock Notification API
    window.Notification = {
      permission: 'granted'
    };
    
    // Load the app.js script
    const appScript = fs.readFileSync(path.resolve(__dirname, '../../js/app.js'), 'utf-8');
    const scriptEl = document.createElement('script');
    scriptEl.textContent = appScript;
    document.body.appendChild(scriptEl);
  });

  afterEach(() => {
    if (dom) {
      dom.window.close();
    }
  });

  describe('Dashboard Initialization', () => {
    it('should initialize all components on DOMContentLoaded', (done) => {
      // Trigger DOMContentLoaded
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      // Wait for initialization
      setTimeout(() => {
        // Check greeting component
        const timeDisplay = document.getElementById('time-display');
        const dateDisplay = document.getElementById('date-display');
        const greetingMessage = document.getElementById('greeting-message');
        
        expect(timeDisplay.textContent).toMatch(/\d{1,2}:\d{2}:\d{2} (AM|PM)/);
        expect(dateDisplay.textContent).toMatch(/\w+, \w+ \d+/);
        expect(greetingMessage.textContent).toMatch(/Good (Morning|Afternoon|Evening)/);
        
        // Check timer component
        const timerDisplay = document.getElementById('timer-display');
        expect(timerDisplay.textContent).toBe('25:00');
        
        // Check task list exists
        const taskList = document.getElementById('task-list');
        expect(taskList).toBeTruthy();
        
        // Check links grid exists
        const linksGrid = document.getElementById('links-grid');
        expect(linksGrid).toBeTruthy();
        
        // Check timer buttons exist and have correct initial state
        const startBtn = document.getElementById('timer-start-btn');
        const stopBtn = document.getElementById('timer-stop-btn');
        const resetBtn = document.getElementById('timer-reset-btn');
        
        expect(startBtn).toBeTruthy();
        expect(stopBtn).toBeTruthy();
        expect(resetBtn).toBeTruthy();
        expect(startBtn.disabled).toBe(false);
        expect(stopBtn.disabled).toBe(true);
        
        done();
      }, 100);
    });

    it('should display initial interface within 1 second', (done) => {
      const startTime = Date.now();
      
      // Trigger DOMContentLoaded
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      setTimeout(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(1000);
        
        // Verify all components are rendered
        const timeDisplay = document.getElementById('time-display');
        const timerDisplay = document.getElementById('timer-display');
        const taskList = document.getElementById('task-list');
        const linksGrid = document.getElementById('links-grid');
        
        expect(timeDisplay.textContent).toBeTruthy();
        expect(timerDisplay.textContent).toBeTruthy();
        expect(taskList).toBeTruthy();
        expect(linksGrid).toBeTruthy();
        
        done();
      }, 50);
    });

    it('should render all component containers correctly', (done) => {
      // Trigger DOMContentLoaded
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      setTimeout(() => {
        // Verify greeting container
        const greetingContainer = document.getElementById('greeting-container');
        expect(greetingContainer).toBeTruthy();
        
        // Verify task section
        const taskInput = document.getElementById('task-input');
        const addTaskBtn = document.getElementById('add-task-btn');
        expect(taskInput).toBeTruthy();
        expect(addTaskBtn).toBeTruthy();
        
        // Verify timer section
        const timerDisplay = document.getElementById('timer-display');
        const timerStartBtn = document.getElementById('timer-start-btn');
        const timerStopBtn = document.getElementById('timer-stop-btn');
        const timerResetBtn = document.getElementById('timer-reset-btn');
        expect(timerDisplay).toBeTruthy();
        expect(timerStartBtn).toBeTruthy();
        expect(timerStopBtn).toBeTruthy();
        expect(timerResetBtn).toBeTruthy();
        
        // Verify links section
        const linkLabelInput = document.getElementById('link-label-input');
        const linkUrlInput = document.getElementById('link-url-input');
        const addLinkBtn = document.getElementById('add-link-btn');
        expect(linkLabelInput).toBeTruthy();
        expect(linkUrlInput).toBeTruthy();
        expect(addLinkBtn).toBeTruthy();
        
        done();
      }, 100);
    });

    it('should update time display every second', (done) => {
      // Trigger DOMContentLoaded
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      setTimeout(() => {
        const timeDisplay = document.getElementById('time-display');
        const initialTime = timeDisplay.textContent;
        
        // Wait for at least 1 second to see if time updates
        setTimeout(() => {
          const updatedTime = timeDisplay.textContent;
          
          // Time should have changed (seconds should be different)
          expect(updatedTime).not.toBe(initialTime);
          expect(updatedTime).toMatch(/\d{1,2}:\d{2}:\d{2} (AM|PM)/);
          
          done();
        }, 1100);
      }, 100);
    });

    it('should update greeting component without affecting other components', (done) => {
      // Trigger DOMContentLoaded
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      setTimeout(() => {
        // Add a task
        const taskInput = document.getElementById('task-input');
        const addTaskBtn = document.getElementById('add-task-btn');
        taskInput.value = 'Test task';
        addTaskBtn.click();
        
        setTimeout(() => {
          const timeDisplay = document.getElementById('time-display');
          const taskList = document.getElementById('task-list');
          
          const initialTime = timeDisplay.textContent;
          const taskItems = taskList.querySelectorAll('.task-item');
          
          // Verify task exists
          expect(taskItems.length).toBe(1);
          
          // Wait for time to update
          setTimeout(() => {
            const updatedTime = timeDisplay.textContent;
            const taskItemsAfter = taskList.querySelectorAll('.task-item');
            
            // Time should have updated
            expect(updatedTime).not.toBe(initialTime);
            
            // Task should still exist (greeting updates don't affect tasks)
            expect(taskItemsAfter.length).toBe(1);
            expect(taskItemsAfter[0].textContent).toContain('Test task');
            
            done();
          }, 1100);
        }, 50);
      }, 100);
    });
  });

  describe('Task Operations', () => {
    beforeEach((done) => {
      // Initialize dashboard
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      setTimeout(done, 50);
    });

    it('should add a task and update display within 100ms', (done) => {
      const taskInput = document.getElementById('task-input');
      const addTaskBtn = document.getElementById('add-task-btn');
      const taskList = document.getElementById('task-list');
      
      const startTime = Date.now();
      
      taskInput.value = 'Test task';
      addTaskBtn.click();
      
      setTimeout(() => {
        const updateTime = Date.now() - startTime;
        expect(updateTime).toBeLessThan(100);
        
        const taskItems = taskList.querySelectorAll('.task-item');
        expect(taskItems.length).toBe(1);
        expect(taskItems[0].textContent).toContain('Test task');
        
        done();
      }, 50);
    });

    it('should delete a task and update display within 100ms', (done) => {
      const taskInput = document.getElementById('task-input');
      const addTaskBtn = document.getElementById('add-task-btn');
      const taskList = document.getElementById('task-list');
      
      // Add a task first
      taskInput.value = 'Task to delete';
      addTaskBtn.click();
      
      setTimeout(() => {
        const startTime = Date.now();
        
        // Find and click delete button
        const deleteBtn = taskList.querySelector('.delete-btn');
        deleteBtn.click();
        
        setTimeout(() => {
          const updateTime = Date.now() - startTime;
          expect(updateTime).toBeLessThan(100);
          
          const taskItems = taskList.querySelectorAll('.task-item');
          expect(taskItems.length).toBe(0);
          
          done();
        }, 50);
      }, 50);
    });

    it('should toggle task completion and update display within 100ms', (done) => {
      const taskInput = document.getElementById('task-input');
      const addTaskBtn = document.getElementById('add-task-btn');
      const taskList = document.getElementById('task-list');
      
      // Add a task first
      taskInput.value = 'Task to complete';
      addTaskBtn.click();
      
      setTimeout(() => {
        const startTime = Date.now();
        
        // Find and click checkbox
        const checkbox = taskList.querySelector('input[type="checkbox"]');
        checkbox.click();
        
        setTimeout(() => {
          const updateTime = Date.now() - startTime;
          expect(updateTime).toBeLessThan(100);
          
          const taskItem = taskList.querySelector('.task-item');
          expect(taskItem.classList.contains('completed')).toBe(true);
          
          done();
        }, 50);
      }, 50);
    });

    it('should edit a task and update display within 100ms', (done) => {
      const taskInput = document.getElementById('task-input');
      const addTaskBtn = document.getElementById('add-task-btn');
      const taskList = document.getElementById('task-list');
      
      // Add a task first
      taskInput.value = 'Original task';
      addTaskBtn.click();
      
      setTimeout(() => {
        // Mock the prompt to return a new value
        const originalPrompt = window.prompt;
        window.prompt = () => 'Updated task';
        
        const startTime = Date.now();
        
        // Find and click edit button
        const editBtn = taskList.querySelector('.edit-btn');
        editBtn.click();
        
        setTimeout(() => {
          const updateTime = Date.now() - startTime;
          expect(updateTime).toBeLessThan(100);
          
          const taskItem = taskList.querySelector('.task-item');
          expect(taskItem.textContent).toContain('Updated task');
          
          // Restore original prompt
          window.prompt = originalPrompt;
          
          done();
        }, 50);
      }, 50);
    });

    it('should persist tasks to localStorage', (done) => {
      const taskInput = document.getElementById('task-input');
      const addTaskBtn = document.getElementById('add-task-btn');
      
      taskInput.value = 'Persistent task';
      addTaskBtn.click();
      
      setTimeout(() => {
        const storedTasks = JSON.parse(localStorage.getItem('dashboard_tasks'));
        expect(storedTasks).toBeTruthy();
        expect(storedTasks.length).toBe(1);
        expect(storedTasks[0].text).toBe('Persistent task');
        
        done();
      }, 50);
    });

    it('should load tasks from localStorage on initialization', (done) => {
      // Pre-populate localStorage
      const tasks = [
        { id: '1', text: 'Loaded task', completed: false, createdAt: Date.now() }
      ];
      localStorage.setItem('dashboard_tasks', JSON.stringify(tasks));
      
      // Re-initialize dashboard
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      setTimeout(() => {
        const taskList = document.getElementById('task-list');
        const taskItems = taskList.querySelectorAll('.task-item');
        
        expect(taskItems.length).toBe(1);
        expect(taskItems[0].textContent).toContain('Loaded task');
        
        done();
      }, 100);
    });
  });

  describe('Quick Links Operations', () => {
    beforeEach((done) => {
      // Initialize dashboard
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      setTimeout(done, 50);
    });

    it('should add a link and update display within 100ms', (done) => {
      const labelInput = document.getElementById('link-label-input');
      const urlInput = document.getElementById('link-url-input');
      const addLinkBtn = document.getElementById('add-link-btn');
      const linksGrid = document.getElementById('links-grid');
      
      const startTime = Date.now();
      
      labelInput.value = 'Test Link';
      urlInput.value = 'https://example.com';
      addLinkBtn.click();
      
      setTimeout(() => {
        const updateTime = Date.now() - startTime;
        expect(updateTime).toBeLessThan(100);
        
        const linkItems = linksGrid.querySelectorAll('.link-item');
        expect(linkItems.length).toBe(1);
        
        const anchor = linkItems[0].querySelector('a');
        expect(anchor.textContent).toBe('Test Link');
        expect(anchor.href).toBe('https://example.com/');
        expect(anchor.target).toBe('_blank');
        
        done();
      }, 50);
    });

    it('should delete a link and update display within 100ms', (done) => {
      const labelInput = document.getElementById('link-label-input');
      const urlInput = document.getElementById('link-url-input');
      const addLinkBtn = document.getElementById('add-link-btn');
      const linksGrid = document.getElementById('links-grid');
      
      // Add a link first
      labelInput.value = 'Link to delete';
      urlInput.value = 'https://delete.com';
      addLinkBtn.click();
      
      setTimeout(() => {
        const startTime = Date.now();
        
        // Find and click delete button
        const deleteBtn = linksGrid.querySelector('.delete-btn');
        deleteBtn.click();
        
        setTimeout(() => {
          const updateTime = Date.now() - startTime;
          expect(updateTime).toBeLessThan(100);
          
          const linkItems = linksGrid.querySelectorAll('.link-item');
          expect(linkItems.length).toBe(0);
          
          done();
        }, 50);
      }, 50);
    });

    it('should persist links to localStorage', (done) => {
      const labelInput = document.getElementById('link-label-input');
      const urlInput = document.getElementById('link-url-input');
      const addLinkBtn = document.getElementById('add-link-btn');
      
      labelInput.value = 'GitHub';
      urlInput.value = 'https://github.com';
      addLinkBtn.click();
      
      setTimeout(() => {
        const storedLinks = JSON.parse(localStorage.getItem('dashboard_links'));
        expect(storedLinks).toBeTruthy();
        expect(storedLinks.length).toBe(1);
        expect(storedLinks[0].label).toBe('GitHub');
        expect(storedLinks[0].url).toBe('https://github.com');
        
        done();
      }, 50);
    });

    it('should load links from localStorage on initialization', (done) => {
      // Pre-populate localStorage
      const links = [
        { id: '1', label: 'Loaded Link', url: 'https://loaded.com' }
      ];
      localStorage.setItem('dashboard_links', JSON.stringify(links));
      
      // Re-initialize dashboard
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      setTimeout(() => {
        const linksGrid = document.getElementById('links-grid');
        const linkItems = linksGrid.querySelectorAll('.link-item');
        
        expect(linkItems.length).toBe(1);
        
        const anchor = linkItems[0].querySelector('a');
        expect(anchor.textContent).toBe('Loaded Link');
        
        done();
      }, 100);
    });
  });

  describe('Timer Operations', () => {
    beforeEach((done) => {
      // Initialize dashboard
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      setTimeout(done, 50);
    });

    it('should update timer display every second', (done) => {
      const timerDisplay = document.getElementById('timer-display');
      const startBtn = document.getElementById('timer-start-btn');
      
      expect(timerDisplay.textContent).toBe('25:00');
      
      startBtn.click();
      
      // Wait for 2 seconds and check if timer updated
      setTimeout(() => {
        expect(timerDisplay.textContent).toBe('24:58');
        done();
      }, 2100);
    });

    it('should update timer display every second without lag', (done) => {
      const timerDisplay = document.getElementById('timer-display');
      const startBtn = document.getElementById('timer-start-btn');
      
      startBtn.click();
      
      const updates = [];
      const startTime = Date.now();
      
      // Record timer updates over 3 seconds
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        updates.push({
          time: elapsed,
          display: timerDisplay.textContent
        });
        
        if (elapsed >= 3000) {
          clearInterval(checkInterval);
          
          // Verify we got at least 3 updates (one per second)
          expect(updates.length).toBeGreaterThanOrEqual(3);
          
          // Verify each update happened roughly on time (within 100ms tolerance)
          for (let i = 1; i < updates.length; i++) {
            const timeDiff = updates[i].time - updates[i-1].time;
            // Allow some tolerance for timing variations
            expect(timeDiff).toBeGreaterThanOrEqual(900);
            expect(timeDiff).toBeLessThanOrEqual(1100);
          }
          
          // Verify display changed
          const uniqueDisplays = new Set(updates.map(u => u.display));
          expect(uniqueDisplays.size).toBeGreaterThan(1);
          
          done();
        }
      }, 1000);
    });

    it('should disable start button when timer is running', (done) => {
      const startBtn = document.getElementById('timer-start-btn');
      const stopBtn = document.getElementById('timer-stop-btn');
      
      expect(startBtn.disabled).toBe(false);
      expect(stopBtn.disabled).toBe(true);
      
      startBtn.click();
      
      setTimeout(() => {
        expect(startBtn.disabled).toBe(true);
        expect(stopBtn.disabled).toBe(false);
        
        done();
      }, 50);
    });

    it('should stop timer and preserve remaining time', (done) => {
      const timerDisplay = document.getElementById('timer-display');
      const startBtn = document.getElementById('timer-start-btn');
      const stopBtn = document.getElementById('timer-stop-btn');
      
      startBtn.click();
      
      // Wait for 1 second
      setTimeout(() => {
        const timeBeforeStop = timerDisplay.textContent;
        stopBtn.click();
        
        // Wait another second to verify timer stopped
        setTimeout(() => {
          expect(timerDisplay.textContent).toBe(timeBeforeStop);
          expect(startBtn.disabled).toBe(false);
          expect(stopBtn.disabled).toBe(true);
          
          done();
        }, 1100);
      }, 1100);
    });

    it('should reset timer to 25:00', (done) => {
      const timerDisplay = document.getElementById('timer-display');
      const startBtn = document.getElementById('timer-start-btn');
      const resetBtn = document.getElementById('timer-reset-btn');
      
      startBtn.click();
      
      // Wait for 1 second
      setTimeout(() => {
        expect(timerDisplay.textContent).not.toBe('25:00');
        
        resetBtn.click();
        
        setTimeout(() => {
          expect(timerDisplay.textContent).toBe('25:00');
          expect(startBtn.disabled).toBe(false);
          
          done();
        }, 50);
      }, 1100);
    });
  });

  describe('Performance Under Load', () => {
    beforeEach((done) => {
      // Initialize dashboard
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      setTimeout(done, 50);
    });

    it('should handle multiple rapid task additions within performance limits', (done) => {
      const taskInput = document.getElementById('task-input');
      const addTaskBtn = document.getElementById('add-task-btn');
      const taskList = document.getElementById('task-list');
      
      const startTime = Date.now();
      const taskCount = 10;
      
      // Add multiple tasks rapidly
      for (let i = 0; i < taskCount; i++) {
        taskInput.value = `Task ${i + 1}`;
        addTaskBtn.click();
      }
      
      setTimeout(() => {
        const totalTime = Date.now() - startTime;
        
        // Verify all tasks were added
        const taskItems = taskList.querySelectorAll('.task-item');
        expect(taskItems.length).toBe(taskCount);
        
        // Verify total time is reasonable (should be well under 1 second for 10 tasks)
        expect(totalTime).toBeLessThan(1000);
        
        // Verify average time per task is under 100ms
        const avgTime = totalTime / taskCount;
        expect(avgTime).toBeLessThan(100);
        
        done();
      }, 200);
    });

    it('should handle multiple rapid link additions within performance limits', (done) => {
      const labelInput = document.getElementById('link-label-input');
      const urlInput = document.getElementById('link-url-input');
      const addLinkBtn = document.getElementById('add-link-btn');
      const linksGrid = document.getElementById('links-grid');
      
      const startTime = Date.now();
      const linkCount = 10;
      
      // Add multiple links rapidly
      for (let i = 0; i < linkCount; i++) {
        labelInput.value = `Link ${i + 1}`;
        urlInput.value = `https://example${i + 1}.com`;
        addLinkBtn.click();
      }
      
      setTimeout(() => {
        const totalTime = Date.now() - startTime;
        
        // Verify all links were added
        const linkItems = linksGrid.querySelectorAll('.link-item');
        expect(linkItems.length).toBe(linkCount);
        
        // Verify total time is reasonable
        expect(totalTime).toBeLessThan(1000);
        
        // Verify average time per link is under 100ms
        const avgTime = totalTime / linkCount;
        expect(avgTime).toBeLessThan(100);
        
        done();
      }, 200);
    });
  });

  describe('Data Persistence Across Page Reloads', () => {
    it('should maintain tasks after simulated reload', (done) => {
      // Initialize dashboard
      let event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      setTimeout(() => {
        // Add a task
        const taskInput = document.getElementById('task-input');
        const addTaskBtn = document.getElementById('add-task-btn');
        
        taskInput.value = 'Persistent task';
        addTaskBtn.click();
        
        setTimeout(() => {
          // Verify task is in localStorage
          const storedTasks = JSON.parse(localStorage.getItem('dashboard_tasks'));
          expect(storedTasks.length).toBe(1);
          
          // Simulate page reload by re-initializing
          event = new window.Event('DOMContentLoaded');
          document.dispatchEvent(event);
          
          setTimeout(() => {
            // Verify task is still displayed
            const taskList = document.getElementById('task-list');
            const taskItems = taskList.querySelectorAll('.task-item');
            
            expect(taskItems.length).toBe(1);
            expect(taskItems[0].textContent).toContain('Persistent task');
            
            done();
          }, 100);
        }, 50);
      }, 50);
    });

    it('should maintain links after simulated reload', (done) => {
      // Initialize dashboard
      let event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      setTimeout(() => {
        // Add a link
        const labelInput = document.getElementById('link-label-input');
        const urlInput = document.getElementById('link-url-input');
        const addLinkBtn = document.getElementById('add-link-btn');
        
        labelInput.value = 'GitHub';
        urlInput.value = 'https://github.com';
        addLinkBtn.click();
        
        setTimeout(() => {
          // Verify link is in localStorage
          const storedLinks = JSON.parse(localStorage.getItem('dashboard_links'));
          expect(storedLinks.length).toBe(1);
          
          // Simulate page reload by re-initializing
          event = new window.Event('DOMContentLoaded');
          document.dispatchEvent(event);
          
          setTimeout(() => {
            // Verify link is still displayed
            const linksGrid = document.getElementById('links-grid');
            const linkItems = linksGrid.querySelectorAll('.link-item');
            
            expect(linkItems.length).toBe(1);
            
            const anchor = linkItems[0].querySelector('a');
            expect(anchor.textContent).toBe('GitHub');
            
            done();
          }, 100);
        }, 50);
      }, 50);
    });
  });
});

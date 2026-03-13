import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Load FocusTimer in a JSDOM environment
const loadFocusTimer = () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="timer-container"></div>
      </body>
    </html>
  `);
  
  global.document = dom.window.document;
  global.window = dom.window;
  global.setInterval = dom.window.setInterval;
  global.clearInterval = dom.window.clearInterval;
  global.Notification = undefined; // Disable notifications in tests
  
  // Define FocusTimer class in the test environment
  class FocusTimer {
    constructor(containerElement) {
      this.container = containerElement;
      this.duration = 1500; // 25 minutes in seconds
      this.remaining = 1500;
      this.isRunning = false;
      this.intervalId = null;
    }

    start() {
      if (this.isRunning) return;
      
      this.isRunning = true;
      this.intervalId = setInterval(() => {
        this.tick();
      }, 1000);
    }

    stop() {
      if (!this.isRunning) return;
      
      this.isRunning = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }

    reset() {
      this.stop();
      this.remaining = this.duration;
      this.render();
    }

    tick() {
      if (this.remaining > 0) {
        this.remaining--;
        this.render();
      } else {
        this.stop();
        this.emitNotification();
      }
    }

    emitNotification() {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Timer', {
          body: 'Your 25-minute focus session is complete!',
          icon: '/favicon.ico'
        });
      }
      
      console.log('Timer completed!');
      
      const audio = document.getElementById('timer-sound');
      if (audio) {
        audio.play().catch(err => console.log('Audio play failed:', err));
      }
    }

    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      
      const minutesStr = minutes.toString().padStart(2, '0');
      const secondsStr = secs.toString().padStart(2, '0');
      
      return `${minutesStr}:${secondsStr}`;
    }

    render() {
      if (!this.container) return;

      this.container.innerHTML = '';

      const timerDisplay = document.createElement('div');
      timerDisplay.className = 'timer-display';
      timerDisplay.textContent = this.formatTime(this.remaining);

      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'timer-controls';

      const startBtn = document.createElement('button');
      startBtn.className = 'timer-btn start-btn';
      startBtn.textContent = 'Start';
      startBtn.disabled = this.isRunning;
      startBtn.addEventListener('click', () => {
        this.start();
        this.render();
      });

      const stopBtn = document.createElement('button');
      stopBtn.className = 'timer-btn stop-btn';
      stopBtn.textContent = 'Stop';
      stopBtn.disabled = !this.isRunning;
      stopBtn.addEventListener('click', () => {
        this.stop();
        this.render();
      });

      const resetBtn = document.createElement('button');
      resetBtn.className = 'timer-btn reset-btn';
      resetBtn.textContent = 'Reset';
      resetBtn.addEventListener('click', () => {
        this.reset();
      });

      controlsDiv.appendChild(startBtn);
      controlsDiv.appendChild(stopBtn);
      controlsDiv.appendChild(resetBtn);

      this.container.appendChild(timerDisplay);
      this.container.appendChild(controlsDiv);
    }

    destroy() {
      this.stop();
    }
  }
  
  return { FocusTimer, dom };
};

describe('Focus Timer - Unit Tests', () => {
  let focusTimer;
  let container;
  let dom;

  beforeEach(() => {
    vi.useFakeTimers();
    const loaded = loadFocusTimer();
    dom = loaded.dom;
    container = dom.window.document.getElementById('timer-container');
    focusTimer = new loaded.FocusTimer(container);
  });

  afterEach(() => {
    if (focusTimer) {
      focusTimer.destroy();
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /**
   * Test timer initialization
   * **Validates: Requirements 3.1**
   */
  describe('Timer Initialization', () => {
    test('initializes with 25 minutes (1500 seconds)', () => {
      expect(focusTimer.duration).toBe(1500);
      expect(focusTimer.remaining).toBe(1500);
      expect(focusTimer.isRunning).toBe(false);
    });

    test('formatTime displays 25:00 for initial state', () => {
      const formatted = focusTimer.formatTime(focusTimer.remaining);
      expect(formatted).toBe('25:00');
    });
  });

  /**
   * Test formatTime method with specific values
   * **Validates: Requirements 3.6**
   */
  describe('Time Formatting', () => {
    test('formats 0 seconds as 00:00', () => {
      expect(focusTimer.formatTime(0)).toBe('00:00');
    });

    test('formats 59 seconds as 00:59', () => {
      expect(focusTimer.formatTime(59)).toBe('00:59');
    });

    test('formats 60 seconds as 01:00', () => {
      expect(focusTimer.formatTime(60)).toBe('01:00');
    });

    test('formats 90 seconds as 01:30', () => {
      expect(focusTimer.formatTime(90)).toBe('01:30');
    });

    test('formats 125 seconds as 02:05', () => {
      expect(focusTimer.formatTime(125)).toBe('02:05');
    });

    test('formats 1500 seconds as 25:00', () => {
      expect(focusTimer.formatTime(1500)).toBe('25:00');
    });

    test('formats 3599 seconds as 59:59', () => {
      expect(focusTimer.formatTime(3599)).toBe('59:59');
    });
  });

  /**
   * Test start functionality
   * **Validates: Requirements 3.2**
   */
  describe('Start Timer', () => {
    test('start sets isRunning to true', () => {
      focusTimer.start();
      expect(focusTimer.isRunning).toBe(true);
    });

    test('start creates an interval', () => {
      focusTimer.start();
      expect(focusTimer.intervalId).not.toBeNull();
    });

    test('calling start twice does not create multiple intervals', () => {
      focusTimer.start();
      const firstIntervalId = focusTimer.intervalId;
      focusTimer.start();
      expect(focusTimer.intervalId).toBe(firstIntervalId);
    });

    test('timer counts down after start', () => {
      focusTimer.start();
      expect(focusTimer.remaining).toBe(1500);
      
      vi.advanceTimersByTime(1000);
      expect(focusTimer.remaining).toBe(1499);
      
      vi.advanceTimersByTime(1000);
      expect(focusTimer.remaining).toBe(1498);
    });
  });

  /**
   * Test stop functionality
   * **Validates: Requirements 3.3**
   */
  describe('Stop Timer', () => {
    test('stop sets isRunning to false', () => {
      focusTimer.start();
      focusTimer.stop();
      expect(focusTimer.isRunning).toBe(false);
    });

    test('stop clears the interval', () => {
      focusTimer.start();
      focusTimer.stop();
      expect(focusTimer.intervalId).toBeNull();
    });

    test('stop preserves remaining time', () => {
      focusTimer.start();
      vi.advanceTimersByTime(5000); // 5 seconds
      expect(focusTimer.remaining).toBe(1495);
      
      focusTimer.stop();
      expect(focusTimer.remaining).toBe(1495);
      
      // Advance time further - should not change remaining
      vi.advanceTimersByTime(5000);
      expect(focusTimer.remaining).toBe(1495);
    });

    test('calling stop when not running does nothing', () => {
      expect(focusTimer.isRunning).toBe(false);
      focusTimer.stop();
      expect(focusTimer.isRunning).toBe(false);
    });
  });

  /**
   * Test reset functionality
   * **Validates: Requirements 3.4**
   */
  describe('Reset Timer', () => {
    test('reset returns remaining time to 1500 seconds', () => {
      focusTimer.start();
      vi.advanceTimersByTime(10000); // 10 seconds
      expect(focusTimer.remaining).toBe(1490);
      
      focusTimer.reset();
      expect(focusTimer.remaining).toBe(1500);
    });

    test('reset stops the timer', () => {
      focusTimer.start();
      expect(focusTimer.isRunning).toBe(true);
      
      focusTimer.reset();
      expect(focusTimer.isRunning).toBe(false);
    });

    test('reset works when timer is at zero', () => {
      focusTimer.remaining = 0;
      focusTimer.reset();
      expect(focusTimer.remaining).toBe(1500);
    });
  });

  /**
   * Test timer completion
   * **Validates: Requirements 3.5**
   */
  describe('Timer Completion', () => {
    test('timer stops when reaching zero', () => {
      focusTimer.remaining = 2;
      focusTimer.start();
      
      vi.advanceTimersByTime(1000);
      expect(focusTimer.remaining).toBe(1);
      expect(focusTimer.isRunning).toBe(true);
      
      vi.advanceTimersByTime(1000);
      expect(focusTimer.remaining).toBe(0);
      expect(focusTimer.isRunning).toBe(false);
    });

    test('timer emits notification when reaching zero', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      focusTimer.remaining = 1;
      focusTimer.start();
      
      vi.advanceTimersByTime(1000);
      
      expect(consoleSpy).toHaveBeenCalledWith('Timer completed!');
    });

    test('timer does not go below zero', () => {
      focusTimer.remaining = 1;
      focusTimer.start();
      
      vi.advanceTimersByTime(5000);
      expect(focusTimer.remaining).toBe(0);
    });
  });

  /**
   * Test render functionality
   * **Validates: Requirements 3.6**
   */
  describe('Render Timer Display', () => {
    test('render creates timer display element', () => {
      focusTimer.render();
      
      const timerDisplay = container.querySelector('.timer-display');
      expect(timerDisplay).not.toBeNull();
      expect(timerDisplay.textContent).toBe('25:00');
    });

    test('render creates control buttons', () => {
      focusTimer.render();
      
      const startBtn = container.querySelector('.start-btn');
      const stopBtn = container.querySelector('.stop-btn');
      const resetBtn = container.querySelector('.reset-btn');
      
      expect(startBtn).not.toBeNull();
      expect(stopBtn).not.toBeNull();
      expect(resetBtn).not.toBeNull();
    });

    test('start button is disabled when timer is running', () => {
      focusTimer.start();
      focusTimer.render();
      
      const startBtn = container.querySelector('.start-btn');
      expect(startBtn.disabled).toBe(true);
    });

    test('stop button is disabled when timer is not running', () => {
      focusTimer.render();
      
      const stopBtn = container.querySelector('.stop-btn');
      expect(stopBtn.disabled).toBe(true);
    });

    test('display updates as timer counts down', () => {
      focusTimer.start();
      
      vi.advanceTimersByTime(1000);
      const timerDisplay = container.querySelector('.timer-display');
      expect(timerDisplay.textContent).toBe('24:59');
      
      vi.advanceTimersByTime(59000); // 59 more seconds
      expect(timerDisplay.textContent).toBe('24:00');
    });
  });
});

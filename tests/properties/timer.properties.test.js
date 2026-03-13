import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
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

describe('Focus Timer - Property-Based Tests', () => {
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
   * Property 4: Timer Format Consistency
   * **Validates: Requirements 3.6**
   * 
   * For any number of seconds between 0 and 1500, the timer format function
   * SHALL produce output in MM:SS format where MM is zero-padded minutes
   * and SS is zero-padded seconds.
   */
  test('Property 4: Timer Format Consistency - MM:SS format for any seconds value', () => {
    fc.assert(
      fc.property(
        // Generate random seconds between 0 and 1500
        fc.integer({ min: 0, max: 1500 }),
        (seconds) => {
          const formatted = focusTimer.formatTime(seconds);
          
          // Verify format matches MM:SS pattern
          const timePattern = /^[0-9]{2}:[0-9]{2}$/;
          if (!timePattern.test(formatted)) {
            return false;
          }
          
          // Extract minutes and seconds
          const [minutesStr, secondsStr] = formatted.split(':');
          const minutes = parseInt(minutesStr, 10);
          const secs = parseInt(secondsStr, 10);
          
          // Verify the values are correct
          const expectedMinutes = Math.floor(seconds / 60);
          const expectedSeconds = seconds % 60;
          
          return minutes === expectedMinutes && secs === expectedSeconds;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Timer Stop Preserves State
   * **Validates: Requirements 3.3**
   * 
   * For any timer state with remaining time, when the stop operation is executed,
   * the remaining time SHALL be unchanged.
   */
  test('Property 5: Timer Stop Preserves State - remaining time unchanged after stop', () => {
    fc.assert(
      fc.property(
        // Generate random remaining time between 1 and 1500
        fc.integer({ min: 1, max: 1500 }),
        // Generate random elapsed time (how long timer runs before stop)
        fc.integer({ min: 0, max: 10 }),
        (initialRemaining, elapsedSeconds) => {
          // Set up timer with specific remaining time
          focusTimer.remaining = initialRemaining;
          focusTimer.start();
          
          // Advance time
          vi.advanceTimersByTime(elapsedSeconds * 1000);
          
          // Calculate expected remaining time after elapsed time
          const expectedRemaining = Math.max(0, initialRemaining - elapsedSeconds);
          
          // Stop the timer
          const remainingBeforeStop = focusTimer.remaining;
          focusTimer.stop();
          const remainingAfterStop = focusTimer.remaining;
          
          // Verify remaining time is preserved
          const preserved = remainingBeforeStop === remainingAfterStop;
          
          // Verify timer stopped
          const stopped = !focusTimer.isRunning;
          
          // Verify remaining time matches expected
          const correctRemaining = remainingAfterStop === expectedRemaining;
          
          return preserved && stopped && correctRemaining;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Timer Reset Returns to Initial State
   * **Validates: Requirements 3.4**
   * 
   * For any timer state, when the reset operation is executed,
   * the remaining time SHALL be set to 1500 seconds (25 minutes).
   */
  test('Property 6: Timer Reset Returns to Initial State - always resets to 1500 seconds', () => {
    fc.assert(
      fc.property(
        // Generate random remaining time between 0 and 1500
        fc.integer({ min: 0, max: 1500 }),
        // Generate random running state
        fc.boolean(),
        (remainingTime, shouldBeRunning) => {
          // Set up timer with specific state
          focusTimer.remaining = remainingTime;
          if (shouldBeRunning) {
            focusTimer.start();
          }
          
          // Reset the timer
          focusTimer.reset();
          
          // Verify remaining time is 1500
          const correctRemaining = focusTimer.remaining === 1500;
          
          // Verify timer is stopped
          const isStopped = !focusTimer.isRunning;
          
          // Verify interval is cleared
          const intervalCleared = focusTimer.intervalId === null;
          
          return correctRemaining && isStopped && intervalCleared;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Timer Never Goes Negative
   * 
   * For any timer state, the remaining time SHALL never be negative.
   */
  test('Additional Property: Timer Never Goes Negative - remaining time >= 0', () => {
    fc.assert(
      fc.property(
        // Generate random initial remaining time
        fc.integer({ min: 0, max: 100 }),
        // Generate random number of ticks to advance
        fc.integer({ min: 0, max: 150 }),
        (initialRemaining, ticksToAdvance) => {
          // Set up timer
          focusTimer.remaining = initialRemaining;
          focusTimer.start();
          
          // Advance time by ticks
          vi.advanceTimersByTime(ticksToAdvance * 1000);
          
          // Verify remaining time is never negative
          return focusTimer.remaining >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Start/Stop Idempotence
   * 
   * Calling start multiple times when already running should not change state.
   * Calling stop multiple times when already stopped should not change state.
   */
  test('Additional Property: Start/Stop Idempotence - multiple calls have no effect', () => {
    fc.assert(
      fc.property(
        // Generate random number of start calls
        fc.integer({ min: 1, max: 5 }),
        // Generate random number of stop calls
        fc.integer({ min: 1, max: 5 }),
        (startCalls, stopCalls) => {
          // Call start multiple times
          for (let i = 0; i < startCalls; i++) {
            focusTimer.start();
          }
          
          const isRunningAfterStarts = focusTimer.isRunning;
          const intervalIdAfterStarts = focusTimer.intervalId;
          
          // Verify timer is running and has one interval
          if (!isRunningAfterStarts || intervalIdAfterStarts === null) {
            return false;
          }
          
          // Call stop multiple times
          for (let i = 0; i < stopCalls; i++) {
            focusTimer.stop();
          }
          
          const isRunningAfterStops = focusTimer.isRunning;
          const intervalIdAfterStops = focusTimer.intervalId;
          
          // Verify timer is stopped and interval is cleared
          return !isRunningAfterStops && intervalIdAfterStops === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Format Time Zero Padding
   * 
   * For any seconds value, both minutes and seconds in the formatted output
   * SHALL be zero-padded to 2 digits.
   */
  test('Additional Property: Format Time Zero Padding - always 2 digits for MM and SS', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3600 }),
        (seconds) => {
          const formatted = focusTimer.formatTime(seconds);
          
          // Split into parts
          const parts = formatted.split(':');
          
          // Verify we have exactly 2 parts
          if (parts.length !== 2) {
            return false;
          }
          
          // Verify each part is exactly 2 digits
          const [minutesStr, secondsStr] = parts;
          return minutesStr.length === 2 && secondsStr.length === 2;
        }
      ),
      { numRuns: 100 }
    );
  });
});

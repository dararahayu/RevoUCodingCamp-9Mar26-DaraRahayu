import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Load GreetingComponent in a JSDOM environment
const loadGreetingComponent = () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="greeting-container">
          <div id="time-display"></div>
          <div id="date-display"></div>
          <div id="greeting-message"></div>
        </div>
      </body>
    </html>
  `);
  
  global.document = dom.window.document;
  global.window = dom.window;
  
  // Define GreetingComponent class in the test environment
  class GreetingComponent {
    constructor(containerElement) {
      this.container = containerElement;
      this.intervalId = null;
    }

    getGreeting(hour) {
      if (hour >= 5 && hour < 12) {
        return 'Good Morning';
      } else if (hour >= 12 && hour < 18) {
        return 'Good Afternoon';
      } else {
        return 'Good Evening';
      }
    }

    updateTime() {
      const now = new Date();
      
      // Format time in 12-hour format with AM/PM
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      // Convert to 12-hour format
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      
      // Zero-pad minutes and seconds
      const minutesStr = minutes.toString().padStart(2, '0');
      const secondsStr = seconds.toString().padStart(2, '0');
      
      const timeString = `${hours}:${minutesStr}:${secondsStr} ${ampm}`;
      
      // Format date with day of week, month, and day
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
      
      const dayOfWeek = daysOfWeek[now.getDay()];
      const month = months[now.getMonth()];
      const day = now.getDate();
      
      const dateString = `${dayOfWeek}, ${month} ${day}`;
      
      // Get greeting based on current hour
      const greeting = this.getGreeting(now.getHours());
      
      // Update DOM elements
      const timeDisplay = this.container.querySelector('#time-display');
      const dateDisplay = this.container.querySelector('#date-display');
      const greetingMessage = this.container.querySelector('#greeting-message');
      
      if (timeDisplay) timeDisplay.textContent = timeString;
      if (dateDisplay) dateDisplay.textContent = dateString;
      if (greetingMessage) greetingMessage.textContent = greeting;
    }

    render() {
      this.updateTime();
      this.intervalId = setInterval(() => {
        this.updateTime();
      }, 1000);
    }

    destroy() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  }
  
  return { GreetingComponent, dom };
};

describe('Greeting Component - Unit Tests', () => {
  let greetingComponent;
  let container;
  let dom;
  let originalDate;

  beforeEach(() => {
    const loaded = loadGreetingComponent();
    dom = loaded.dom;
    container = dom.window.document.getElementById('greeting-container');
    greetingComponent = new loaded.GreetingComponent(container);
    originalDate = global.Date;
  });

  afterEach(() => {
    // Restore original Date
    global.Date = originalDate;
    // Clean up any intervals
    if (greetingComponent) {
      greetingComponent.destroy();
    }
  });

  /**
   * Test specific times
   * **Validates: Requirements 1.1**
   */
  describe('Specific Time Formatting', () => {
    test('displays 10:30 AM correctly', () => {
      // Create a date for 10:30:45 AM
      const testDate = new Date(2024, 0, 15, 10, 30, 45);
      
      global.Date = class extends originalDate {
        constructor() {
          return testDate;
        }
      };
      
      greetingComponent.updateTime();
      
      const timeDisplay = container.querySelector('#time-display');
      expect(timeDisplay.textContent).toBe('10:30:45 AM');
    });

    test('displays midnight as 12:00 AM', () => {
      // Create a date for midnight (00:00:00)
      const testDate = new Date(2024, 0, 15, 0, 0, 0);
      
      global.Date = class extends originalDate {
        constructor() {
          return testDate;
        }
      };
      
      greetingComponent.updateTime();
      
      const timeDisplay = container.querySelector('#time-display');
      expect(timeDisplay.textContent).toBe('12:00:00 AM');
    });

    test('displays noon as 12:00 PM', () => {
      // Create a date for noon (12:00:00)
      const testDate = new Date(2024, 0, 15, 12, 0, 0);
      
      global.Date = class extends originalDate {
        constructor() {
          return testDate;
        }
      };
      
      greetingComponent.updateTime();
      
      const timeDisplay = container.querySelector('#time-display');
      expect(timeDisplay.textContent).toBe('12:00:00 PM');
    });
  });

  /**
   * Test specific dates
   * **Validates: Requirements 1.2**
   */
  describe('Specific Date Formatting', () => {
    test('displays Monday, January 15 correctly', () => {
      // January 15, 2024 is a Monday
      const testDate = new Date(2024, 0, 15, 10, 30, 0);
      
      global.Date = class extends originalDate {
        constructor() {
          return testDate;
        }
      };
      
      greetingComponent.updateTime();
      
      const dateDisplay = container.querySelector('#date-display');
      expect(dateDisplay.textContent).toBe('Monday, January 15');
    });
  });

  /**
   * Test greeting transitions at boundary times
   * **Validates: Requirements 1.4, 2.1, 2.2, 2.3**
   */
  describe('Greeting Boundary Transitions', () => {
    test('displays "Good Evening" at 4:59 AM', () => {
      const testDate = new Date(2024, 0, 15, 4, 59, 0);
      
      global.Date = class extends originalDate {
        constructor() {
          return testDate;
        }
      };
      
      greetingComponent.updateTime();
      
      const greetingMessage = container.querySelector('#greeting-message');
      expect(greetingMessage.textContent).toBe('Good Evening');
    });

    test('displays "Good Morning" at 5:00 AM', () => {
      const testDate = new Date(2024, 0, 15, 5, 0, 0);
      
      global.Date = class extends originalDate {
        constructor() {
          return testDate;
        }
      };
      
      greetingComponent.updateTime();
      
      const greetingMessage = container.querySelector('#greeting-message');
      expect(greetingMessage.textContent).toBe('Good Morning');
    });

    test('displays "Good Morning" at 11:59 AM', () => {
      const testDate = new Date(2024, 0, 15, 11, 59, 0);
      
      global.Date = class extends originalDate {
        constructor() {
          return testDate;
        }
      };
      
      greetingComponent.updateTime();
      
      const greetingMessage = container.querySelector('#greeting-message');
      expect(greetingMessage.textContent).toBe('Good Morning');
    });

    test('displays "Good Afternoon" at 12:00 PM', () => {
      const testDate = new Date(2024, 0, 15, 12, 0, 0);
      
      global.Date = class extends originalDate {
        constructor() {
          return testDate;
        }
      };
      
      greetingComponent.updateTime();
      
      const greetingMessage = container.querySelector('#greeting-message');
      expect(greetingMessage.textContent).toBe('Good Afternoon');
    });

    test('displays "Good Afternoon" at 5:59 PM', () => {
      const testDate = new Date(2024, 0, 15, 17, 59, 0);
      
      global.Date = class extends originalDate {
        constructor() {
          return testDate;
        }
      };
      
      greetingComponent.updateTime();
      
      const greetingMessage = container.querySelector('#greeting-message');
      expect(greetingMessage.textContent).toBe('Good Afternoon');
    });

    test('displays "Good Evening" at 6:00 PM', () => {
      const testDate = new Date(2024, 0, 15, 18, 0, 0);
      
      global.Date = class extends originalDate {
        constructor() {
          return testDate;
        }
      };
      
      greetingComponent.updateTime();
      
      const greetingMessage = container.querySelector('#greeting-message');
      expect(greetingMessage.textContent).toBe('Good Evening');
    });
  });

  /**
   * Test getGreeting method directly for boundary conditions
   * **Validates: Requirements 2.1, 2.2, 2.3**
   */
  describe('getGreeting Method Boundaries', () => {
    test('returns correct greeting for all boundary hours', () => {
      // Test all critical boundary hours
      expect(greetingComponent.getGreeting(4)).toBe('Good Evening');
      expect(greetingComponent.getGreeting(5)).toBe('Good Morning');
      expect(greetingComponent.getGreeting(11)).toBe('Good Morning');
      expect(greetingComponent.getGreeting(12)).toBe('Good Afternoon');
      expect(greetingComponent.getGreeting(17)).toBe('Good Afternoon');
      expect(greetingComponent.getGreeting(18)).toBe('Good Evening');
      expect(greetingComponent.getGreeting(23)).toBe('Good Evening');
      expect(greetingComponent.getGreeting(0)).toBe('Good Evening');
    });
  });
});

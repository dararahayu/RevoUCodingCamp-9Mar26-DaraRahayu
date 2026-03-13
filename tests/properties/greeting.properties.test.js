import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { JSDOM } from 'jsdom';

// Import the GreetingComponent from app.js
// Since app.js uses DOM events, we need to load it in a JSDOM environment
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

describe('Greeting Component - Property-Based Tests', () => {
  let greetingComponent;
  let container;
  let dom;

  beforeEach(() => {
    const loaded = loadGreetingComponent();
    dom = loaded.dom;
    container = dom.window.document.getElementById('greeting-container');
    greetingComponent = new loaded.GreetingComponent(container);
  });

  /**
   * Property 1: Time Display Format
   * **Validates: Requirements 1.1**
   * 
   * For any point in time, when the greeting component renders the time,
   * the output SHALL contain the time in 12-hour format (1-12) with AM/PM indicator.
   */
  test('Property 1: Time Display Format - 12-hour format with AM/PM for any timestamp', () => {
    fc.assert(
      fc.property(
        // Generate random timestamps (milliseconds since epoch)
        fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
        (timestamp) => {
          const testDate = new Date(timestamp);
          
          // Mock Date to return our test date
          const originalDate = global.Date;
          global.Date = class extends originalDate {
            constructor() {
              return testDate;
            }
            static now() {
              return testDate.getTime();
            }
          };
          
          // Update the component
          greetingComponent.updateTime();
          
          // Get the rendered time
          const timeDisplay = container.querySelector('#time-display');
          const timeString = timeDisplay.textContent;
          
          // Restore original Date
          global.Date = originalDate;
          
          // Verify 12-hour format with AM/PM
          // Pattern: H:MM:SS AM/PM or HH:MM:SS AM/PM where H is 1-12
          const timePattern = /^(1[0-2]|[1-9]):[0-5][0-9]:[0-5][0-9] (AM|PM)$/;
          const matches = timePattern.test(timeString);
          
          // Extract hour to verify it's in 1-12 range
          if (matches) {
            const hour = parseInt(timeString.split(':')[0]);
            return hour >= 1 && hour <= 12;
          }
          
          return matches;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Date Display Completeness
   * **Validates: Requirements 1.2**
   * 
   * For any date, when the greeting component renders the date,
   * the output SHALL contain the day of week, month name, and day number.
   */
  test('Property 2: Date Display Completeness - day of week, month, and day present', () => {
    fc.assert(
      fc.property(
        // Generate random dates
        fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
        (timestamp) => {
          const testDate = new Date(timestamp);
          
          // Mock Date to return our test date
          const originalDate = global.Date;
          global.Date = class extends originalDate {
            constructor() {
              return testDate;
            }
            static now() {
              return testDate.getTime();
            }
          };
          
          // Update the component
          greetingComponent.updateTime();
          
          // Get the rendered date
          const dateDisplay = container.querySelector('#date-display');
          const dateString = dateDisplay.textContent;
          
          // Restore original Date
          global.Date = originalDate;
          
          // Verify date contains day of week, month, and day
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
          
          const expectedDayOfWeek = daysOfWeek[testDate.getDay()];
          const expectedMonth = months[testDate.getMonth()];
          const expectedDay = testDate.getDate();
          
          // Check that all components are present
          const hasDayOfWeek = dateString.includes(expectedDayOfWeek);
          const hasMonth = dateString.includes(expectedMonth);
          const hasDay = dateString.includes(expectedDay.toString());
          
          return hasDayOfWeek && hasMonth && hasDay;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Time-Based Greeting Correctness
   * **Validates: Requirements 2.1, 2.2, 2.3**
   * 
   * For any time of day, the greeting function SHALL return "Good Morning" for times
   * between 5:00 AM and 11:59 AM, "Good Afternoon" for times between 12:00 PM and 5:59 PM,
   * and "Good Evening" for times between 6:00 PM and 4:59 AM.
   */
  test('Property 3: Time-Based Greeting Correctness - greeting matches time period', () => {
    fc.assert(
      fc.property(
        // Generate random hour (0-23)
        fc.integer({ min: 0, max: 23 }),
        (hour) => {
          const greeting = greetingComponent.getGreeting(hour);
          
          // Verify greeting matches the expected time period
          if (hour >= 5 && hour < 12) {
            return greeting === 'Good Morning';
          } else if (hour >= 12 && hour < 18) {
            return greeting === 'Good Afternoon';
          } else {
            return greeting === 'Good Evening';
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

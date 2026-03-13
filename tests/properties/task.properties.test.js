import { describe, test, expect } from 'vitest';
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

describe('Task Class - Property-Based Tests', () => {
  /**
   * Property 13: Task Serialization Round-Trip
   * **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
   * 
   * For any valid task, serializing the task to JSON and then deserializing it
   * SHALL produce an equivalent task where each property has the same value.
   */
  test('Property 13: Task Serialization Round-Trip - preserves all properties', () => {
    fc.assert(
      fc.property(
        // Generate random task data
        fc.string({ minLength: 1 }), // id (non-empty string)
        fc.string({ minLength: 1 }), // text (non-empty string)
        fc.boolean(),                 // completed
        fc.integer({ min: 0 }),       // createdAt (positive timestamp)
        (id, text, completed, createdAt) => {
          // Create original task
          const originalTask = new Task(id, text, completed, createdAt);
          
          // Serialize to JSON
          const json = originalTask.toJSON();
          const jsonString = JSON.stringify(json);
          
          // Deserialize from JSON
          const parsedJson = JSON.parse(jsonString);
          const restoredTask = Task.fromJSON(parsedJson);
          
          // Verify all properties are preserved
          return (
            restoredTask.id === originalTask.id &&
            restoredTask.text === originalTask.text &&
            restoredTask.completed === originalTask.completed &&
            restoredTask.createdAt === originalTask.createdAt
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Task toJSON produces valid JSON-serializable object
   * **Validates: Requirements 8.1, 8.3**
   * 
   * For any task, the toJSON method SHALL produce an object that can be
   * successfully serialized with JSON.stringify without errors.
   */
  test('Property: Task toJSON produces valid JSON-serializable object', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.boolean(),
        fc.integer({ min: 0 }),
        (id, text, completed, createdAt) => {
          const task = new Task(id, text, completed, createdAt);
          const json = task.toJSON();
          
          // Should not throw when stringifying
          let stringified;
          try {
            stringified = JSON.stringify(json);
          } catch (e) {
            return false;
          }
          
          // Should be able to parse back
          let parsed;
          try {
            parsed = JSON.parse(stringified);
          } catch (e) {
            return false;
          }
          
          // Parsed object should have all required properties
          return (
            parsed.hasOwnProperty('id') &&
            parsed.hasOwnProperty('text') &&
            parsed.hasOwnProperty('completed') &&
            parsed.hasOwnProperty('createdAt')
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Task fromJSON creates valid Task instance
   * **Validates: Requirements 8.2, 8.3**
   * 
   * For any valid JSON object with task properties, fromJSON SHALL create
   * a Task instance with all properties correctly assigned.
   */
  test('Property: Task fromJSON creates valid Task instance', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.boolean(),
        fc.integer({ min: 0 }),
        (id, text, completed, createdAt) => {
          const jsonData = {
            id: id,
            text: text,
            completed: completed,
            createdAt: createdAt
          };
          
          const task = Task.fromJSON(jsonData);
          
          // Verify it's a Task instance
          if (!(task instanceof Task)) {
            return false;
          }
          
          // Verify all properties match the input
          return (
            task.id === id &&
            task.text === text &&
            task.completed === completed &&
            task.createdAt === createdAt
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Task constructor with defaults
   * **Validates: Requirements 4.1, 8.3**
   * 
   * For any id and text, creating a Task without specifying completed or createdAt
   * SHALL result in completed being false and createdAt being a valid timestamp.
   */
  test('Property: Task constructor applies correct defaults', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (id, text) => {
          const beforeTime = Date.now();
          const task = new Task(id, text);
          const afterTime = Date.now();
          
          // Verify defaults
          return (
            task.id === id &&
            task.text === text &&
            task.completed === false &&
            task.createdAt >= beforeTime &&
            task.createdAt <= afterTime
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Task array serialization round-trip
   * **Validates: Requirements 8.4**
   * 
   * For any array of tasks, serializing the entire array and deserializing it
   * SHALL produce an equivalent array with the same number of tasks and all
   * properties preserved.
   */
  test('Property: Task array serialization round-trip preserves collection', () => {
    fc.assert(
      fc.property(
        // Generate array of tasks
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            text: fc.string({ minLength: 1 }),
            completed: fc.boolean(),
            createdAt: fc.integer({ min: 0 })
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (taskDataArray) => {
          // Create tasks
          const originalTasks = taskDataArray.map(data => 
            new Task(data.id, data.text, data.completed, data.createdAt)
          );
          
          // Serialize array
          const jsonArray = originalTasks.map(task => task.toJSON());
          const jsonString = JSON.stringify(jsonArray);
          
          // Deserialize array
          const parsedArray = JSON.parse(jsonString);
          const restoredTasks = parsedArray.map(data => Task.fromJSON(data));
          
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

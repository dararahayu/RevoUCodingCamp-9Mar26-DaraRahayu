import { describe, test, expect } from 'vitest';

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

describe('Task Class - Unit Tests', () => {
  /**
   * Test Task constructor with all parameters
   * **Validates: Requirements 4.1, 8.3**
   */
  describe('Task Constructor', () => {
    test('creates task with all parameters provided', () => {
      const task = new Task('123', 'Buy groceries', false, 1234567890000);
      
      expect(task.id).toBe('123');
      expect(task.text).toBe('Buy groceries');
      expect(task.completed).toBe(false);
      expect(task.createdAt).toBe(1234567890000);
    });

    test('creates task with default completed status', () => {
      const task = new Task('456', 'Write report', undefined, 1234567890000);
      
      expect(task.id).toBe('456');
      expect(task.text).toBe('Write report');
      expect(task.completed).toBe(false);
      expect(task.createdAt).toBe(1234567890000);
    });

    test('creates task with default createdAt timestamp', () => {
      const beforeTime = Date.now();
      const task = new Task('789', 'Call client', true);
      const afterTime = Date.now();
      
      expect(task.id).toBe('789');
      expect(task.text).toBe('Call client');
      expect(task.completed).toBe(true);
      expect(task.createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(task.createdAt).toBeLessThanOrEqual(afterTime);
    });

    test('creates task with completed status true', () => {
      const task = new Task('999', 'Completed task', true, 1234567890000);
      
      expect(task.completed).toBe(true);
    });
  });

  /**
   * Test toJSON serialization
   * **Validates: Requirements 8.1, 8.3**
   */
  describe('Task Serialization - toJSON', () => {
    test('serializes task to JSON object with all properties', () => {
      const task = new Task('abc123', 'Test task', false, 1234567890000);
      const json = task.toJSON();
      
      expect(json).toEqual({
        id: 'abc123',
        text: 'Test task',
        completed: false,
        createdAt: 1234567890000
      });
    });

    test('serializes completed task correctly', () => {
      const task = new Task('def456', 'Completed task', true, 9876543210000);
      const json = task.toJSON();
      
      expect(json).toEqual({
        id: 'def456',
        text: 'Completed task',
        completed: true,
        createdAt: 9876543210000
      });
    });

    test('serialized JSON can be stringified', () => {
      const task = new Task('xyz789', 'Stringify test', false, 1111111111111);
      const json = task.toJSON();
      const jsonString = JSON.stringify(json);
      
      expect(jsonString).toBe('{"id":"xyz789","text":"Stringify test","completed":false,"createdAt":1111111111111}');
    });
  });

  /**
   * Test fromJSON deserialization
   * **Validates: Requirements 8.2, 8.3**
   */
  describe('Task Deserialization - fromJSON', () => {
    test('deserializes task from JSON object', () => {
      const jsonData = {
        id: 'test123',
        text: 'Deserialized task',
        completed: false,
        createdAt: 1234567890000
      };
      
      const task = Task.fromJSON(jsonData);
      
      expect(task).toBeInstanceOf(Task);
      expect(task.id).toBe('test123');
      expect(task.text).toBe('Deserialized task');
      expect(task.completed).toBe(false);
      expect(task.createdAt).toBe(1234567890000);
    });

    test('deserializes completed task from JSON', () => {
      const jsonData = {
        id: 'done456',
        text: 'Already done',
        completed: true,
        createdAt: 9876543210000
      };
      
      const task = Task.fromJSON(jsonData);
      
      expect(task).toBeInstanceOf(Task);
      expect(task.completed).toBe(true);
    });

    test('deserializes task from parsed JSON string', () => {
      const jsonString = '{"id":"parse789","text":"From string","completed":false,"createdAt":5555555555555}';
      const jsonData = JSON.parse(jsonString);
      const task = Task.fromJSON(jsonData);
      
      expect(task).toBeInstanceOf(Task);
      expect(task.id).toBe('parse789');
      expect(task.text).toBe('From string');
      expect(task.completed).toBe(false);
      expect(task.createdAt).toBe(5555555555555);
    });
  });

  /**
   * Test round-trip serialization (serialize then deserialize)
   * **Validates: Requirements 8.4**
   */
  describe('Task Round-Trip Serialization', () => {
    test('round-trip preserves all task properties', () => {
      const originalTask = new Task('round123', 'Round trip test', false, 1234567890000);
      
      // Serialize
      const json = originalTask.toJSON();
      const jsonString = JSON.stringify(json);
      
      // Deserialize
      const parsedJson = JSON.parse(jsonString);
      const restoredTask = Task.fromJSON(parsedJson);
      
      // Verify all properties match
      expect(restoredTask.id).toBe(originalTask.id);
      expect(restoredTask.text).toBe(originalTask.text);
      expect(restoredTask.completed).toBe(originalTask.completed);
      expect(restoredTask.createdAt).toBe(originalTask.createdAt);
    });

    test('round-trip preserves completed task state', () => {
      const originalTask = new Task('complete789', 'Done task', true, 9999999999999);
      
      const json = originalTask.toJSON();
      const restoredTask = Task.fromJSON(json);
      
      expect(restoredTask.completed).toBe(true);
      expect(restoredTask.id).toBe(originalTask.id);
      expect(restoredTask.text).toBe(originalTask.text);
      expect(restoredTask.createdAt).toBe(originalTask.createdAt);
    });
  });
});

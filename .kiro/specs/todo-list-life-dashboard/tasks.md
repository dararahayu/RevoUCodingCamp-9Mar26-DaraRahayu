# Implementation Plan: To-Do List Life Dashboard

## Overview

This plan implements a client-side web application using vanilla JavaScript, HTML, and CSS. The implementation follows an MVC pattern with Local Storage for data persistence. Tasks are organized to build incrementally from core structure through individual components, with property-based tests validating universal behaviors and unit tests covering specific examples and edge cases.

## Tasks

- [x] 1. Set up project structure and HTML foundation
  - Create directory structure: css/, js/, and root index.html
  - Write index.html with semantic structure for all dashboard sections
  - Include container elements for greeting, tasks, timer, and quick links
  - Link CSS and JavaScript files
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 2. Implement Greeting Component
  - [x] 2.1 Create GreetingComponent class with time and date display
    - Implement constructor, updateTime(), getGreeting(), and render() methods
    - Format time in 12-hour format with AM/PM indicator
    - Display date with day of week, month, and day
    - Set up setInterval to update every second
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_
  
  - [x] 2.2 Write property tests for greeting component
    - **Property 1: Time Display Format** - Verify 12-hour format with AM/PM for any timestamp
    - **Property 2: Date Display Completeness** - Verify day of week, month, and day present
    - **Property 3: Time-Based Greeting Correctness** - Verify greeting matches time period
    - **Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3**
  
  - [x] 2.3 Write unit tests for greeting component
    - Test specific times (10:30 AM, midnight as 12:00 AM, noon as 12:00 PM)
    - Test specific dates (Monday, January 15)
    - Test greeting transitions at boundary times (4:59 AM, 5:00 AM, 11:59 AM, 12:00 PM, 5:59 PM, 6:00 PM)
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 2.3_

- [x] 3. Implement Task Manager
  - [x] 3.1 Create Task class with serialization
    - Implement constructor with id, text, completed, createdAt properties
    - Implement toJSON() and static fromJSON() methods
    - _Requirements: 4.1, 8.3_
  
  - [x] 3.2 Create TaskManager class with CRUD operations
    - Implement constructor, addTask(), editTask(), toggleComplete(), deleteTask() methods
    - Implement getTasks(), loadTasks(), and render() methods
    - Add validation for non-empty task text (trim whitespace)
    - Generate unique IDs for tasks (timestamp or UUID)
    - _Requirements: 4.1, 4.3, 5.1, 5.2, 5.4, 6.1, 6.4, 7.1_
  
  - [x] 3.3 Write property tests for task manager
    - **Property 7: Task Addition Increases Collection Size** - Verify add operation increases length by one
    - **Property 8: Whitespace Task Text Rejection** - Verify whitespace-only text is rejected
    - **Property 9: Task Edit Updates Text** - Verify edit operation updates task text
    - **Property 10: Task Completion Toggle** - Verify toggle changes status and double-toggle returns to original
    - **Property 11: Completed Task Visual Indication** - Verify completed tasks have visual indicator in render output
    - **Property 12: Task Deletion Removes from Collection** - Verify delete operation removes task and decreases length
    - **Property 13: Task Serialization Round-Trip** - Verify serialize then deserialize produces equivalent collection
    - **Validates: Requirements 4.1, 4.3, 5.2, 5.4, 6.1, 6.3, 6.4, 7.1, 8.1, 8.2, 8.3, 8.4**
  
  - [x] 3.4 Write unit tests for task manager
    - Test empty string and whitespace-only task rejection
    - Test task list with 0 tasks handles operations correctly
    - Test specific task operations (add, edit, delete, toggle)
    - Test completed task rendering includes CSS class or style
    - _Requirements: 4.3, 5.4, 6.3, 7.1_

- [x] 4. Implement Focus Timer
  - [x] 4.1 Create FocusTimer class with countdown logic
    - Implement constructor, start(), stop(), reset(), tick() methods
    - Implement formatTime() to convert seconds to MM:SS format
    - Initialize with 25 minutes (1500 seconds)
    - Use setInterval for countdown updates
    - Emit notification when timer reaches zero
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 4.2 Write property tests for focus timer
    - **Property 4: Timer Format Consistency** - Verify formatTime produces MM:SS for any seconds 0-1500
    - **Property 5: Timer Stop Preserves State** - Verify stop operation doesn't change remaining time
    - **Property 6: Timer Reset Returns to Initial State** - Verify reset sets remaining to 1500
    - **Validates: Requirements 3.3, 3.4, 3.6**
  
  - [x] 4.3 Write unit tests for focus timer
    - Test timer initializes to exactly 1500 seconds
    - Test timer at 0 seconds emits notification
    - Test specific time formats (25:00, 00:00, 01:30)
    - Test start/stop/reset state transitions
    - _Requirements: 3.1, 3.4, 3.5, 3.6_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Quick Links Manager
  - [x] 6.1 Create QuickLink class with serialization
    - Implement constructor with id, label, url properties
    - Implement toJSON() and static fromJSON() methods
    - _Requirements: 9.1, 10.3_
  
  - [x] 6.2 Create QuickLinksManager class with CRUD operations
    - Implement constructor, addLink(), deleteLink() methods
    - Implement getLinks(), loadLinks(), validateUrl(), and render() methods
    - Add validation for non-empty label and valid URL format (http:// or https://)
    - Use URL constructor for URL validation
    - Generate unique IDs for links (timestamp or UUID)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 6.3 Write property tests for quick links manager
    - **Property 14: Quick Link Addition Increases Collection Size** - Verify add operation increases length by one
    - **Property 15: Invalid Link Rejection** - Verify empty label or invalid URL is rejected
    - **Property 16: Link Deletion Removes from Collection** - Verify delete operation removes link and decreases length
    - **Property 17: Link Serialization Round-Trip** - Verify serialize then deserialize produces equivalent collection
    - **Validates: Requirements 9.1, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4**
  
  - [x] 6.4 Write unit tests for quick links manager
    - Test empty label rejection
    - Test invalid URL format rejection (missing protocol, malformed)
    - Test valid URL formats (http://, https://)
    - Test link list with 0 links handles operations correctly
    - Test link click opens in new tab (target="_blank")
    - _Requirements: 9.3, 9.5_

- [x] 7. Implement Dashboard Controller and Local Storage integration
  - [x] 7.1 Create Dashboard class to coordinate all components
    - Implement constructor, init(), loadFromStorage(), saveToStorage() methods
    - Initialize all component instances (GreetingComponent, TaskManager, FocusTimer, QuickLinksManager)
    - Set up event listeners to trigger saveToStorage on data changes
    - _Requirements: 4.2, 7.2, 8.1, 9.2, 10.1_
  
  - [x] 7.2 Implement Local Storage serialization and deserialization
    - Use JSON.stringify() for serialization
    - Use JSON.parse() for deserialization
    - Handle corrupted or missing data gracefully (default to empty arrays)
    - Use storage keys: dashboard_tasks, dashboard_links
    - _Requirements: 8.1, 8.2, 8.3, 10.1, 10.2, 10.3_
  
  - [x] 7.3 Write unit tests for Dashboard controller
    - Test initialization loads from Local Storage
    - Test corrupted JSON handled gracefully
    - Test missing storage keys default to empty arrays
    - Test task operations trigger Local Storage writes
    - Test link operations trigger Local Storage writes
    - _Requirements: 8.2, 8.3, 9.2, 10.2, 10.3_

- [x] 8. Implement CSS styling
  - [x] 8.1 Create styles.css with minimal, clean design
    - Style greeting component (large time display, date, greeting message)
    - Style task list (checkboxes, edit/delete buttons, completed state visual indicator)
    - Style focus timer (large countdown display, control buttons)
    - Style quick links (grid or list layout, clickable links)
    - Ensure responsive layout for different screen sizes
    - Use semantic color scheme and typography
    - _Requirements: 6.3, 13.1, 13.3_

- [x] 9. Final integration and wiring
  - [x] 9.1 Wire all components together in index.html
    - Ensure Dashboard initializes on DOMContentLoaded
    - Connect all event handlers for user interactions
    - Verify all components render correctly on page load
    - Test data persistence across page reloads
    - _Requirements: 4.2, 4.4, 7.2, 7.3, 8.1, 9.2, 10.1, 12.1, 12.2, 12.3_
  
  - [x] 9.2 Write integration tests
    - Test dashboard initialization and component rendering
    - Test task operations update display within 100ms
    - Test quick links operations update display within 100ms
    - Test timer updates display every second
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and integration points
- The design uses JavaScript, so all implementation will be in vanilla JavaScript
- Browser compatibility testing (Requirement 11) should be done manually after implementation
- Performance validation (Requirement 12) should be verified during integration testing
- Optional enhancement requirements (14-18) are not included in this core implementation plan

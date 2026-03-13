# Dashboard Integration Test Checklist

This document provides a manual testing checklist to verify all components are properly wired together.

## Prerequisites
- Open `index.html` in a web browser
- Open browser DevTools Console (F12)

## Test 1: Dashboard Initialization (Requirement 12.1)
**Expected**: Dashboard displays initial interface within 1 second

- [ ] Page loads quickly (< 1 second)
- [ ] Time display shows current time in 12-hour format with AM/PM
- [ ] Date display shows day of week, month, and day
- [ ] Greeting message shows "Good Morning", "Good Afternoon", or "Good Evening"
- [ ] Timer displays "25:00"
- [ ] Task list is empty (or shows previously saved tasks)
- [ ] Quick links section is empty (or shows previously saved links)
- [ ] Console shows "Life Dashboard initialized"

## Test 2: Greeting Component Updates
**Expected**: Time updates every second, greeting changes based on time of day

- [ ] Time display updates every second
- [ ] Seconds increment correctly
- [ ] Greeting message is appropriate for current time:
  - 5:00 AM - 11:59 AM: "Good Morning"
  - 12:00 PM - 5:59 PM: "Good Afternoon"
  - 6:00 PM - 4:59 AM: "Good Evening"

## Test 3: Task Operations (Requirements 4.2, 4.4, 7.2, 7.3)
**Expected**: Tasks can be added, edited, completed, and deleted with UI updates < 100ms

### Add Task
- [ ] Type "Buy groceries" in task input
- [ ] Click "Add" button
- [ ] Task appears in list immediately (< 100ms)
- [ ] Input field clears after adding
- [ ] Task has checkbox, text, Edit button, and Delete button

### Add Task with Enter Key
- [ ] Type "Call dentist" in task input
- [ ] Press Enter key
- [ ] Task appears in list immediately

### Reject Empty Task
- [ ] Try to add empty task (just spaces)
- [ ] Task is not added to list

### Toggle Task Completion
- [ ] Click checkbox next to "Buy groceries"
- [ ] Task gets "completed" CSS class (visual indicator)
- [ ] Click checkbox again
- [ ] Task removes "completed" CSS class

### Edit Task
- [ ] Click "Edit" button on "Buy groceries"
- [ ] Prompt appears with current text
- [ ] Change text to "Buy organic groceries"
- [ ] Click OK
- [ ] Task text updates in list

### Edit Task - Reject Empty
- [ ] Click "Edit" button on a task
- [ ] Clear all text in prompt
- [ ] Click OK
- [ ] Task text remains unchanged

### Delete Task
- [ ] Click "Delete" button on a task
- [ ] Task is removed from list immediately (< 100ms)

## Test 4: Focus Timer Operations (Requirement 12.4)
**Expected**: Timer updates every second with no visible lag

### Initial State
- [ ] Timer displays "25:00"
- [ ] Start button is enabled
- [ ] Stop button is disabled

### Start Timer
- [ ] Click "Start" button
- [ ] Timer begins counting down
- [ ] Start button becomes disabled
- [ ] Stop button becomes enabled
- [ ] Timer updates every second: 24:59, 24:58, 24:57...

### Stop Timer
- [ ] Click "Stop" button
- [ ] Timer pauses at current time
- [ ] Start button becomes enabled
- [ ] Stop button becomes disabled

### Resume Timer
- [ ] Click "Start" button again
- [ ] Timer resumes from where it stopped

### Reset Timer
- [ ] Click "Reset" button
- [ ] Timer returns to "25:00"
- [ ] Timer stops if it was running

## Test 5: Quick Links Operations (Requirements 9.2, 10.1, 12.3)
**Expected**: Links can be added and deleted with UI updates < 100ms

### Add Link
- [ ] Type "GitHub" in label input
- [ ] Type "https://github.com" in URL input
- [ ] Click "Add" button
- [ ] Link appears in grid immediately (< 100ms)
- [ ] Input fields clear after adding
- [ ] Link has correct label and Delete button

### Add Link - Reject Empty Label
- [ ] Leave label empty
- [ ] Type "https://example.com" in URL input
- [ ] Click "Add" button
- [ ] Link is not added

### Add Link - Reject Invalid URL
- [ ] Type "Google" in label input
- [ ] Type "not-a-url" in URL input (no http:// or https://)
- [ ] Click "Add" button
- [ ] Link is not added

### Click Link
- [ ] Click on a link
- [ ] Link opens in new tab (target="_blank")
- [ ] Original tab remains on dashboard

### Delete Link
- [ ] Click "Delete" button on a link
- [ ] Link is removed from grid immediately (< 100ms)

## Test 6: Data Persistence (Requirements 8.1, 10.1)
**Expected**: Data persists across page reloads

### Save Tasks
- [ ] Add 2-3 tasks
- [ ] Mark one as completed
- [ ] Open DevTools > Application > Local Storage
- [ ] Verify "dashboard_tasks" key exists with task data

### Save Links
- [ ] Add 2-3 quick links
- [ ] Open DevTools > Application > Local Storage
- [ ] Verify "dashboard_links" key exists with link data

### Reload Page
- [ ] Refresh the page (F5 or Ctrl+R)
- [ ] All tasks are still present
- [ ] Task completion states are preserved
- [ ] All quick links are still present
- [ ] Timer resets to 25:00 (timer state is not persisted)

### Clear Storage and Reload
- [ ] Open DevTools > Application > Local Storage
- [ ] Delete "dashboard_tasks" and "dashboard_links" keys
- [ ] Refresh the page
- [ ] Dashboard loads with empty task list and links
- [ ] No errors in console

## Test 7: Error Handling

### Corrupted Storage Data
- [ ] Open DevTools > Application > Local Storage
- [ ] Edit "dashboard_tasks" to invalid JSON (e.g., `{broken`)
- [ ] Refresh the page
- [ ] Dashboard loads with empty task list
- [ ] Error logged to console but app continues to work

## Test 8: All Components Render Correctly
**Expected**: All sections are visible and properly styled

- [ ] Greeting section is at the top
- [ ] Main content has three sections side by side (or stacked on mobile)
- [ ] Task section has input, add button, and task list
- [ ] Timer section has display and three control buttons
- [ ] Quick links section has two inputs, add button, and links grid
- [ ] All text is readable
- [ ] All buttons are clickable
- [ ] Layout is responsive (resize browser window to test)

## Summary

All tests passed: ☐ Yes ☐ No

If any tests failed, note the issues below:

---

**Notes:**


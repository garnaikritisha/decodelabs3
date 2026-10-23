/**
 * DecodeLabs DevOps Project 3: Automated Test Suite
 * Automated tests for Stage 3 of CI/CD Pipeline
 * 
 * Verifies:
 * 1. Project file structure & file integrity
 * 2. HTML semantic structure & element IDs
 * 3. Core JavaScript business logic & sprint metrics
 * 4. Error handling & input sanitization
 * 5. CI/CD Quality Gate failure simulation
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Import pure application logic from script.js
const {
  DEFAULT_TASKS,
  validateTaskInput,
  createTask,
  calculateMetrics,
  filterTasks,
  toggleTaskStatus,
  deleteTask
} = require('../script.js');

// ============================================================================
// 1. Project Structure & File Integrity Tests
// ============================================================================
describe('Stage 2: File Structure & Asset Integrity', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('should verify all mandatory project files exist', () => {
    const requiredFiles = [
      'index.html',
      'style.css',
      'script.js',
      'package.json',
      'README.md',
      'LICENSE',
      '.gitignore',
      '.github/workflows/ci-cd.yml'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(rootDir, file);
      assert.ok(fs.existsSync(filePath), `Required file missing: ${file}`);
      const stats = fs.statSync(filePath);
      assert.ok(stats.size > 0, `File should not be empty: ${file}`);
    });
  });

  it('should verify package.json has required scripts', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.equal(typeof pkg.scripts, 'object', 'package.json must contain scripts');
    assert.ok(pkg.scripts.test, 'package.json must define a test script');
  });

  it('should verify GitHub Actions workflow file syntax contains triggers and jobs', () => {
    const workflowPath = path.join(rootDir, '.github', 'workflows', 'ci-cd.yml');
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(content.includes('name:'), 'Workflow must specify a name');
    assert.ok(content.includes('on:'), 'Workflow must define triggers');
    assert.ok(content.includes('jobs:'), 'Workflow must define jobs');
    assert.ok(content.includes('validate:'), 'Workflow must include a validate job');
    assert.ok(content.includes('test:'), 'Workflow must include a test job');
    assert.ok(content.includes('deploy:'), 'Workflow must include a deploy job');
  });
});

// ============================================================================
// 2. HTML Semantic Structure & UI Verification
// ============================================================================
describe('Stage 3: HTML Structure & Semantic Elements', () => {
  const htmlPath = path.resolve(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  it('should contain doctype and HTML5 semantic tags', () => {
    assert.ok(html.includes('<!DOCTYPE html>'), 'Must have <!DOCTYPE html>');
    assert.ok(html.includes('<html lang="en">'), 'Must have <html lang="en">');
    assert.ok(html.includes('<header'), 'Must have <header> element');
    assert.ok(html.includes('<main'), 'Must have <main> element');
    assert.ok(html.includes('<footer'), 'Must have <footer> element');
  });

  it('should define viewport meta tag and SEO description', () => {
    assert.ok(html.includes('<meta name="viewport"'), 'Must have responsive viewport tag');
    assert.ok(html.includes('<meta name="description"'), 'Must have SEO meta description');
    assert.ok(html.includes('<title>'), 'Must have page title');
  });

  it('should contain all required DOM element IDs for interactivity', () => {
    const requiredIds = [
      'id="task-form"',
      'id="task-title"',
      'id="task-category"',
      'id="task-priority"',
      'id="task-status"',
      'id="tasks-container"',
      'id="task-stats"',
      'id="search-tasks"',
      'id="filter-category"',
      'id="filter-status-pills"',
      'id="pipeline-status-badge"',
      'id="btn-simulate-pipeline"',
      'id="deploy-url-link"'
    ];

    requiredIds.forEach(id => {
      assert.ok(html.includes(id), `HTML must contain element with ${id}`);
    });
  });
});

// ============================================================================
// 3. Application Business Logic Tests
// ============================================================================
describe('Stage 3: Core Application Business Logic', () => {
  
  it('should have valid default training tasks preloaded', () => {
    assert.ok(Array.isArray(DEFAULT_TASKS), 'DEFAULT_TASKS must be an array');
    assert.ok(DEFAULT_TASKS.length >= 4, 'Must preload at least 4 default DevOps tasks');

    DEFAULT_TASKS.forEach(task => {
      assert.ok(task.id, 'Task must have an id');
      assert.ok(task.title, 'Task must have a title');
      assert.ok(task.category, 'Task must have a category');
      assert.ok(task.priority, 'Task must have a priority');
      assert.ok(['Pending', 'In Progress', 'Completed'].includes(task.status), 'Task has valid status');
    });
  });

  describe('validateTaskInput()', () => {
    it('should approve valid task input', () => {
      const result = validateTaskInput({
        title: 'Configure Docker Containerization',
        category: 'Infrastructure',
        priority: 'High',
        status: 'Pending'
      });
      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });

    it('should reject empty or missing task title', () => {
      const result = validateTaskInput({ title: '   ' });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('Task title is required')));
    });

    it('should reject titles shorter than 3 characters', () => {
      const result = validateTaskInput({ title: 'CI' });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('at least 3 characters')));
    });

    it('should reject invalid priority levels', () => {
      const result = validateTaskInput({
        title: 'Setup Kubernetes Cluster',
        priority: 'UltraHigh'
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('Invalid priority')));
    });
  });

  describe('createTask()', () => {
    it('should generate a formatted task object with unique ID and timestamp', () => {
      const task = createTask('Configure Prometheus Alertmanager', 'Monitoring', 'Critical', 'Pending');
      assert.ok(task.id.startsWith('task-'));
      assert.equal(task.title, 'Configure Prometheus Alertmanager');
      assert.equal(task.category, 'Monitoring');
      assert.equal(task.priority, 'Critical');
      assert.equal(task.status, 'Pending');
      assert.ok(task.createdAt, 'Should have createdAt timestamp');
    });

    it('should throw an error when called with invalid input', () => {
      assert.throws(() => {
        createTask('');
      }, /Task title is required/);
    });
  });

  describe('calculateMetrics()', () => {
    it('should calculate accurate sprint completion statistics', () => {
      const sampleTasks = [
        { id: '1', status: 'Completed' },
        { id: '2', status: 'Completed' },
        { id: '3', status: 'In Progress' },
        { id: '4', status: 'Pending' }
      ];

      const metrics = calculateMetrics(sampleTasks);
      assert.equal(metrics.total, 4);
      assert.equal(metrics.completed, 2);
      assert.equal(metrics.inProgress, 1);
      assert.equal(metrics.pending, 1);
      assert.equal(metrics.completionPercentage, 50);
    });

    it('should handle empty task array safely without divide-by-zero errors', () => {
      const metrics = calculateMetrics([]);
      assert.deepEqual(metrics, {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        completionPercentage: 0
      });
    });
  });

  describe('filterTasks()', () => {
    const mockTasks = [
      { id: '1', title: 'Setup GitHub Actions', category: 'CI/CD', status: 'Completed', description: 'Pipeline automation' },
      { id: '2', title: 'Deploy to AWS EC2', category: 'Infrastructure', status: 'In Progress', description: 'Cloud deployment' },
      { id: '3', title: 'Write Unit Tests', category: 'Testing', status: 'Pending', description: 'Jest and Node tests' }
    ];

    it('should filter tasks by status', () => {
      const completed = filterTasks(mockTasks, { status: 'Completed' });
      assert.equal(completed.length, 1);
      assert.equal(completed[0].id, '1');
    });

    it('should filter tasks by category', () => {
      const infra = filterTasks(mockTasks, { category: 'Infrastructure' });
      assert.equal(infra.length, 1);
      assert.equal(infra[0].title, 'Deploy to AWS EC2');
    });

    it('should search tasks case-insensitively across title, category, and description', () => {
      const searched = filterTasks(mockTasks, { searchQuery: 'pipeline' });
      assert.equal(searched.length, 1);
      assert.equal(searched[0].id, '1');

      const searchedTests = filterTasks(mockTasks, { searchQuery: 'unit' });
      assert.equal(searchedTests.length, 1);
      assert.equal(searchedTests[0].id, '3');
    });
  });

  describe('toggleTaskStatus() & deleteTask()', () => {
    it('should cycle task status correctly', () => {
      const initial = [{ id: '1', status: 'Pending' }];
      const step1 = toggleTaskStatus(initial, '1');
      assert.equal(step1[0].status, 'In Progress');

      const step2 = toggleTaskStatus(step1, '1');
      assert.equal(step2[0].status, 'Completed');

      const step3 = toggleTaskStatus(step2, '1');
      assert.equal(step3[0].status, 'Pending');
    });

    it('should delete task by ID without mutating other tasks', () => {
      const initial = [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' }
      ];
      const updated = deleteTask(initial, '1');
      assert.equal(updated.length, 1);
      assert.equal(updated[0].id, '2');
    });
  });
});

// ============================================================================
// 4. Quality Gate Simulation Test
// ============================================================================
describe('Stage 4: Quality Gate Enforcement', () => {
  it('should uphold quality gate requirements', () => {
    // If the environment variable SIMULATE_PIPELINE_FAILURE is set to 'true',
    // fail intentionally to prove that GitHub Actions halts before Stage 5 (Deploy).
    if (process.env.SIMULATE_PIPELINE_FAILURE === 'true') {
      assert.fail('Simulated Quality Gate Failure: Test failed! Deployment stage must NOT run.');
    }
    assert.ok(true, 'Quality Gate passed successfully.');
  });
});

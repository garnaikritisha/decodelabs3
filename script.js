/**
 * DecodeLabs DevOps Project 3: DevOps Project Tracker
 * Automated CI/CD Pipeline Web Application Logic
 */

// ============================================================================
// Default Pre-populated DevOps Tasks
// ============================================================================
const DEFAULT_TASKS = [
  {
    id: 'task-1',
    title: 'Linux Fundamentals & Shell Scripting',
    category: 'Infrastructure',
    priority: 'High',
    status: 'Completed',
    description: 'Mastered bash commands, file permissions, users, and environment variables (Project 1).',
    createdAt: '2026-10-15T09:00:00.000Z'
  },
  {
    id: 'task-2',
    title: 'Git Version Control & Branching Strategy',
    category: 'CI/CD',
    priority: 'Critical',
    status: 'Completed',
    description: 'Repository structure, commits, pull requests, and merge conflict resolution (Project 2).',
    createdAt: '2026-10-18T10:30:00.000Z'
  },
  {
    id: 'task-3',
    title: 'GitHub Actions Automated CI/CD Pipeline',
    category: 'CI/CD',
    priority: 'Critical',
    status: 'In Progress',
    description: 'Implement 5-stage automated workflow with quality gates and GitHub Pages deploy (Project 3).',
    createdAt: '2026-10-23T14:15:00.000Z'
  },
  {
    id: 'task-4',
    title: 'Automated Unit Tests & Quality Gate Enforcement',
    category: 'Testing',
    priority: 'High',
    status: 'In Progress',
    description: 'Validate project integrity and fail workflow if tests fail before deployment.',
    createdAt: '2026-10-23T15:00:00.000Z'
  },
  {
    id: 'task-5',
    title: 'Containerize Application with Docker',
    category: 'Infrastructure',
    priority: 'Medium',
    status: 'Pending',
    description: 'Write multi-stage Dockerfile and test local container runtime on macOS.',
    createdAt: '2026-10-24T08:00:00.000Z'
  },
  {
    id: 'task-6',
    title: 'Configure Prometheus Metrics & Health Monitoring',
    category: 'Monitoring',
    priority: 'Low',
    status: 'Pending',
    description: 'Setup uptime probes and alert notification webhooks.',
    createdAt: '2026-10-24T08:30:00.000Z'
  }
];

// ============================================================================
// Pure Business Logic Functions (Exportable for Unit Tests)
// ============================================================================

/**
 * Validates task creation input
 * @param {Object} input - { title, category, priority, status }
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateTaskInput(input) {
  const errors = [];
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Invalid task payload'] };
  }

  if (!input.title || typeof input.title !== 'string' || input.title.trim().length === 0) {
    errors.push('Task title is required');
  } else if (input.title.trim().length < 3) {
    errors.push('Task title must be at least 3 characters long');
  }

  const validCategories = ['CI/CD', 'Infrastructure', 'Testing', 'Security', 'Monitoring'];
  if (input.category && !validCategories.includes(input.category)) {
    errors.push(`Invalid category: ${input.category}`);
  }

  const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
  if (input.priority && !validPriorities.includes(input.priority)) {
    errors.push(`Invalid priority: ${input.priority}`);
  }

  const validStatuses = ['Pending', 'In Progress', 'Completed'];
  if (input.status && !validStatuses.includes(input.status)) {
    errors.push(`Invalid status: ${input.status}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Creates a normalized task object
 */
function createTask(title, category = 'CI/CD', priority = 'Medium', status = 'Pending', description = '') {
  const validation = validateTaskInput({ title, category, priority, status });
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  return {
    id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    title: title.trim(),
    category,
    priority,
    status,
    description: description ? description.trim() : '',
    createdAt: new Date().toISOString()
  };
}

/**
 * Calculates sprint metrics
 */
function calculateMetrics(tasks) {
  if (!Array.isArray(tasks)) {
    return { total: 0, completed: 0, inProgress: 0, pending: 0, completionPercentage: 0 };
  }

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const pending = tasks.filter(t => t.status === 'Pending').length;
  const completionPercentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    total,
    completed,
    inProgress,
    pending,
    completionPercentage
  };
}

/**
 * Filters tasks based on criteria
 */
function filterTasks(tasks, { status = 'all', category = 'all', searchQuery = '' } = {}) {
  if (!Array.isArray(tasks)) return [];

  return tasks.filter(task => {
    // Filter by status
    if (status !== 'all' && task.status !== status) {
      return false;
    }

    // Filter by category
    if (category !== 'all' && task.category !== category) {
      return false;
    }

    // Search query
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (task.title || '').toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      const matchCat = (task.category || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Toggles task status in a cycle: Pending -> In Progress -> Completed -> Pending
 */
function toggleTaskStatus(tasks, taskId) {
  return tasks.map(task => {
    if (task.id === taskId) {
      let nextStatus = 'Pending';
      if (task.status === 'Pending') nextStatus = 'In Progress';
      else if (task.status === 'In Progress') nextStatus = 'Completed';
      else if (task.status === 'Completed') nextStatus = 'Pending';

      return { ...task, status: nextStatus };
    }
    return task;
  });
}

/**
 * Deletes a task by id
 */
function deleteTask(tasks, taskId) {
  return tasks.filter(task => task.id !== taskId);
}

// ============================================================================
// Browser Application Lifecycle & UI Controller
// ============================================================================
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // State
    const STORAGE_KEY = 'decodelabs_devops_tasks_v1';
    let tasks = loadTasksFromStorage();
    let currentFilter = 'all';
    let currentCategory = 'all';
    let searchQuery = '';
    let isSimulating = false;

    // DOM Elements
    const elements = {
      taskStats: document.getElementById('task-stats'),
      statTotal: document.getElementById('stat-total'),
      statCompleted: document.getElementById('stat-completed'),
      statInProgress: document.getElementById('stat-in-progress'),
      statPending: document.getElementById('stat-pending'),
      statCompletionPct: document.getElementById('stat-completion-pct'),
      progressBar: document.getElementById('completion-progress-bar'),

      countAll: document.getElementById('count-all'),
      countPending: document.getElementById('count-pending'),
      countInProgress: document.getElementById('count-in-progress'),
      countCompleted: document.getElementById('count-completed'),

      tasksContainer: document.getElementById('tasks-container'),
      emptyState: document.getElementById('empty-state'),
      searchTasks: document.getElementById('search-tasks'),
      filterCategory: document.getElementById('filter-category'),
      filterStatusPills: document.getElementById('filter-status-pills'),

      btnToggleForm: document.getElementById('btn-toggle-task-form'),
      btnCloseForm: document.getElementById('btn-close-form'),
      btnCancelForm: document.getElementById('btn-cancel-form'),
      taskFormContainer: document.getElementById('task-form-container'),
      taskForm: document.getElementById('task-form'),

      btnResetTasks: document.getElementById('btn-reset-tasks'),
      btnExportTasks: document.getElementById('btn-export-tasks'),
      btnClearSearch: document.getElementById('btn-clear-search'),
      btnSimulatePipeline: document.getElementById('btn-simulate-pipeline'),
      btnClearTerminal: document.getElementById('btn-clear-terminal'),
      terminalLogs: document.getElementById('terminal-logs'),

      btnCopyUrl: document.getElementById('btn-copy-url'),
      deployUrlLink: document.getElementById('deploy-url-link'),
      toastContainer: document.getElementById('toast-container'),
      deploymentTimestamp: document.getElementById('deployment-timestamp')
    };

    // Initialize UI
    initUI();

    function initUI() {
      render();
      setupEventListeners();
      updateDeploymentURL();
    }

    function loadTasksFromStorage() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Could not read from localStorage, using defaults.', e);
      }
      return [...DEFAULT_TASKS];
    }

    function saveTasks() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
    }

    function updateDeploymentURL() {
      // Auto-detect GitHub Pages URL or provide current host
      if (window.location.hostname.includes('github.io')) {
        const currentUrl = window.location.href;
        if (elements.deployUrlLink) {
          elements.deployUrlLink.href = currentUrl;
          elements.deployUrlLink.textContent = currentUrl;
        }
      }
      if (elements.deploymentTimestamp) {
        elements.deploymentTimestamp.textContent = new Date().toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }

    function render() {
      renderMetrics();
      renderTasks();
    }

    function renderMetrics() {
      const metrics = calculateMetrics(tasks);

      if (elements.statTotal) elements.statTotal.textContent = metrics.total;
      if (elements.statCompleted) elements.statCompleted.textContent = metrics.completed;
      if (elements.statInProgress) elements.statInProgress.textContent = metrics.inProgress;
      if (elements.statPending) elements.statPending.textContent = metrics.pending;
      if (elements.statCompletionPct) elements.statCompletionPct.textContent = `${metrics.completionPercentage}% Completed`;
      if (elements.progressBar) elements.progressBar.style.width = `${metrics.completionPercentage}%`;

      if (elements.countAll) elements.countAll.textContent = metrics.total;
      if (elements.countPending) elements.countPending.textContent = metrics.pending;
      if (elements.countInProgress) elements.countInProgress.textContent = metrics.inProgress;
      if (elements.countCompleted) elements.countCompleted.textContent = metrics.completed;
    }

    function renderTasks() {
      const filtered = filterTasks(tasks, {
        status: currentFilter,
        category: currentCategory,
        searchQuery: searchQuery
      });

      if (!elements.tasksContainer) return;

      if (filtered.length === 0) {
        elements.tasksContainer.innerHTML = '';
        if (elements.emptyState) elements.emptyState.style.display = 'block';
        return;
      }

      if (elements.emptyState) elements.emptyState.style.display = 'none';

      elements.tasksContainer.innerHTML = filtered.map(task => {
        const priorityClass = `priority-${task.priority.toLowerCase()}`;
        const isCompleted = task.status === 'Completed';
        const formattedDate = new Date(task.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });

        return `
          <div class="task-card ${priorityClass} ${isCompleted ? 'task-completed' : ''}" data-id="${task.id}">
            <div>
              <div class="task-card-header">
                <div class="task-tags">
                  <span class="tag-cat">${escapeHtml(task.category)}</span>
                  <span class="tag-priority ${priorityClass}-tag">${escapeHtml(task.priority)}</span>
                </div>
                <button type="button" class="btn-task-action btn-delete-task" data-id="${task.id}" title="Delete task" aria-label="Delete task">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
              <h4 class="task-title">${escapeHtml(task.title)}</h4>
              ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
            </div>

            <div class="task-card-footer">
              <span class="task-date">Added: ${formattedDate}</span>
              <div class="task-status-control">
                <select class="status-dropdown" data-id="${task.id}" aria-label="Update task status">
                  <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                  <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    function setupEventListeners() {
      // Toggle Add Task Form
      if (elements.btnToggleForm) {
        elements.btnToggleForm.addEventListener('click', () => {
          elements.taskFormContainer.classList.toggle('open');
          if (elements.taskFormContainer.classList.contains('open')) {
            document.getElementById('task-title').focus();
          }
        });
      }

      if (elements.btnCloseForm) {
        elements.btnCloseForm.addEventListener('click', () => {
          elements.taskFormContainer.classList.remove('open');
        });
      }

      if (elements.btnCancelForm) {
        elements.btnCancelForm.addEventListener('click', () => {
          elements.taskFormContainer.classList.remove('open');
          elements.taskForm.reset();
        });
      }

      // Add Task Submit
      if (elements.taskForm) {
        elements.taskForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const title = document.getElementById('task-title').value;
          const category = document.getElementById('task-category').value;
          const priority = document.getElementById('task-priority').value;
          const status = document.getElementById('task-status').value;
          const description = document.getElementById('task-description').value;

          try {
            const newTask = createTask(title, category, priority, status, description);
            tasks.unshift(newTask);
            saveTasks();
            render();
            elements.taskForm.reset();
            elements.taskFormContainer.classList.remove('open');
            showToast('DevOps Task created successfully!', 'success');
            logToTerminal(`[TASK] Created task: "${newTask.title}" [${newTask.category}]`);
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      }

      // Task actions (Delegated for Delete & Status Change)
      if (elements.tasksContainer) {
        elements.tasksContainer.addEventListener('click', (e) => {
          const deleteBtn = e.target.closest('.btn-delete-task');
          if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            const task = tasks.find(t => t.id === id);
            if (task && confirm(`Delete task: "${task.title}"?`)) {
              tasks = deleteTask(tasks, id);
              saveTasks();
              render();
              showToast('Task removed from backlog', 'warn');
              logToTerminal(`[TASK] Removed task id: ${id}`);
            }
          }
        });

        elements.tasksContainer.addEventListener('change', (e) => {
          if (e.target.classList.contains('status-dropdown')) {
            const id = e.target.getAttribute('data-id');
            const newStatus = e.target.value;
            tasks = tasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
            saveTasks();
            render();
            showToast(`Task status changed to ${newStatus}`, 'info');
            logToTerminal(`[TASK] Status updated to "${newStatus}" for task id: ${id}`);
          }
        });
      }

      // Filter Status Pills
      if (elements.filterStatusPills) {
        elements.filterStatusPills.addEventListener('click', (e) => {
          const pill = e.target.closest('.filter-pill');
          if (pill) {
            elements.filterStatusPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.getAttribute('data-filter');
            renderTasks();
          }
        });
      }

      // Filter Category Dropdown
      if (elements.filterCategory) {
        elements.filterCategory.addEventListener('change', (e) => {
          currentCategory = e.target.value;
          renderTasks();
        });
      }

      // Search Input
      if (elements.searchTasks) {
        elements.searchTasks.addEventListener('input', (e) => {
          searchQuery = e.target.value;
          renderTasks();
        });
      }

      // Clear Search
      if (elements.btnClearSearch) {
        elements.btnClearSearch.addEventListener('click', () => {
          if (elements.searchTasks) elements.searchTasks.value = '';
          searchQuery = '';
          renderTasks();
        });
      }

      // Reset Defaults
      if (elements.btnResetTasks) {
        elements.btnResetTasks.addEventListener('click', () => {
          if (confirm('Reset task backlog to default DecodeLabs sprint tasks?')) {
            tasks = [...DEFAULT_TASKS];
            saveTasks();
            render();
            showToast('Backlog restored to default training tasks', 'info');
            logToTerminal('[BACKLOG] Restored default tasks.');
          }
        });
      }

      // Export JSON
      if (elements.btnExportTasks) {
        elements.btnExportTasks.addEventListener('click', () => {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
          const downloadAnchor = document.createElement('a');
          downloadAnchor.setAttribute("href", dataStr);
          downloadAnchor.setAttribute("download", `devops-tasks-${new Date().toISOString().slice(0, 10)}.json`);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
          showToast('Sprint tasks exported to JSON', 'success');
        });
      }

      // Copy Deployment URL
      if (elements.btnCopyUrl) {
        elements.btnCopyUrl.addEventListener('click', () => {
          const url = elements.deployUrlLink.href;
          navigator.clipboard.writeText(url).then(() => {
            showToast('Deployment URL copied to clipboard!', 'success');
          }).catch(() => {
            showToast('Please copy the URL manually', 'info');
          });
        });
      }

      // Clear Terminal Logs
      if (elements.btnClearTerminal) {
        elements.btnClearTerminal.addEventListener('click', () => {
          if (elements.terminalLogs) {
            elements.terminalLogs.innerHTML = '<div class="log-line log-info"><span class="log-time">[00:00:00]</span> Terminal console cleared. Ready.</div>';
          }
        });
      }

      // Simulate CI/CD Pipeline Run
      if (elements.btnSimulatePipeline) {
        elements.btnSimulatePipeline.addEventListener('click', () => {
          if (isSimulating) return;
          runPipelineSimulation();
        });
      }
    }

    // ========================================================================
    // CI/CD Pipeline Simulator
    // ========================================================================
    function runPipelineSimulation() {
      isSimulating = true;
      elements.btnSimulatePipeline.disabled = true;
      elements.btnSimulatePipeline.innerHTML = `
        <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Running Workflow...
      `;

      const steps = [
        document.getElementById('step-stage-1'),
        document.getElementById('step-stage-2'),
        document.getElementById('step-stage-3'),
        document.getElementById('step-stage-4'),
        document.getElementById('step-stage-5')
      ];

      const statuses = [
        document.getElementById('stage-status-1'),
        document.getElementById('stage-status-2'),
        document.getElementById('stage-status-3'),
        document.getElementById('stage-status-4'),
        document.getElementById('stage-status-5')
      ];

      // Reset all steps to pending
      steps.forEach((step, idx) => {
        if (!step) return;
        step.className = 'pipeline-step';
        if (statuses[idx]) {
          statuses[idx].className = 'step-status status-pending';
          statuses[idx].textContent = 'Queued';
        }
      });

      const simulationSequence = [
        {
          stage: 0,
          name: 'Stage 1: Source Ingestion',
          log: '[STAGE 1] Triggered: push on refs/heads/main. Checking out source repository...',
          time: 600
        },
        {
          stage: 1,
          name: 'Stage 2: Build & Validation',
          log: '[STAGE 2] Checking index.html, style.css, script.js, package.json structure... Verified 9/9 files.',
          time: 900
        },
        {
          stage: 2,
          name: 'Stage 3: Automated Testing',
          log: '[STAGE 3] Executing Node.js test runner: 14 test assertions passed (0 failed). Code quality verified.',
          time: 1100
        },
        {
          stage: 3,
          name: 'Stage 4: Quality Gate',
          log: '[STAGE 4] Quality Gate criteria PASSED. Authorizing deployment to production environment...',
          time: 700
        },
        {
          stage: 4,
          name: 'Stage 5: Deployment',
          log: '[STAGE 5] Uploading artifact to GitHub Pages. Live deployment successful!',
          time: 1000
        }
      ];

      let currentIndex = 0;

      function executeNextStep() {
        if (currentIndex < simulationSequence.length) {
          const current = simulationSequence[currentIndex];
          const stepEl = steps[current.stage];
          const statusEl = statuses[current.stage];

          // Set active state
          if (stepEl) {
            stepEl.className = 'pipeline-step step-active';
            if (statusEl) {
              statusEl.className = 'step-status status-running';
              statusEl.textContent = 'Running...';
            }
          }

          logToTerminal(current.log, 'info');

          setTimeout(() => {
            // Complete state
            if (stepEl) {
              stepEl.className = 'pipeline-step step-complete';
              if (statusEl) {
                statusEl.className = 'step-status status-success';
                statusEl.textContent = current.stage === 3 ? 'Passed' : (current.stage === 4 ? 'Live' : 'Success');
              }
            }
            logToTerminal(`✔ ${current.name} finished successfully.`, 'success');

            currentIndex++;
            executeNextStep();
          }, current.time);
        } else {
          // Finished all stages
          isSimulating = false;
          elements.btnSimulatePipeline.disabled = false;
          elements.btnSimulatePipeline.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Simulate CI/CD Run
          `;
          showToast('CI/CD Pipeline simulation completed with 100% pass rate!', 'success');
        }
      }

      executeNextStep();
    }

    function logToTerminal(message, type = 'info') {
      if (!elements.terminalLogs) return;
      const now = new Date();
      const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
      const line = document.createElement('div');
      line.className = `log-line log-${type}`;
      line.innerHTML = `<span class="log-time">${timeStr}</span> ${escapeHtml(message)}`;
      elements.terminalLogs.appendChild(line);
      elements.terminalLogs.scrollTop = elements.terminalLogs.scrollHeight;
    }

    function showToast(message, type = 'info') {
      if (!elements.toastContainer) return;
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      elements.toastContainer.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
      }, 3200);
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  });
}

// ============================================================================
// Node.js CommonJS Module Exports for Testing in tests/app.test.js
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_TASKS,
    validateTaskInput,
    createTask,
    calculateMetrics,
    filterTasks,
    toggleTaskStatus,
    deleteTask
  };
}

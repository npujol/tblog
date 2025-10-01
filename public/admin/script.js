// GitHub API Configuration
let GITHUB_TOKEN = '';
let GITHUB_OWNER = '';
let GITHUB_REPO = '';
let GITHUB_API_BASE = '';

// Application State
let currentMessages = {
    pending: [],
    approved: [],
    published: []
};

// DOM Elements
const authSection = document.getElementById('auth-section');
const userInfo = document.getElementById('user-info');
const mainContent = document.getElementById('main-content');
const githubTokenInput = document.getElementById('github-token');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameSpan = document.getElementById('username');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check for stored token
    const storedToken = localStorage.getItem('github_token');
    if (storedToken) {
        githubTokenInput.value = storedToken;
        authenticateUser();
    }

    // Event listeners
    loginBtn.addEventListener('click', authenticateUser);
    logoutBtn.addEventListener('click', logout);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Modal handling
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('message-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('message-modal')) {
            closeModal();
        }
    });

    // Extract repository info from current URL
    extractRepositoryInfo();
});

function extractRepositoryInfo() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    if (hostname.includes('github.io')) {
        // Extract from GitHub Pages URL format: username.github.io/repository-name
        const parts = hostname.split('.');
        GITHUB_OWNER = parts[0];

        // Repository name from pathname
        const pathParts = pathname.split('/').filter(part => part);
        GITHUB_REPO = pathParts[0] || 'blog';

        GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

        console.log(`Detected repository: ${GITHUB_OWNER}/${GITHUB_REPO}`);
    } else {
        // Local development or other hosting
        console.warn('Could not auto-detect repository. Please configure manually.');
    }
}

async function authenticateUser() {
    const token = githubTokenInput.value.trim();

    if (!token) {
        showNotification('Please enter your GitHub Personal Access Token', 'error');
        return;
    }

    if (!GITHUB_API_BASE) {
        showNotification('Repository information not detected. Please check the URL.', 'error');
        return;
    }

    try {
        // Verify token and get user info
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error('Invalid GitHub token');
        }

        const user = await response.json();

        // Store token and user info
        GITHUB_TOKEN = token;
        localStorage.setItem('github_token', token);

        // Update UI
        authSection.style.display = 'none';
        userInfo.style.display = 'flex';
        mainContent.style.display = 'block';
        usernameSpan.textContent = user.login;

        showNotification(`Connected as ${user.login}`, 'success');

        // Load initial data
        await loadAllMessages();

    } catch (error) {
        showNotification('Authentication failed. Please check your token.', 'error');
        console.error('Authentication error:', error);
    }
}

function logout() {
    GITHUB_TOKEN = '';
    localStorage.removeItem('github_token');

    authSection.style.display = 'flex';
    userInfo.style.display = 'none';
    mainContent.style.display = 'none';
    githubTokenInput.value = '';

    showNotification('Logged out successfully', 'success');
}

async function loadAllMessages() {
    try {
        // Load all message types
        const [pending, approved, published] = await Promise.all([
            loadMessages('pending-messages.json'),
            loadMessages('approved-messages.json'),
            loadMessages('published-messages.json')
        ]);

        currentMessages.pending = pending.messages || [];
        currentMessages.approved = approved.messages || [];
        currentMessages.published = published.messages || [];

        updateStats();
        renderMessages();

    } catch (error) {
        showNotification('Failed to load messages', 'error');
        console.error('Load messages error:', error);
    }
}

async function loadMessages(filename) {
    const response = await fetch(`${GITHUB_API_BASE}/contents/data/${filename}`, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            return { messages: [], lastUpdated: new Date().toISOString(), version: "1.0" };
        }
        throw new Error(`Failed to load ${filename}`);
    }

    const data = await response.json();
    const content = atob(data.content);
    return JSON.parse(content);
}

function updateStats() {
    document.getElementById('pending-count').textContent = currentMessages.pending.length;
    document.getElementById('approved-count').textContent = currentMessages.approved.length;
    document.getElementById('published-count').textContent = currentMessages.published.length;

    document.getElementById('pending-tab-count').textContent = currentMessages.pending.length;
    document.getElementById('approved-tab-count').textContent = currentMessages.approved.length;
    document.getElementById('published-tab-count').textContent = currentMessages.published.length;
}

function renderMessages() {
    renderMessageList('pending', currentMessages.pending);
    renderMessageList('approved', currentMessages.approved);
    renderMessageList('published', currentMessages.published);
}

function renderMessageList(type, messages) {
    const container = document.getElementById(`${type}-messages`);

    if (messages.length === 0) {
        container.innerHTML = `<div class="empty-state">No ${type} messages</div>`;
        return;
    }

    container.innerHTML = messages.map(message => `
        <div class="message-card" onclick="showMessageDetails('${message.id}', '${type}')">
            <div class="message-header">
                <span class="message-id">${message.id}</span>
                <span class="message-date">${formatDate(message.timestamp)}</span>
            </div>
            <div class="message-preview">${truncateText(message.content, 150)}</div>
            <div class="message-meta">
                ${message.tags ? message.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                ${message.images && message.images.length > 0 ? `<span class="image-count">${message.images.length} image(s)</span>` : ''}
            </div>
        </div>
    `).join('');
}

function showMessageDetails(messageId, type) {
    const message = currentMessages[type].find(m => m.id === messageId);
    if (!message) return;

    const modal = document.getElementById('message-modal');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    // Populate modal content
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Message ID:</label>
            <input type="text" value="${message.id}" readonly>
        </div>
        <div class="form-group">
            <label>Date:</label>
            <input type="text" value="${formatDate(message.timestamp)}" readonly>
        </div>
        <div class="form-group">
            <label>Content:</label>
            <textarea rows="6" readonly>${message.content}</textarea>
        </div>
        ${message.images && message.images.length > 0 ? `
            <div class="form-group">
                <label>Images:</label>
                ${message.images.map(img => `
                    <div>📷 ${img.filename} ${img.caption ? `- ${img.caption}` : ''}</div>
                `).join('')}
            </div>
        ` : ''}
        ${type === 'pending' ? `
            <div class="form-group">
                <label>Tags (comma-separated):</label>
                <input type="text" id="message-tags" placeholder="tag1, tag2, tag3">
            </div>
        ` : ''}
        ${message.tags ? `
            <div class="form-group">
                <label>Current Tags:</label>
                <div>${message.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}</div>
            </div>
        ` : ''}
    `;

    // Populate modal footer based on message type
    if (type === 'pending') {
        modalFooter.innerHTML = `
            <button class="btn-approve" onclick="approveMessage('${messageId}')">✅ Approve</button>
            <button class="btn-reject" onclick="rejectMessage('${messageId}')">❌ Reject</button>
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        `;
    } else {
        modalFooter.innerHTML = `
            <button class="btn-secondary" onclick="closeModal()">Close</button>
        `;
    }

    modal.style.display = 'block';
}

async function approveMessage(messageId) {
    try {
        const message = currentMessages.pending.find(m => m.id === messageId);
        if (!message) return;

        // Get tags from input
        const tagsInput = document.getElementById('message-tags');
        const tags = tagsInput ? tagsInput.value.split(',').map(t => t.trim()).filter(t => t) : [];

        // Update message
        message.status = 'approved';
        message.approved_at = new Date().toISOString();
        message.tags = tags;

        // Move from pending to approved
        currentMessages.pending = currentMessages.pending.filter(m => m.id !== messageId);
        currentMessages.approved.push(message);

        // Save changes
        await saveMessages('pending-messages.json', currentMessages.pending);
        await saveMessages('approved-messages.json', currentMessages.approved);

        // Trigger site rebuild
        await triggerSiteRebuild();

        updateStats();
        renderMessages();
        closeModal();

        showNotification(`Message ${messageId} approved successfully`, 'success');

    } catch (error) {
        showNotification('Failed to approve message', 'error');
        console.error('Approve message error:', error);
    }
}

async function rejectMessage(messageId) {
    try {
        const message = currentMessages.pending.find(m => m.id === messageId);
        if (!message) return;

        // Update message
        message.status = 'rejected';
        message.rejected_at = new Date().toISOString();

        // Move from pending to rejected (we'll store in rejected file)
        currentMessages.pending = currentMessages.pending.filter(m => m.id !== messageId);

        // Save rejected message
        const rejected = await loadMessages('rejected-messages.json');
        rejected.messages.push(message);

        await saveMessages('pending-messages.json', currentMessages.pending);
        await saveMessages('rejected-messages.json', rejected.messages);

        updateStats();
        renderMessages();
        closeModal();

        showNotification(`Message ${messageId} rejected`, 'success');

    } catch (error) {
        showNotification('Failed to reject message', 'error');
        console.error('Reject message error:', error);
    }
}

async function saveMessages(filename, messages) {
    const data = {
        messages: messages,
        lastUpdated: new Date().toISOString(),
        version: "1.0"
    };

    const content = btoa(JSON.stringify(data, null, 2));

    // Get current file (for SHA)
    let sha = null;
    try {
        const response = await fetch(`${GITHUB_API_BASE}/contents/data/${filename}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (response.ok) {
            const data = await response.json();
            sha = data.sha;
        }
    } catch (e) {
        // File might not exist yet
    }

    // Update file
    const updateResponse = await fetch(`${GITHUB_API_BASE}/contents/data/${filename}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Update ${filename}`,
            content: content,
            sha: sha
        })
    });

    if (!updateResponse.ok) {
        throw new Error(`Failed to save ${filename}`);
    }
}

async function triggerSiteRebuild() {
    try {
        await fetch(`${GITHUB_API_BASE}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_type: 'rebuild-site'
            })
        });

        showNotification('Site rebuild triggered', 'success');
    } catch (error) {
        console.warn('Could not trigger rebuild:', error);
        // Non-critical error
    }
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `${tabName}-panel`);
    });
}

function closeModal() {
    document.getElementById('message-modal').style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.getElementById('notifications').appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Refresh data every 30 seconds
setInterval(() => {
    if (GITHUB_TOKEN) {
        loadAllMessages();
    }
}, 30000);
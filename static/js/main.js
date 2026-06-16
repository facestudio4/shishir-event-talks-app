// State Management
let allUpdates = [];
let currentlyFilteredUpdates = [];
let activeTypeFilter = 'all';
let searchQuery = '';

// DOM Elements
const feedContainer = document.getElementById('feed-container');
const btnRefresh = document.getElementById('btn-refresh');
const spinner = document.getElementById('refresh-spinner');
const searchInput = document.getElementById('search-input');
const alertBanner = document.getElementById('alert-banner');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statFeatures = document.getElementById('stat-features');
const statBreaking = document.getElementById('stat-breaking');
const statIssues = document.getElementById('stat-issues');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadReleases();
});

// Setup Event Listeners
function setupEventListeners() {
    // Refresh Button
    btnRefresh.addEventListener('click', loadReleases);

    // Export CSV Button
    const btnExport = document.getElementById('btn-export');
    if (btnExport) {
        btnExport.addEventListener('click', exportToCSV);
    }

    // Search Input (Debounced-like reactivity)
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().strip();
        applyFilters();
    });

    // Filter Chips
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeTypeFilter = chip.dataset.type;
            applyFilters();
        });
    });
}

// Strip Helper
String.prototype.strip = function() {
    return this.replace(/^\s+|\s+$/g, '');
};

// Fetch Releases from Backend API
async function loadReleases() {
    showLoadingState();
    hideAlert();

    try {
        const response = await fetch('/api/releases');
        const data = await response.json();

        if (data.success) {
            processReleases(data.releases);
            applyFilters();
            showAlert('Successfully updated release notes.', 'success');
        } else {
            showErrorState(data.error || 'Failed to fetch release notes.');
        }
    } catch (error) {
        showErrorState('Network error: Could not reach the server.');
        console.error(error);
    } finally {
        hideLoadingState();
    }
}

// Process and Flatten Feed Data
function processReleases(releases) {
    allUpdates = [];
    
    releases.forEach(release => {
        release.updates.forEach(update => {
            allUpdates.push({
                date: release.date,
                link: release.link,
                updated: release.updated,
                type: update.type,
                content: update.content,
                plainText: update.plain_text
            });
        });
    });

    updateStats();
}

// Update Dashboard Statistics
function updateStats() {
    const total = allUpdates.length;
    const features = allUpdates.filter(u => u.type === 'Feature').length;
    const breaking = allUpdates.filter(u => u.type === 'Breaking').length;
    const issues = allUpdates.filter(u => u.type === 'Issue').length;

    animateCount(statTotal, total);
    animateCount(statFeatures, features);
    animateCount(statBreaking, breaking);
    animateCount(statIssues, issues);
}

// Smooth Number Counter Animation
function animateCount(element, target) {
    let current = 0;
    const duration = 500; // ms
    const stepTime = 15;
    const steps = duration / stepTime;
    const increment = Math.ceil(target / steps);
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = current;
        }
    }, stepTime);
}

// Filter and Search Logic
function applyFilters() {
    let filtered = allUpdates;

    // Apply category filter
    if (activeTypeFilter !== 'all') {
        filtered = filtered.filter(u => u.type.toLowerCase() === activeTypeFilter.toLowerCase());
    }

    // Apply search query
    if (searchQuery) {
        filtered = filtered.filter(u => 
            u.plainText.toLowerCase().includes(searchQuery) ||
            u.date.toLowerCase().includes(searchQuery) ||
            u.type.toLowerCase().includes(searchQuery)
        );
    }

    currentlyFilteredUpdates = filtered;
    renderFeed(filtered);
}

// Render Feed Updates Grouped by Date
function renderFeed(updates) {
    feedContainer.innerHTML = '';

    if (updates.length === 0) {
        renderEmptyState();
        return;
    }

    // Group updates by date
    const groups = {};
    updates.forEach(update => {
        if (!groups[update.date]) {
            groups[update.date] = [];
        }
        groups[update.date].push(update);
    });

    // Render grouped dates
    for (const [date, dateUpdates] of Object.entries(groups)) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'date-group';

        // Date Divider
        const divider = document.createElement('div');
        divider.className = 'date-divider';
        divider.innerHTML = `
            <span class="date-divider-text">${date}</span>
            <div class="date-divider-line"></div>
        `;
        groupDiv.appendChild(divider);

        // Cards inside date group
        dateUpdates.forEach(update => {
            const card = document.createElement('div');
            card.className = 'update-card';

            const badgeClass = update.type.toLowerCase();
            const dateAnchor = update.link.split('#')[1] || '';

            card.innerHTML = `
                <div class="card-header">
                    <span class="type-badge ${badgeClass}">${update.type}</span>
                    <span class="card-date">${update.date}</span>
                </div>
                <div class="card-body">
                    ${update.content}
                </div>
                <div class="card-actions">
                    <a href="${update.link}" target="_blank" class="action-link" title="Open official documentation">
                        Docs
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                        </svg>
                    </a>
                    <button class="btn btn-secondary btn-sm" onclick="copyUpdate(${JSON.stringify(update.plainText).replace(/"/g, '&quot;')}, this)" title="Copy text to clipboard">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy
                    </button>
                    <button class="btn btn-twitter btn-sm" onclick="tweetUpdate('${update.date}', '${update.type}', ${JSON.stringify(update.plainText).replace(/"/g, '&quot;')}, '${update.link}')">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        Tweet
                    </button>
                </div>
            `;
            groupDiv.appendChild(card);
        });

        feedContainer.appendChild(groupDiv);
    }
}

// Tweet Intent Logic
function tweetUpdate(date, type, plainText, link) {
    const header = `BigQuery Update (${date}) - ${type}: `;
    const tags = ` #BigQuery #GCP`;
    
    // Max characters on X (Twitter) is 280.
    // X automatically treats URLs as 23 characters regardless of length.
    const urlLengthInTweet = 23;
    const linkOverhead = link ? urlLengthInTweet + 1 : 0; // +1 space
    const maxTextLen = 280 - header.length - tags.length - linkOverhead - 4; // -4 for quotes/ellipsis

    let text = plainText;
    if (text.length > maxTextLen) {
        text = text.substring(0, maxTextLen).strip() + "...";
    }

    const tweetText = `${header}"${text}"${tags}`;
    
    let twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    if (link) {
        twitterUrl += `&url=${encodeURIComponent(link)}`;
    }

    // Open Tweet Composer in center screen popup
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open(
        twitterUrl,
        'TweetComposer',
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
}

// Render Loading Shimmer Effect
function showLoadingState() {
    spinner.classList.add('spinning');
    btnRefresh.disabled = true;

    feedContainer.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
        const shimmerCard = document.createElement('div');
        shimmerCard.className = 'shimmer-card';
        shimmerCard.innerHTML = `
            <div class="shimmer-header">
                <div class="shimmer-item shimmer-badge"></div>
                <div class="shimmer-item shimmer-date"></div>
            </div>
            <div class="shimmer-item shimmer-title"></div>
            <div class="shimmer-item shimmer-text-1"></div>
            <div class="shimmer-item shimmer-text-2"></div>
            <div class="shimmer-item shimmer-text-3"></div>
        `;
        feedContainer.appendChild(shimmerCard);
    }
}

function hideLoadingState() {
    spinner.classList.remove('spinning');
    btnRefresh.disabled = false;
}

// Render Empty State Screen
function renderEmptyState() {
    feedContainer.innerHTML = `
        <div class="empty-state">
            <span class="empty-icon">
                <svg viewBox="0 0 24 24" width="48" height="48">
                    <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
            </span>
            <h3>No release notes found</h3>
            <p>Try resetting filters or adjusting your search keyword.</p>
        </div>
    `;
}

// Alert notifications
function showAlert(message, type) {
    alertBanner.textContent = message;
    alertBanner.className = `alert-banner ${type}`;
    
    // Auto-hide after 4 seconds
    setTimeout(hideAlert, 4000);
}

function hideAlert() {
    alertBanner.className = 'alert-banner hidden';
}

function showErrorState(message) {
    showAlert(message, 'error');
    if (allUpdates.length === 0) {
        feedContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon" style="color: var(--color-issue);">
                    <svg viewBox="0 0 24 24" width="48" height="48">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                </span>
                <h3>Failed to load feed</h3>
                <p>${message}</p>
                <button class="btn btn-primary" style="margin-top: 1rem;" onclick="loadReleases()">Try Again</button>
            </div>
        `;
    }
}

// Copy Update to Clipboard Function
function copyUpdate(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHTML = button.innerHTML;
        button.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Copied!
        `;
        button.classList.add('copied');
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showAlert('Failed to copy text to clipboard.', 'error');
    });
}

// Export Currently Filtered/Searched Updates to CSV
function exportToCSV() {
    if (currentlyFilteredUpdates.length === 0) {
        showAlert('No data available to export.', 'error');
        return;
    }
    
    const headers = ['Date', 'Category', 'Description', 'Link'];
    const rows = currentlyFilteredUpdates.map(u => [
        u.date,
        u.type,
        u.plainText,
        u.link
    ]);
    
    const escapeCSVField = (field) => {
        if (field === null || field === undefined) return '';
        let stringValue = String(field);
        stringValue = stringValue.replace(/"/g, '""');
        if (/[",\n\r]/.test(stringValue)) {
            return `"${stringValue}"`;
        }
        return stringValue;
    };
    
    const csvContent = [
        headers.map(escapeCSVField).join(','),
        ...rows.map(row => row.map(escapeCSVField).join(','))
    ].join('\r\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bigquery_release_notes_${activeTypeFilter}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('Successfully exported CSV.', 'success');
}

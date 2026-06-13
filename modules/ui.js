// ===== ClassLogger UI Module - FIXED FOR ORCHESTRATOR =====
// Handles all UI creation, updates, and interactions
// FIXED: Works with the clean orchestrator pattern

window.ClassLogger = window.ClassLogger || {};
console.log('🎨 UI Module: Loading...');
window.ClassLogger = window.ClassLogger || {};
console.log('🎨 UI Module: Namespace ready, defining UI...');
window.ClassLogger.UI = {
    // UI state
    isMinimized: false,
    currentTab: 'overview',

    // Trusted Types policy (Google Meet enforces Trusted Types CSP)
    _ttPolicy: null,
    getTrustedHTMLPolicy() {
        if (this._ttPolicy) return this._ttPolicy;
        try {
            if (window.trustedTypes && window.trustedTypes.createPolicy) {
                this._ttPolicy = window.trustedTypes.createPolicy('classlogger-ui', {
                    createHTML: (input) => input
                });
            }
        } catch (e) {
            console.warn('⚠️ UI: Could not create Trusted Types policy:', e);
        }
        return this._ttPolicy;
    },

    // Safely assign HTML to an element (handles Trusted Types CSP)
    setHTML(element, html) {
        const policy = this.getTrustedHTMLPolicy();
        if (policy) {
            element.innerHTML = policy.createHTML(html);
        } else {
            element.innerHTML = html;
        }
    },

    // Base widget container — wraps inner HTML, injects CSS, binds events
    createBaseWidget(innerHTML) {
        console.log('🧱 UI: Creating base widget container...');

        // Remove any existing widget
        const existing = document.getElementById('classlogger-widget');
        if (existing) existing.remove();

        // Inject styles
        if (typeof this.injectModernCSS === 'function') {
            this.injectModernCSS();
        }

        // Create container
        const widget = document.createElement('div');
        widget.id = 'classlogger-widget';
        widget.className = 'cl-widget';
        this.setHTML(widget, innerHTML);

        document.body.appendChild(widget);

        // Bind events after the DOM is in place
        if (typeof this.bindEvents === 'function') {
            try {
                this.bindEvents();
            } catch (e) {
                console.warn('⚠️ UI: bindEvents failed:', e);
            }
        }

        return widget;
    },

    // Create login prompt UI
    createLoginPrompt() {
        console.log('🔐 UI: Creating login prompt...');
        
        const loginHTML = `
            <div class="cl-login-prompt">
                <div class="cl-login-header">
                    <h3>🎓 ClassLogger</h3>
                    <p>Please log in to start tracking</p>
                </div>
                <div class="cl-login-content">
                    <p>Click the ClassLogger extension icon to enter your token</p>
                    <div class="cl-login-actions">
                        <button id="cl-refresh-auth" class="cl-btn cl-btn-primary">
                            🔄 Check Login
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return this.createBaseWidget(loginHTML);
    },

    // Create main widget UI
    // Create main widget UI
// Create main widget UI
createMainWidget(teacherInfo, enrollmentInfo) {
    console.log('🎨 UI: Creating main widget for:', teacherInfo?.name);
    
    const mainHTML = `
        <div class="cl-widget-header">
            <div class="cl-header-top">
                <div class="cl-header-left">
                    <h3>🎓 ClassLogger</h3>
                    <div class="cl-timer" id="cl-timer">
                        <span id="cl-duration">00:00</span>
                    </div>
                </div>
                <div class="cl-header-right">
                    <button id="cl-minimize-btn" class="cl-btn cl-btn-icon" title="Minimize to floating window">⧉</button>
                </div>
            </div>

            <div class="cl-teacher-info">
                Teacher: ${teacherInfo?.name || 'Teacher'}
            </div>

            <div class="cl-tabs">
                <button class="cl-tab-btn active" data-tab="overview">📊 Overview</button>
                <button class="cl-tab-btn" data-tab="notes">📝 Notes</button>
                <button class="cl-tab-btn" data-tab="tools">🛠️ Tools</button>
            </div>
        </div>

        <div class="cl-tab-content">
            <!-- Overview Tab -->
            <div id="cl-tab-overview" class="cl-tab-pane active">
                <div class="cl-main-controls">
                    <button id="cl-start-btn" class="cl-btn cl-btn-primary cl-btn-large" ${window.ClassLogger.currentClassId ? 'disabled' : ''}>
                        ${window.ClassLogger.currentClassId ? '✅ Started' : '🟢 Start Class'}
                    </button>
                    <button id="cl-end-btn" class="cl-btn cl-btn-danger cl-btn-large" ${window.ClassLogger.currentClassId ? '' : 'disabled'}>
                        🔴 End Class
                    </button>
                    <button id="cl-refresh-btn" class="cl-btn cl-btn-secondary">
                        🔄 Refresh
                    </button>
                </div>

                <div class="cl-status-section">
                    <div id="cl-status" class="cl-status">
                        Ready to start class
                    </div>

                    <div class="cl-class-details">
                        <div class="cl-detail-row">
                            <span class="cl-detail-label">👤 Student</span>
                            <span class="cl-detail-value">${enrollmentInfo?.student_name || '—'}</span>
                        </div>
                        <div class="cl-detail-row">
                            <span class="cl-detail-label">📚 Subject</span>
                            <span class="cl-detail-value">${enrollmentInfo?.subject || '—'}</span>
                        </div>
                        <div class="cl-detail-row">
                            <span class="cl-detail-label">🎓 Teacher</span>
                            <span class="cl-detail-value">${teacherInfo?.name || '—'}</span>
                        </div>
                        ${enrollmentInfo?.year_group ? `
                        <div class="cl-detail-row">
                            <span class="cl-detail-label">🏫 Year Group</span>
                            <span class="cl-detail-value">${enrollmentInfo.year_group}</span>
                        </div>` : ''}
                        <div class="cl-detail-row">
                            <span class="cl-detail-label">📸 Screenshots</span>
                            <span class="cl-detail-value" id="cl-screenshots">0</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Notes Tab -->
            <div id="cl-tab-notes" class="cl-tab-pane">
                <div class="cl-notes-controls">
                    <div class="cl-notes-tabs">
                        <button class="cl-notes-tab-btn active" data-tab="quick">Quick Notes</button>
                        <button class="cl-notes-tab-btn" data-tab="structured">Structured</button>
                    </div>
                </div>

                <div id="cl-notes-quick" class="cl-notes-pane active">
                    <textarea id="cl-quick-notes" placeholder="Add quick notes about the class..." rows="8"></textarea>
                    <div class="cl-notes-actions">
                        <button id="cl-save-notes" class="cl-btn cl-btn-primary">💾 Save Notes</button>
                        <span id="cl-notes-status" class="cl-notes-status">Auto-save enabled</span>
                    </div>
                </div>

                <div id="cl-notes-structured" class="cl-notes-pane">
                    <div class="cl-structured-notes">
                        <div class="cl-notes-field">
                            <label>📝 Topic 1:</label>
                            <input type="text" id="cl-topic1" placeholder="First main topic...">
                        </div>
                        <div class="cl-notes-field">
                            <label>📝 Topic 2:</label>
                            <input type="text" id="cl-topic2" placeholder="Second main topic...">
                        </div>
                        <div class="cl-notes-field">
                            <label>📝 Topic 3:</label>
                            <input type="text" id="cl-topic3" placeholder="Third main topic...">
                        </div>
                        <div class="cl-notes-field">
                            <label>📝 Topic 4:</label>
                            <input type="text" id="cl-topic4" placeholder="Fourth main topic...">
                        </div>
                        <div class="cl-notes-field">
                            <label>📝 Topic 5:</label>
                            <input type="text" id="cl-topic5" placeholder="Fifth main topic...">
                        </div>
                        <div class="cl-notes-field">
                            <label>📚 Homework:</label>
                            <textarea id="cl-homework" placeholder="Homework assignments..." rows="3"></textarea>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tools Tab -->
            <div id="cl-tab-tools" class="cl-tab-pane">
                <div class="cl-tools-section">
                    <h4>📸 Screenshots & Capture</h4>
                    
                    <div class="cl-capture-options">
                        <div class="cl-capture-type-selector">
                            <label>Capture Type:</label>
                            <select id="cl-capture-type" class="cl-select">
                                <option value="tab">📋 Current Tab</option>
                                <option value="desktop">🖥️ Full Desktop</option>
                                <option value="window">🪟 Select Window</option>
                                <option value="specific-tab">🎯 Specific Tab</option>
                            </select>
                        </div>
                        
                        <div class="cl-quality-selector">
                            <label>Quality:</label>
                            <select id="cl-capture-quality" class="cl-select">
                                <option value="70">Standard (70%)</option>
                                <option value="90" selected>High (90%)</option>
                                <option value="100">Maximum (100%)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="cl-screenshot-controls">
                        <button id="cl-screenshot-btn" class="cl-btn cl-btn-primary">
                            📸 Take Screenshot
                        </button>
                        <button id="cl-auto-screenshot-btn" class="cl-btn cl-btn-secondary" data-active="false">
                            🔄 Auto (Off)
                        </button>
                    </div>
                    
                    <div id="cl-tab-selector" class="cl-tab-selector" style="display: none;">
                        <label>Select Tab:</label>
                        <div class="cl-tab-selector-row">
                            <select id="cl-available-tabs" class="cl-select">
                                <option value="">Loading tabs...</option>
                            </select>
                            <button id="cl-refresh-tabs" class="cl-btn cl-btn-small">🔄</button>
                        </div>
                    </div>
                    
                    <div id="cl-screenshot-preview" class="cl-screenshot-preview" style="display: none;">
                        <img id="cl-screenshot-img" style="max-width: 100%; border-radius: 8px;">
                        <div class="cl-screenshot-info">
                            <span id="cl-screenshot-type">TAB</span> • 
                            <span id="cl-screenshot-size">0KB</span> • 
                            <span id="cl-screenshot-time">00:00</span>
                        </div>
                    </div>
                </div>

                <div class="cl-tools-section">
                    <h4>📎 Attach Resources</h4>
                    <div id="cl-resource-drop" class="cl-dropzone">
                        <div class="cl-dropzone-icon">🖼️</div>
                        <div class="cl-dropzone-text">Drop images / files here<br><span>or click to browse</span></div>
                        <input type="file" id="cl-resource-input" accept="image/*,application/pdf" multiple style="display:none;">
                    </div>

                    <div class="cl-link-row">
                        <input type="url" id="cl-link-input" class="cl-link-input" placeholder="🔗 Paste a link and press Add">
                        <button id="cl-link-add" class="cl-btn cl-btn-primary cl-btn-small">Add</button>
                    </div>

                    <div id="cl-resource-list" class="cl-resource-list"></div>
                </div>
            </div>
        </div>
    `;
    
    return this.createBaseWidget(mainHTML);
},  

// ADD this new method to your UI object (add it anywhere in the UI object):
// REPLACE the injectModernCSS method in your ui.js with this COMPLETE version:

injectModernCSS() {
    // Remove existing styles
    const existingStyles = document.getElementById('classlogger-modern-styles');
    if (existingStyles) {
        existingStyles.remove();
    }

    // Create and inject new styles
    const styleElement = document.createElement('style');
    styleElement.id = 'classlogger-modern-styles';
    styleElement.textContent = `
        /* ===== ClassLogger Complete Modern CSS ===== */

        
        #classlogger-widget {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            width: 340px !important;
            max-height: 85vh !important;
            
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.25) 0%, 
                rgba(255, 255, 255, 0.1) 100%) !important;
            backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 20px !important;
            
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.1),
                0 2px 16px rgba(0, 0, 0, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
            
            z-index: 999999 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            color: #1f2937 !important;
            
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
            transform: translateZ(0) !important;
            overflow: hidden !important;
        }

        #classlogger-widget.minimized {
            height: 60px !important;
            max-height: 60px !important;
        }

        .cl-widget-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            padding: 16px 20px !important;
            border-radius: 20px 20px 0 0 !important;
            color: white !important;
            position: relative !important;
        }

        .cl-header-top {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-bottom: 12px !important;
        }

        .cl-header-left h3 {
            margin: 0 !important;
            font-size: 18px !important;
            font-weight: 700 !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
        }

        .cl-timer {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            background: rgba(255, 255, 255, 0.2) !important;
            padding: 6px 12px !important;
            border-radius: 20px !important;
            margin-top: 4px !important;
        }

        #cl-duration {
            font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace !important;
            font-size: 16px !important;
        }

        #cl-minimize-btn {
            background: rgba(255, 255, 255, 0.2) !important;
            border: none !important;
            color: white !important;
            width: 32px !important;
            height: 32px !important;
            border-radius: 50% !important;
            font-size: 18px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }

        #cl-minimize-btn:hover {
            background: rgba(255, 255, 255, 0.3) !important;
            transform: scale(1.1) !important;
        }

        .cl-capture-options {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
            padding: 12px !important;
            background: rgba(255, 255, 255, 0.7) !important;
            border-radius: 8px !important;
            border: 1px solid #e5e7eb !important;
        }

        .cl-capture-type-selector,
        .cl-quality-selector {
            display: flex !important;
            flex-direction: column !important;
            gap: 4px !important;
        }

        .cl-capture-type-selector label,
        .cl-quality-selector label {
            font-size: 11px !important;
            font-weight: 600 !important;
            color: #374151 !important;
            margin: 0 !important;
        }

        .cl-select {
            background: white !important;
            border: 1px solid #d1d5db !important;
            border-radius: 6px !important;
            padding: 6px 8px !important;
            font-size: 12px !important;
            color: #374151 !important;
            cursor: pointer !important;
            transition: border-color 0.2s ease !important;
            width: 100% !important;
            box-sizing: border-box !important;
        }

        .cl-select:focus {
            outline: none !important;
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }

        .cl-select:hover {
            border-color: #9ca3af !important;
        }

        /* TAB SELECTOR */
        .cl-tab-selector {
            margin-top: 12px !important;
            padding: 12px !important;
            background: rgba(254, 243, 199, 0.5) !important;
            border-radius: 8px !important;
            border: 1px solid #fbbf24 !important;
        }

        .cl-tab-selector label {
            font-size: 11px !important;
            font-weight: 600 !important;
            color: #92400e !important;
            margin: 0 0 6px 0 !important;
            display: block !important;
        }

        .cl-tab-selector-row {
            display: flex !important;
            gap: 8px !important;
            align-items: center !important;
        }

        .cl-btn-small {
            padding: 6px 10px !important;
            font-size: 11px !important;
            min-width: 32px !important;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
            color: white !important;
            border: none !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
        }

        .cl-btn-small:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3) !important;
        }

        /* ENHANCED SCREENSHOT PREVIEW */
        .cl-screenshot-info {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 8px !important;
            margin-top: 8px !important;
            font-size: 10px !important;
            color: #6b7280 !important;
            background: rgba(0, 0, 0, 0.05) !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
        }

        #cl-screenshot-type {
            background: #3b82f6 !important;
            color: white !important;
            padding: 2px 6px !important;
            border-radius: 3px !important;
            font-weight: 600 !important;
            font-size: 9px !important;
        }

        #cl-screenshot-size {
            font-weight: 600 !important;
        }

        #cl-screenshot-time {
            font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace !important;
        }

        /* RESPONSIVE ADJUSTMENTS */
        @media (max-width: 480px) {
            .cl-capture-options {
                gap: 8px !important;
                padding: 8px !important;
            }
            
            .cl-tab-selector-row {
                flex-direction: column !important;
                gap: 6px !important;
            }
            
            .cl-btn-small {
                width: 100% !important;
            }
        }

        .cl-teacher-info {
            font-size: 13px !important;
            opacity: 0.9 !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
        }

        .cl-enrollment-info {
            background: rgba(255, 255, 255, 0.2) !important;
            padding: 2px 8px !important;
            border-radius: 10px !important;
            font-size: 11px !important;
        }

        .cl-tabs {
            display: flex !important;
            background: rgba(255, 255, 255, 0.1) !important;
            border-radius: 10px !important;
            padding: 4px !important;
            margin-top: 12px !important;
            gap: 2px !important;
        }

        .cl-tab-btn {
            flex: 1 !important;
            background: transparent !important;
            border: none !important;
            color: rgba(255, 255, 255, 0.8) !important;
            padding: 8px 12px !important;
            border-radius: 8px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            text-align: center !important;
        }

        .cl-tab-btn.active {
            background: rgba(255, 255, 255, 0.25) !important;
            color: white !important;
        }

        .cl-tab-btn:hover:not(.active) {
            background: rgba(255, 255, 255, 0.15) !important;
            color: white !important;
        }

        .cl-tab-content {
            background: rgba(255, 255, 255, 0.95) !important;
            border-radius: 0 0 20px 20px !important;
            max-height: calc(85vh - 140px) !important;
            overflow-y: auto !important;
        }

        .cl-tab-pane {
            display: none !important;
            padding: 20px !important;
        }

        .cl-tab-pane.active {
            display: block !important;
            animation: fadeInUp 0.3s ease !important;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0 !important;
                transform: translateY(10px) !important;
            }
            to {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        }

        .cl-main-controls {
            display: flex !important;
            gap: 8px !important;
            margin-bottom: 20px !important;
        }

        .cl-btn {
            border: none !important;
            border-radius: 12px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            font-size: 13px !important;
            position: relative !important;
            overflow: hidden !important;
        }

        .cl-btn-large {
            padding: 12px 20px !important;
            font-size: 14px !important;
            flex: 1 !important;
        }

        .cl-btn-primary {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
            color: white !important;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3) !important;
        }

        .cl-btn-primary:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4) !important;
        }

        .cl-btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
            color: white !important;
            box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3) !important;
        }

        .cl-btn-danger:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4) !important;
        }

        .cl-btn:disabled {
            opacity: 0.55 !important;
            cursor: default !important;
            transform: none !important;
            box-shadow: none !important;
            filter: grayscale(0.2) !important;
        }
        .cl-btn:disabled:hover {
            transform: none !important;
            box-shadow: none !important;
        }

        .cl-btn-secondary {
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
            color: white !important;
            padding: 10px 16px !important;
        }

        .cl-status-section {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
            border-radius: 12px !important;
            padding: 16px !important;
            margin-bottom: 16px !important;
        }

        .cl-status {
            text-align: center !important;
            padding: 12px !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            margin-bottom: 16px !important;
        }

        .cl-status.cl-ongoing {
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%) !important;
            color: #166534 !important;
            border: 1px solid #22c55e !important;
        }

        .cl-status.cl-completed {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important;
            color: #1e40af !important;
            border: 1px solid #3b82f6 !important;
        }

        .cl-status.cl-error {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%) !important;
            color: #dc2626 !important;
            border: 1px solid #ef4444 !important;
        }

        .cl-stats-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
        }

        .cl-stat {
            background: white !important;
            padding: 12px !important;
            border-radius: 8px !important;
            text-align: center !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            transition: transform 0.2s ease !important;
        }

        .cl-stat:hover {
            transform: translateY(-1px) !important;
        }

        .cl-stat-label {
            display: block !important;
            font-size: 11px !important;
            color: #6b7280 !important;
            margin-bottom: 4px !important;
            font-weight: 500 !important;
        }

        /* NOTES SECTION - FIXED STYLING */
        .cl-notes-controls {
            margin-bottom: 16px !important;
        }

        .cl-notes-tabs {
            display: flex !important;
            background: #f1f5f9 !important;
            border-radius: 8px !important;
            padding: 2px !important;
            gap: 2px !important;
        }

        .cl-notes-tab-btn {
            flex: 1 !important;
            background: transparent !important;
            border: none !important;
            padding: 8px 12px !important;
            border-radius: 6px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            color: #64748b !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
        }

        .cl-notes-tab-btn.active {
            background: white !important;
            color: #1e293b !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }

        .cl-notes-pane {
            display: none !important;
        }

        .cl-notes-pane.active {
            display: block !important;
            animation: fadeInUp 0.3s ease !important;
        }

        #cl-quick-notes {
            width: 100% !important;
            border: 2px solid #e2e8f0 !important;
            border-radius: 8px !important;
            padding: 12px !important;
            font-size: 14px !important;
            resize: vertical !important;
            min-height: 100px !important;
            transition: border-color 0.2s ease !important;
            font-family: inherit !important;
            background: white !important;
            box-sizing: border-box !important;
        }

        #cl-quick-notes:focus {
            outline: none !important;
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }

        /* STRUCTURED NOTES - FIXED */
        .cl-structured-notes {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
        }

        .cl-notes-field {
            display: flex !important;
            flex-direction: column !important;
            gap: 4px !important;
        }

        .cl-notes-field label {
            font-size: 12px !important;
            font-weight: 600 !important;
            color: #374151 !important;
            margin: 0 !important;
        }

        .cl-notes-field input,
        .cl-notes-field textarea {
            border: 2px solid #e5e7eb !important;
            border-radius: 6px !important;
            padding: 8px 12px !important;
            font-size: 13px !important;
            transition: border-color 0.2s ease !important;
            background: white !important;
            font-family: inherit !important;
            box-sizing: border-box !important;
            width: 100% !important;
        }

        .cl-notes-field input:focus,
        .cl-notes-field textarea:focus {
            outline: none !important;
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }

        /* NOTES ACTIONS - FIXED */
        .cl-notes-actions {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            margin-top: 16px !important;
            padding-top: 16px !important;
            border-top: 1px solid #e5e7eb !important;
        }

        .cl-notes-status {
            font-size: 11px !important;
            color: #6b7280 !important;
            font-style: italic !important;
        }

        #cl-save-notes {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
            color: white !important;
            border: none !important;
            padding: 8px 16px !important;
            border-radius: 6px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
        }

        #cl-save-notes:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3) !important;
        }

        /* TOOLS SECTION - FIXED */
        .cl-tools-section {
            margin-bottom: 20px !important;
            padding: 16px !important;
            background: linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%) !important;
            border-radius: 8px !important;
        }

        .cl-tools-section h4 {
            margin: 0 0 12px 0 !important;
            font-size: 14px !important;
            color: #374151 !important;
            font-weight: 600 !important;
        }

        .cl-screenshot-controls {
            display: flex !important;
            gap: 8px !important;
            margin-bottom: 12px !important;
        }

        .cl-screenshot-controls .cl-btn {
            font-size: 12px !important;
            padding: 8px 12px !important;
        }

        .cl-screenshot-preview {
            border-radius: 8px !important;
            overflow: hidden !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
            margin-top: 8px !important;
        }

        /* ANALYTICS SECTION - FIXED */
        .cl-analytics-info {
            text-align: center !important;
        }

        .cl-analytics-info p {
            font-size: 13px !important;
            color: #6b7280 !important;
            margin: 0 0 12px 0 !important;
        }

        .cl-analytics-stats {
            display: flex !important;
            flex-direction: column !important;
            gap: 6px !important;
            font-size: 12px !important;
        }

        .cl-analytics-stats > div {
            background: white !important;
            padding: 8px 12px !important;
            border-radius: 6px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }

        /* SCROLLBAR STYLING */
        .cl-tab-content::-webkit-scrollbar {
            width: 6px !important;
        }

        .cl-tab-content::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05) !important;
            border-radius: 3px !important;
        }

        .cl-tab-content::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2) !important;
            border-radius: 3px !important;
        }

        .cl-tab-content::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.3) !important;
        }

        /* CLASS DETAILS */
        .cl-class-details {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            margin-top: 12px !important;
        }
        .cl-detail-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 8px 12px !important;
            background: #f8fafc !important;
            border: 1px solid #eef2f7 !important;
            border-radius: 8px !important;
        }
        .cl-detail-label {
            font-size: 13px !important;
            color: #64748b !important;
            font-weight: 600 !important;
        }
        .cl-detail-value {
            font-size: 13px !important;
            color: #1e293b !important;
            font-weight: 700 !important;
            text-align: right !important;
            max-width: 60% !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
        }

        /* DROP ZONE */
        .cl-dropzone {
            border: 2px dashed #c7d2fe !important;
            border-radius: 12px !important;
            padding: 18px 12px !important;
            text-align: center !important;
            cursor: pointer !important;
            background: #f5f7ff !important;
            transition: all 0.2s !important;
            margin-bottom: 10px !important;
        }
        .cl-dropzone:hover, .cl-dropzone-active {
            border-color: #6366f1 !important;
            background: #eef2ff !important;
        }
        .cl-dropzone-icon { font-size: 26px !important; }
        .cl-dropzone-text {
            font-size: 13px !important; color: #475569 !important; margin-top: 6px !important; font-weight: 600 !important;
        }
        .cl-dropzone-text span { font-size: 11px !important; color: #94a3b8 !important; font-weight: 500 !important; }

        .cl-link-row { display: flex !important; gap: 6px !important; margin-bottom: 10px !important; }
        .cl-link-input {
            flex: 1 !important; padding: 9px 12px !important; border: 1px solid #e2e8f0 !important;
            border-radius: 8px !important; font-size: 13px !important; outline: none !important;
        }
        .cl-link-input:focus { border-color: #6366f1 !important; }

        .cl-resource-list { display: flex !important; flex-direction: column !important; gap: 6px !important; }
        .cl-resource-chip {
            padding: 8px 12px !important; background: #f1f5f9 !important; border-radius: 8px !important;
            font-size: 12px !important; color: #334155 !important; font-weight: 600 !important;
            overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important;
        }

        /* MOBILE RESPONSIVENESS */
        @media (max-width: 480px) {
            #classlogger-widget {
                width: calc(100vw - 40px) !important;
                right: 20px !important;
                left: 20px !important;
            }
            
            .cl-stats-grid {
                grid-template-columns: 1fr !important;
            }
            
            .cl-main-controls {
                flex-direction: column !important;
            }
        }
    `;
    
    document.head.appendChild(styleElement);
    console.log('✨ Complete modern CSS styles injected');
},
    // Bind all UI events - Clean version
    bindEvents() {
        console.log('🔗 UI: Binding events...');
        
        // Main controls
        const startBtn = document.getElementById('cl-start-btn');
        const endBtn = document.getElementById('cl-end-btn');
        const minimizeBtn = document.getElementById('cl-minimize-btn');
        const refreshBtn = document.getElementById('cl-refresh-btn');

        if (startBtn) startBtn.onclick = () => this.handleStartClass();
        if (endBtn) endBtn.onclick = () => this.handleEndClass();
        // Minimize now collapses into the floating (PiP) window
        if (minimizeBtn) minimizeBtn.onclick = () => this.minimizeToPiP();
        if (refreshBtn) refreshBtn.onclick = () => this.handleRefresh();

        // Resource drop zone + link attach
        this.setupResourceZone();

        // Screenshot controls - Delegate to Screenshots module
        const screenshotBtn = document.getElementById('cl-screenshot-btn');
        const autoScreenshotBtn = document.getElementById('cl-auto-screenshot-btn');
        const captureTypeSelect = document.getElementById('cl-capture-type');
        const refreshTabsBtn = document.getElementById('cl-refresh-tabs');

        if (screenshotBtn) {
            screenshotBtn.onclick = () => window.ClassLogger.Screenshots?.takeScreenshot();
        }
        if (autoScreenshotBtn) {
            autoScreenshotBtn.onclick = () => this.toggleAutoScreenshots();
        }
        if (captureTypeSelect) {
            captureTypeSelect.onchange = () => window.ClassLogger.Screenshots?.handleCaptureTypeChange();
        }
        if (refreshTabsBtn) {
            refreshTabsBtn.onclick = () => window.ClassLogger.Screenshots?.loadAvailableTabs();
        }

        // Tab switching
        const tabButtons = document.querySelectorAll('.cl-tab-btn');
        tabButtons.forEach(btn => {
            btn.onclick = () => this.switchTab(btn.dataset.tab);
        });

        // Notes tab switching
        const notesTabButtons = document.querySelectorAll('.cl-notes-tab-btn');
        notesTabButtons.forEach(btn => {
            btn.onclick = () => this.switchNotesTab(btn.dataset.tab);
        });

        // Initialize modules
        if (window.ClassLogger.Screenshots?.init) {
            window.ClassLogger.Screenshots.init();
        }
        if (window.ClassLogger.Notes?.bindNotesEvents) {
            window.ClassLogger.Notes.bindNotesEvents();
        }

        // Auth refresh button
        const refreshAuthBtn = document.getElementById('cl-refresh-auth');
        if (refreshAuthBtn) {
            refreshAuthBtn.onclick = () => this.handleAuthRefresh();
        }
    },

    // FIXED: Handle start class button - Works with orchestrator
    async handleStartClass() {
        console.log('▶️ UI: Start class button clicked');
        
        const startBtn = document.getElementById('cl-start-btn');
        const endBtn = document.getElementById('cl-end-btn');
        
        if (startBtn) {
            startBtn.textContent = '⏳ Starting...';
            startBtn.disabled = true;
        }

        try {
            // FIXED: Call orchestrator.startClass() which exists in your content-script.js
            if (window.ClassLogger.orchestrator && typeof window.ClassLogger.orchestrator.startClass === 'function') {
                console.log('🎯 UI: Delegating to orchestrator.startClass()');

                const result = await window.ClassLogger.orchestrator.startClass();

                if (result && result.success) {
                    // Success - Start stays "✅ Started" (disabled) for the whole class;
                    // End Class becomes the active button.
                    if (startBtn) {
                        startBtn.textContent = '✅ Started';
                        startBtn.disabled = true;
                    }
                    if (endBtn) {
                        endBtn.textContent = '🔴 End Class';
                        endBtn.disabled = false;
                    }
                    this.updateStatus('Class started successfully', 'ongoing');
                    console.log('✅ UI: Class started successfully');
                } else {
                    // Failure - Reset button
                    const errorMsg = result?.error || 'Unknown error';
                    if (startBtn) {
                        startBtn.textContent = '🟢 Start Class';
                        startBtn.disabled = false;
                    }
                    this.updateStatus('Failed to start class: ' + errorMsg, 'error');
                    console.error('❌ UI: Start class failed:', errorMsg);
                }
            } else {
                throw new Error('Orchestrator startClass method not available');
            }
            
        } catch (error) {
            console.error('❌ UI: Start class error:', error);
            
            // Reset button on error
            if (startBtn) {
                startBtn.textContent = '🟢 Start Class';
                startBtn.disabled = false;
            }
            this.updateStatus('Error: Failed to start class', 'error');
        }
    },

    // FIXED: Handle end class button - Works with orchestrator
    async handleEndClass() {
        console.log('⏹️ UI: End class button clicked');
        
        const endBtn = document.getElementById('cl-end-btn');
        const startBtn = document.getElementById('cl-start-btn');
        
        if (endBtn) {
            endBtn.textContent = '⏳ Ending...';
            endBtn.disabled = true;
        }

        try {
            // FIXED: Call orchestrator.endClass() which exists in your content-script.js
            if (window.ClassLogger.orchestrator && typeof window.ClassLogger.orchestrator.endClass === 'function') {
                console.log('🎯 UI: Delegating to orchestrator.endClass()');

                const result = await window.ClassLogger.orchestrator.endClass();

                if (result && result.success) {
                    // Success - briefly show "Ended", then reset to the initial state
                    if (endBtn) endBtn.textContent = '✅ Ended';
                    this.updateStatus('Class ended successfully', 'completed');
                    setTimeout(() => {
                        if (endBtn) {
                            endBtn.textContent = '🔴 End Class';
                            endBtn.disabled = true;
                        }
                        if (startBtn) {
                            startBtn.textContent = '🟢 Start Class';
                            startBtn.disabled = false;
                        }
                    }, 900);
                    console.log('✅ UI: Class ended successfully');
                } else {
                    // Failure - Reset button
                    const errorMsg = result?.error || 'Unknown error';
                    if (endBtn) {
                        endBtn.textContent = '🔴 End Class';
                        endBtn.disabled = false;
                    }
                    this.updateStatus('Failed to end class: ' + errorMsg, 'error');
                    console.error('❌ UI: End class failed:', errorMsg);
                }
            } else {
                throw new Error('Orchestrator endClass method not available');
            }
            
        } catch (error) {
            console.error('❌ UI: End class error:', error);
            
            // Reset button on error
            if (endBtn) {
                endBtn.textContent = '🔴 End Class';
                endBtn.disabled = false;
            }
            this.updateStatus('Error: Failed to end class', 'error');
        }
    },

    // Handle refresh button
    async handleRefresh() {
        console.log('🔄 UI: Refresh button clicked');
        window.location.reload();
    },

    // Handle auth refresh
    async handleAuthRefresh() {
        console.log('🔄 UI: Auth refresh clicked');
        
        if (window.ClassLogger.Auth?.checkAuthStatus) {
            const authResult = await window.ClassLogger.Auth.checkAuthStatus();
            if (authResult?.isLoggedIn) {
                window.location.reload();
            }
        }
    },

    // Update class state (called by orchestrator)
    updateClassState(state) {
        console.log('🔄 UI: Updating class state to:', state);
        
        const startBtn = document.getElementById('cl-start-btn');
        const endBtn = document.getElementById('cl-end-btn');
        
        if (state === 'in_progress') {
            if (startBtn) startBtn.style.display = 'none';
            if (endBtn) endBtn.style.display = 'inline-block';
            this.updateStatus('Class in progress', 'ongoing');
        } else if (state === 'completed') {
            if (endBtn) endBtn.style.display = 'none';
            if (startBtn) {
                startBtn.style.display = 'inline-block';
                startBtn.textContent = '🟢 Start Class';
                startBtn.disabled = false;
            }
            this.updateStatus('Class completed', 'completed');
        }
    },

    // ===== Class lifecycle UI states =====

    // Show a transient loading message + disable buttons
    showLoadingState(message) {
        const startBtn = document.getElementById('cl-start-btn');
        const endBtn = document.getElementById('cl-end-btn');
        if (startBtn) startBtn.disabled = true;
        if (endBtn) endBtn.disabled = true;
        this.updateStatus(message || 'Working...', 'warning');
    },

    // Class is now running
    showOngoingState() {
        const startBtn = document.getElementById('cl-start-btn');
        const endBtn = document.getElementById('cl-end-btn');
        if (startBtn) { startBtn.style.display = 'none'; startBtn.disabled = false; }
        if (endBtn) { endBtn.style.display = 'inline-block'; endBtn.disabled = false; }
        this.updateStatus('Class in progress', 'ongoing');
    },

    // Back to the ready-to-start state
    showStartState() {
        const startBtn = document.getElementById('cl-start-btn');
        const endBtn = document.getElementById('cl-end-btn');
        if (startBtn) { startBtn.style.display = 'inline-block'; startBtn.disabled = false; }
        if (endBtn) { endBtn.style.display = 'none'; endBtn.disabled = false; }
        this.updateStatus('Ready to start class', '');
    },

    // Show an error message and re-enable buttons
    showErrorState(message) {
        const startBtn = document.getElementById('cl-start-btn');
        const endBtn = document.getElementById('cl-end-btn');
        if (startBtn) startBtn.disabled = false;
        if (endBtn) endBtn.disabled = false;
        this.updateStatus(message || 'Something went wrong', 'error');
    },

    // Floating toast notification
    showNotification(message, type = 'info') {
        try {
            const toast = document.createElement('div');
            const colors = {
                success: '#10b981',
                error: '#ef4444',
                warning: '#f59e0b',
                info: '#6366f1'
            };
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed; bottom: 24px; right: 24px;
                background: ${colors[type] || colors.info}; color: #fff;
                padding: 12px 18px; border-radius: 10px; z-index: 2147483647;
                font-family: system-ui, sans-serif; font-size: 14px; font-weight: 600;
                box-shadow: 0 8px 24px rgba(0,0,0,0.25); max-width: 320px;
                opacity: 0; transition: opacity 0.25s ease, transform 0.25s ease;
                transform: translateY(10px);
            `;
            document.body.appendChild(toast);
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px)';
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        } catch (e) {
            console.log('🔔 Notification:', message);
        }
    },

    // ===== Floating pop-out screenshot widget (Document Picture-in-Picture) =====
    // Persists on top across tab switches, just like the Google Meet mini window.
    _pipWindow: null,
    _pipTimer: null,

    // Minimize the main widget into the slim floating window
    async minimizeToPiP() {
        const opened = await this.openScreenshotPiP();
        if (opened) {
            const widget = document.getElementById('classlogger-widget');
            if (widget) widget.style.display = 'none';
        }
    },

    async openScreenshotPiP() {
        try {
            if (!('documentPictureInPicture' in window)) {
                this.showNotification('Floating window needs Chrome 116+', 'warning');
                return false;
            }

            // Re-focus if already open
            if (this._pipWindow && !this._pipWindow.closed) {
                this._pipWindow.focus();
                return true;
            }

            // Slim bar: just timer + a screenshot icon button
            const pip = await window.documentPictureInPicture.requestWindow({
                width: 220,
                height: 70
            });
            this._pipWindow = pip;

            const style = pip.document.createElement('style');
            style.textContent = `
                * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
                body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; height: 100vh; overflow: hidden; }
                .pip-bar { display: flex; align-items: center; gap: 10px; height: 100vh; padding: 0 12px; }
                .pip-logo { font-size: 18px; }
                .pip-timer { font-variant-numeric: tabular-nums; font-size: 20px; font-weight: 700; letter-spacing: 1px; flex: 1; }
                .pip-shot { width: 44px; height: 44px; border: none; border-radius: 12px; background: #10b981; color: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.1s, background 0.2s; }
                .pip-shot:hover { background: #059669; }
                .pip-shot:active { transform: scale(0.92); }
                .pip-shot:disabled { opacity: 0.6; cursor: default; }
            `;
            pip.document.head.appendChild(style);

            const bar = pip.document.createElement('div');
            bar.className = 'pip-bar';
            bar.innerHTML = `
                <span class="pip-logo">🎓</span>
                <span class="pip-timer" id="pip-timer">00:00</span>
                <button class="pip-shot" id="pip-shot" title="Take screenshot">📸</button>
            `;
            pip.document.body.appendChild(bar);

            const shotBtn = pip.document.getElementById('pip-shot');
            shotBtn.addEventListener('click', async () => {
                shotBtn.disabled = true;
                shotBtn.textContent = '⏳';
                try {
                    const res = await window.ClassLogger.Screenshots.takeScreenshot();
                    shotBtn.textContent = res?.success ? '✅' : '❌';
                } catch (e) {
                    shotBtn.textContent = '❌';
                }
                setTimeout(() => { shotBtn.textContent = '📸'; shotBtn.disabled = false; }, 1200);
            });

            // Keep the PiP timer in sync with the main widget
            const timerEl = pip.document.getElementById('pip-timer');
            this._pipTimer = setInterval(() => {
                const src = document.getElementById('cl-duration');
                if (timerEl && src) timerEl.textContent = src.textContent;
            }, 1000);

            // When the floating window closes, restore the main widget
            pip.addEventListener('pagehide', () => {
                if (this._pipTimer) clearInterval(this._pipTimer);
                this._pipWindow = null;
                const widget = document.getElementById('classlogger-widget');
                if (widget) widget.style.display = '';
            });

            return true;
        } catch (e) {
            console.error('❌ PiP error:', e);
            this.showNotification('Could not open floating window', 'error');
            return false;
        }
    },

    // ===== Resource drop zone + link attach =====
    setupResourceZone() {
        const drop = document.getElementById('cl-resource-drop');
        const input = document.getElementById('cl-resource-input');
        const linkInput = document.getElementById('cl-link-input');
        const linkAdd = document.getElementById('cl-link-add');

        if (drop && input) {
            drop.onclick = () => input.click();
            input.onchange = (e) => this.handleResourceFiles(e.target.files);

            ['dragover', 'dragenter'].forEach(evt =>
                drop.addEventListener(evt, (e) => { e.preventDefault(); drop.classList.add('cl-dropzone-active'); }));
            ['dragleave', 'dragend'].forEach(evt =>
                drop.addEventListener(evt, () => drop.classList.remove('cl-dropzone-active')));
            drop.addEventListener('drop', (e) => {
                e.preventDefault();
                drop.classList.remove('cl-dropzone-active');
                if (e.dataTransfer?.files?.length) {
                    this.handleResourceFiles(e.dataTransfer.files);
                } else {
                    const url = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text/plain');
                    if (url) this.saveLink(url);
                }
            });
        }

        if (linkAdd && linkInput) {
            linkAdd.onclick = () => {
                const url = linkInput.value.trim();
                if (url) { this.saveLink(url); linkInput.value = ''; }
            };
            linkInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { linkAdd.click(); }
            });
        }
    },

    async handleResourceFiles(fileList) {
        const classId = window.ClassLogger.currentClassId;
        if (!classId) {
            this.showNotification('Start the class first to attach resources', 'warning');
            return;
        }
        for (const file of Array.from(fileList)) {
            try {
                const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                this.addResourceChip(file.name, 'uploading');
                const res = await window.ClassLogger.API.sendMessage({
                    action: 'saveResource',
                    class_log_id: classId,
                    type: 'file',
                    file_data: dataUrl,
                    name: file.name
                });
                this.updateResourceChip(file.name, res?.success ? 'done' : 'error', res?.resource?.url);
                this.showNotification(res?.success ? `Attached ${file.name}` : `Failed: ${file.name}`, res?.success ? 'success' : 'error');
            } catch (e) {
                this.showNotification(`Could not attach ${file.name}`, 'error');
            }
        }
    },

    async saveLink(url) {
        const classId = window.ClassLogger.currentClassId;
        if (!classId) {
            this.showNotification('Start the class first to attach links', 'warning');
            return;
        }
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        this.addResourceChip(url, 'uploading');
        const res = await window.ClassLogger.API.sendMessage({
            action: 'saveResource',
            class_log_id: classId,
            type: 'link',
            url: url,
            name: url
        });
        this.updateResourceChip(url, res?.success ? 'done' : 'error', url);
        this.showNotification(res?.success ? 'Link attached' : 'Failed to attach link', res?.success ? 'success' : 'error');
    },

    addResourceChip(label, state) {
        const list = document.getElementById('cl-resource-list');
        if (!list) return;
        const id = 'res-' + btoa(unescape(encodeURIComponent(label))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
        let chip = document.getElementById(id);
        if (!chip) {
            chip = document.createElement('div');
            chip.id = id;
            chip.className = 'cl-resource-chip';
            list.appendChild(chip);
        }
        const short = label.length > 28 ? label.slice(0, 25) + '…' : label;
        chip.innerHTML = `<span>${state === 'uploading' ? '⏳' : '📎'} ${short}</span>`;
    },

    updateResourceChip(label, state, url) {
        const id = 'res-' + btoa(unescape(encodeURIComponent(label))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
        const chip = document.getElementById(id);
        if (!chip) return;
        const short = label.length > 28 ? label.slice(0, 25) + '…' : label;
        const icon = state === 'done' ? '✅' : state === 'error' ? '❌' : '📎';
        chip.innerHTML = url && state === 'done'
            ? `<a href="${url}" target="_blank" style="color:inherit;text-decoration:none;">${icon} ${short}</a>`
            : `<span>${icon} ${short}</span>`;
    },

    // Toggle minimize
    toggleMinimize() {
        const widget = document.getElementById('classlogger-widget');
        if (!widget) return;

        this.isMinimized = !this.isMinimized;
        
        if (this.isMinimized) {
            widget.style.height = '60px';
            widget.style.overflow = 'hidden';
            const minimizeBtn = document.getElementById('cl-minimize-btn');
            if (minimizeBtn) minimizeBtn.textContent = '+';
        } else {
            widget.style.height = 'auto';
            widget.style.overflow = 'visible';
            const minimizeBtn = document.getElementById('cl-minimize-btn');
            if (minimizeBtn) minimizeBtn.textContent = '−';
        }
    },

    // Switch tabs
    switchTab(tabName) {
        // Remove active from all tabs
        document.querySelectorAll('.cl-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.cl-tab-pane').forEach(pane => pane.classList.remove('active'));

        // Add active to current tab
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const tabPane = document.getElementById(`cl-tab-${tabName}`);

        if (tabBtn) tabBtn.classList.add('active');
        if (tabPane) tabPane.classList.add('active');

        this.currentTab = tabName;
    },

    // Switch notes tabs
    switchNotesTab(tabName) {
        // Remove active from all notes tabs
        document.querySelectorAll('.cl-notes-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.cl-notes-pane').forEach(pane => pane.classList.remove('active'));

        // Add active to current notes tab
        const tabBtn = document.querySelector(`.cl-notes-tab-btn[data-tab="${tabName}"]`);
        const tabPane = document.getElementById(`cl-notes-${tabName}`);

        if (tabBtn) tabBtn.classList.add('active');
        if (tabPane) tabPane.classList.add('active');
    },

    // Toggle auto screenshots
    toggleAutoScreenshots() {
        const autoBtn = document.getElementById('cl-auto-screenshot-btn');
        if (!autoBtn) return;

        const isActive = autoBtn.dataset.active === 'true';
        
        if (isActive && window.ClassLogger.Screenshots?.stopAutoScreenshots) {
            window.ClassLogger.Screenshots.stopAutoScreenshots();
        } else if (!isActive && window.ClassLogger.Screenshots?.startAutoScreenshots) {
            window.ClassLogger.Screenshots.startAutoScreenshots();
        }
    },

    // Update status display
    updateStatus(message, type) {
        const statusEl = document.getElementById('cl-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `cl-status ${type === 'ongoing' ? 'cl-ongoing' : 
                                          type === 'error' ? 'cl-error' : 
                                          type === 'warning' ? 'cl-warning' : 
                                          type === 'success' ? 'cl-success' : 
                                          type === 'completed' ? 'cl-completed' : ''}`;
        }
    },

    // Update timer display
    updateTimer(timeString) {
        const timerEl = document.getElementById('cl-duration');
        if (timerEl) {
            timerEl.textContent = timeString;
        }
    },

    // Update participant count
    updateParticipants(count) {
        const participantsEl = document.getElementById('cl-participants');
        if (participantsEl) {
            participantsEl.textContent = count;
        }
    },

    // Update features display
    updateFeatures(features) {
        const featuresEl = document.getElementById('cl-features');
        if (featuresEl) {
            featuresEl.textContent = features.length > 0 ? features.join(', ') : 'None';
        }
    },

    // Update screenshot count
    updateScreenshotCount(count) {
        const screenshotsEl = document.getElementById('cl-screenshots');
        if (screenshotsEl) {
            screenshotsEl.textContent = count;
        }
    },

    // Show screenshot preview
    showScreenshotPreview(imageData) {
        const preview = document.getElementById('cl-screenshot-preview');
        const img = document.getElementById('cl-screenshot-img');
        
        if (preview && img) {
            img.src = imageData;
            preview.style.display = 'block';
            
            // Hide after 3 seconds
            setTimeout(() => {
                preview.style.display = 'none';
            }, 3000);
        }
    }
};

console.log('✅ UI: Module loaded - Compatible with clean orchestrator pattern');
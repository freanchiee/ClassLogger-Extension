// ===== ClassLogger Clean Content Script =====
// Pure orchestrator - coordinates modules only

(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.classLoggerInitialized) {
        console.log('🎓 ClassLogger: Already initialized');
        return;
    }
    window.classLoggerInitialized = true;

    // Simple orchestrator class
    class ClassLoggerOrchestrator {
        constructor() {
            console.log('🚀 ClassLogger: Starting orchestrator...');
            
            // Initialize namespace
            window.ClassLogger = window.ClassLogger || {};
            window.ClassLogger.orchestrator = this;
            window.ClassLogger.currentClassId = null;
            
            // Start initialization
            this.init();
        }

        async init() {
            try {
                // Only on Google Meet
                if (!this.isGoogleMeet()) {
                    console.log('🚫 Not on Google Meet');
                    return;
                }

                // Wait for modules
                await this.waitForModules();
                
                // Initialize modules
                await this.initializeModules();
                
                // Start the app
                await this.startApp();
                
                console.log('✅ ClassLogger orchestrator ready');
                
            } catch (error) {
                console.error('❌ Orchestrator failed:', error);
                this.createFallbackWidget();
            }
        }

        // Wait for essential modules to load
        async waitForModules() {
            const maxAttempts = 20;
            let attempts = 0;
            
            while (attempts < maxAttempts) {
                if (this.hasEssentialModules()) {
                    console.log('✅ Essential modules loaded');
                    return;
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }
            
            throw new Error('Essential modules failed to load');
        }
// Check if we have the modules we need
hasEssentialModules() {
    console.log('🔍 Checking modules...');
    console.log('window.ClassLogger:', window.ClassLogger);
    console.log('Auth module:', !!window.ClassLogger?.Auth);
    console.log('UI module:', !!window.ClassLogger?.UI);
    console.log('API module:', !!window.ClassLogger?.API);
    console.log('Available modules:', Object.keys(window.ClassLogger || {}));
    
    return !!(
        window.ClassLogger.Auth && 
        window.ClassLogger.UI && 
        window.ClassLogger.API
    );
}// Wait for essential modules to load
async waitForModules() {
    const maxAttempts = 50; // Increased from 20
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        if (this.hasEssentialModules()) {
            console.log('✅ Essential modules loaded');
            return;
        }
        
        console.log(`⏳ Waiting for modules... (${attempts + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay
        attempts++;
    }
    
    throw new Error('Essential modules failed to load');
}
        // Initialize modules that need it
        async initializeModules() {
            console.log('🔧 Initializing modules...');
            
            const initOrder = ['Auth', 'Screenshots', 'Timer', 'Notes', 'Monitoring'];
            
            for (const moduleName of initOrder) {
                if (window.ClassLogger[moduleName]?.init) {
                    try {
                        await window.ClassLogger[moduleName].init();
                        console.log(`✅ ${moduleName} initialized`);
                    } catch (error) {
                        console.warn(`⚠️ ${moduleName} init failed:`, error);
                    }
                }
            }
        }
// Wait for essential modules to load
async waitForModules() {
    const maxAttempts = 50; // Increased from 20
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        if (this.hasEssentialModules()) {
            console.log('✅ Essential modules loaded');
            return;
        }
        
        console.log(`⏳ Waiting for modules... (${attempts + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay
        attempts++;
    }
    
    throw new Error('Essential modules failed to load');
}
        // Start the main application
        async startApp() {
            try {
                const authStatus = await window.ClassLogger.Auth.checkAuthStatus();
                
                if (authStatus.isLoggedIn) {
                    console.log('✅ User authenticated:', authStatus.teacher.name);
                    
                    const meetValidation = await window.ClassLogger.Auth.validateMeetUrl(window.location.href);
                    
                    window.ClassLogger.UI.createMainWidget(
                        authStatus.teacher, 
                        meetValidation.isValid ? meetValidation.enrollmentInfo : null
                    );
                    
                    window.ClassLogger.Auth.startAutoRefresh();
                    
                } else {
                    console.log('❌ User not authenticated');
                    window.ClassLogger.UI.createLoginPrompt();
                }
                
            } catch (error) {
                console.error('❌ App start failed:', error);
                window.ClassLogger.UI.createLoginPrompt();
            }
        }

        // Start class - delegate to API
        async startClass() {
            console.log('▶️ Orchestrator: Starting class...');
            
            try {
                // Show loading state
                window.ClassLogger.UI.showLoadingState('Starting class...');
                
                const teacherInfo = window.ClassLogger.Auth?.getTeacherInfo();
                const enrollmentInfo = window.ClassLogger.Auth?.getEnrollmentInfo();
                
                if (!teacherInfo) {
                    window.ClassLogger.UI.showErrorState('Authentication required');
                    return { success: false, error: 'Authentication required' };
                }
                
                const classData = {
                    meetUrl: window.location.href,
                    startTime: new Date().toISOString(),
                    teacherInfo,
                    enrollmentInfo
                };
                
                const response = await window.ClassLogger.API.startClass(classData);
                
                if (response?.success) {
                    window.ClassLogger.currentClassId = response.class_log_id || response.data?.class_log_id;
                    
                    if (window.ClassLogger.currentClassId) {
                        this.startTracking();
                        window.ClassLogger.UI.showOngoingState();
                        window.ClassLogger.UI.showNotification('Class started successfully!', 'success');
                        console.log('✅ Class started:', window.ClassLogger.currentClassId);
                        return { success: true, class_id: window.ClassLogger.currentClassId };
                    }
                }
                
                const errorMsg = response?.error || 'Start failed';
                window.ClassLogger.UI.showErrorState(`Failed to start: ${errorMsg}`);
                window.ClassLogger.UI.showNotification(`Failed to start class: ${errorMsg}`, 'error');
                return { success: false, error: errorMsg };
                
            } catch (error) {
                console.error('❌ Start class error:', error);
                const errorMsg = error.message || 'Unknown error';
                window.ClassLogger.UI.showErrorState(`Error: ${errorMsg}`);
                window.ClassLogger.UI.showNotification(`Error starting class: ${errorMsg}`, 'error');
                return { success: false, error: errorMsg };
            }
        }

        // End class - delegate to API
        async endClass() {
            console.log('⏹️ Orchestrator: Ending class...');
            
            try {
                if (!window.ClassLogger.currentClassId) {
                    window.ClassLogger.UI.showErrorState('No active class');
                    return { success: false, error: 'No active class' };
                }
                
                // Show loading state
                window.ClassLogger.UI.showLoadingState('Ending class...');
                
                this.stopTracking();
                
                const summary = this.collectSummary();
                
                const response = await window.ClassLogger.API.endClass({
                    class_log_id: window.ClassLogger.currentClassId,
                    endTime: new Date().toISOString(),
                    classContent: summary
                });
                
                if (response?.success) {
                    // API returns `duration` as a friendly string (e.g. "1h 5m" or "12m")
                    const durationText = response.duration || response.duration_minutes
                        ? (response.duration || `${response.duration_minutes} min`)
                        : '0m';
                    window.ClassLogger.currentClassId = null;
                    window.ClassLogger.UI.showStartState();
                    window.ClassLogger.UI.showNotification(`Class ended successfully! Duration: ${durationText}`, 'success');
                    console.log('✅ Class ended successfully, duration:', durationText);
                    return { success: true, duration: durationText };
                }
                
                const errorMsg = response?.error || 'End failed';
                window.ClassLogger.UI.showErrorState(`Failed to end: ${errorMsg}`);
                window.ClassLogger.UI.showNotification(`Failed to end class: ${errorMsg}`, 'error');
                return { success: false, error: errorMsg };
                
            } catch (error) {
                console.error('❌ End class error:', error);
                const errorMsg = error.message || 'Unknown error';
                window.ClassLogger.UI.showErrorState(`Error: ${errorMsg}`);
                window.ClassLogger.UI.showNotification(`Error ending class: ${errorMsg}`, 'error');
                return { success: false, error: errorMsg };
            }
        }

        // Start tracking modules
        startTracking() {
            console.log('🎬 Starting tracking...');
            
            try {
                if (window.ClassLogger.Timer?.startTimer) {
                    window.ClassLogger.Timer.startTimer();
                }
                if (window.ClassLogger.Monitoring?.startContentMonitoring) {
                    window.ClassLogger.Monitoring.startContentMonitoring();
                }
                if (window.ClassLogger.Screenshots?.startAutoScreenshots) {
                    // Don't auto-start screenshots, let user control
                }
            } catch (error) {
                console.warn('⚠️ Some tracking features failed to start:', error);
            }
        }

        // Stop tracking modules
        stopTracking() {
            console.log('⏹️ Stopping tracking...');
            
            try {
                if (window.ClassLogger.Timer?.stopTimer) {
                    window.ClassLogger.Timer.stopTimer();
                }
                if (window.ClassLogger.Monitoring?.stopContentMonitoring) {
                    window.ClassLogger.Monitoring.stopContentMonitoring();
                }
                if (window.ClassLogger.Screenshots?.stopAutoScreenshots) {
                    window.ClassLogger.Screenshots.stopAutoScreenshots();
                }
            } catch (error) {
                console.warn('⚠️ Some tracking features failed to stop:', error);
            }
        }

        // Collect class summary
        collectSummary() {
            try {
                return {
                    class_log_id: window.ClassLogger.currentClassId,
                    duration_minutes: this.getDuration(),
                    teacher_notes: this.getNotes(),
                    participants_count: this.getParticipantCount(),
                    screenshots_taken: this.getScreenshotCount(),
                    features_used: this.getFeaturesUsed()
                };
            } catch (error) {
                console.warn('⚠️ Failed to collect complete summary:', error);
                return {
                    class_log_id: window.ClassLogger.currentClassId,
                    teacher_notes: 'Class completed',
                    duration_minutes: 0
                };
            }
        }

        getDuration() {
            try {
                return window.ClassLogger.Timer?.getTimerStats()?.durationMinutes || 0;
            } catch {
                return 0;
            }
        }

        getNotes() {
            try {
                const quickNotes = document.getElementById('cl-quick-notes')?.value || '';
                const structuredNotes = this.getStructuredNotes();
                
                if (quickNotes && structuredNotes) {
                    return `Quick Notes: ${quickNotes}\n\nStructured Notes: ${structuredNotes}`;
                }
                
                return quickNotes || structuredNotes || 'Class completed';
            } catch {
                return 'Class completed';
            }
        }

        getStructuredNotes() {
            try {
                const topics = [];
                for (let i = 1; i <= 5; i++) {
                    const topic = document.getElementById(`cl-topic${i}`)?.value;
                    if (topic) topics.push(`Topic ${i}: ${topic}`);
                }
                
                const homework = document.getElementById('cl-homework')?.value;
                if (homework) topics.push(`Homework: ${homework}`);
                
                return topics.join('\n');
            } catch {
                return '';
            }
        }

        getParticipantCount() {
            try {
                return window.ClassLogger.Monitoring?.getParticipantCount() || 1;
            } catch {
                return 1;
            }
        }

        getScreenshotCount() {
            try {
                return window.ClassLogger.Screenshots?.getScreenshotCount() || 0;
            } catch {
                return 0;
            }
        }

        getFeaturesUsed() {
            try {
                const features = [];
                const monitoring = window.ClassLogger.Monitoring;
                
                if (monitoring?.isScreenShareActive?.()) features.push('Screen Share');
                if (monitoring?.isRecordingActive?.()) features.push('Recording');
                if (monitoring?.areBreakoutRoomsActive?.()) features.push('Breakout Rooms');
                
                return features.join(', ') || 'Basic Features';
            } catch {
                return 'Basic Features';
            }
        }

        // Create fallback widget if modules fail
        createFallbackWidget() {
            console.log('🚨 Creating fallback widget...');
            
            const widget = document.createElement('div');
            widget.id = 'classlogger-widget';
            widget.style.cssText = `
                position: fixed; top: 20px; right: 20px; width: 300px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; padding: 20px; border-radius: 12px; z-index: 999999;
                font-family: system-ui, sans-serif; box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            `;
            
            widget.innerHTML = `
                <h3 style="margin: 0 0 10px 0;">🎓 ClassLogger</h3>
                <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">
                    Extension loading... Please refresh if this persists.
                </p>
                <button onclick="location.reload()" style="
                    width: 100%; padding: 10px; background: rgba(255,255,255,0.2);
                    color: white; border: none; border-radius: 6px;
                    cursor: pointer; font-weight: bold;
                ">🔄 Refresh Page</button>
                <div style="margin-top: 10px; font-size: 12px; opacity: 0.7;">
                    If problems persist, check the extension settings.
                </div>
            `;
            
            document.body.appendChild(widget);
        }

        // Utility methods
        isGoogleMeet() {
            return window.location.hostname === 'meet.google.com';
        }

        // Reinitialize for auth changes
        async reinitialize() {
            console.log('🔄 Reinitializing...');
            this.stopTracking();
            window.ClassLogger.currentClassId = null;
            
            // Clean up existing UI
            if (window.ClassLogger.UI?.destroy) {
                window.ClassLogger.UI.destroy();
            }
            
            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Restart the app
            await this.startApp();
        }

        // Cleanup
        destroy() {
            console.log('🧹 Orchestrator cleanup...');
            this.stopTracking();
            
            if (window.ClassLogger.UI?.destroy) {
                window.ClassLogger.UI.destroy();
            }
            
            window.ClassLogger.currentClassId = null;
        }
    }

    // Handle messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'refreshLoginState') {
            console.log('🔄 Refresh requested from popup');
            if (window.ClassLogger?.orchestrator) {
                window.ClassLogger.orchestrator.reinitialize();
            }
            sendResponse({ success: true });
        }
    });

    // Handle navigation changes
    let currentUrl = window.location.href;
    const observer = new MutationObserver(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            
            if (window.location.hostname === 'meet.google.com') {
                console.log('🌐 Navigation detected, reinitializing...');
                setTimeout(() => {
                    if (!document.getElementById('classlogger-widget')) {
                        window.classLoggerInitialized = false;
                        new ClassLoggerOrchestrator();
                    }
                }, 2000);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && window.location.hostname === 'meet.google.com') {
            // Page became visible, check if widget exists
            setTimeout(() => {
                if (!document.getElementById('classlogger-widget')) {
                    console.log('👁️ Page visible, widget missing - reinitializing...');
                    window.classLoggerInitialized = false;
                    new ClassLoggerOrchestrator();
                }
            }, 1000);
        }
    });

    // Start the orchestrator
    if (window.location.hostname === 'meet.google.com') {
        setTimeout(() => {
            new ClassLoggerOrchestrator();
        }, 1000); // Wait for page to fully load
    }

})();// Start the orchestrator

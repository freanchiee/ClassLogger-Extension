// ===== ClassLogger Auth Module - Simple & Working =====
// Based on your working auth.js pattern with background script

window.ClassLogger = window.ClassLogger || {};

window.ClassLogger.Auth = {
    // Current auth state
    isLoggedIn: false,
    teacherInfo: null,
    enrollmentInfo: null,
    autoRefreshInterval: null,
    
    // Initialize auth module
    async init() {
        console.log('🚀 Auth: Initializing...');
        
        try {
            // Listen for storage changes (when popup login/logout happens)
            if (chrome?.storage?.onChanged) {
                chrome.storage.onChanged.addListener((changes, namespace) => {
                    if (namespace === 'local' && changes.classlogger_token) {
                        console.log('🔄 Auth: Token storage changed, rechecking auth...');
                        
                        if (changes.classlogger_token.newValue) {
                            console.log('✅ Auth: New token detected, user logged in');
                            this.checkAuthStatus().then(result => {
                                if (result.isLoggedIn && window.ClassLogger.orchestrator?.reinitialize) {
                                    window.ClassLogger.orchestrator.reinitialize();
                                }
                            });
                        } else {
                            console.log('❌ Auth: Token removed, user logged out');
                            this.isLoggedIn = false;
                            this.teacherInfo = null;
                            if (window.ClassLogger?.UI?.createLoginPrompt) {
                                window.ClassLogger.UI.createLoginPrompt();
                            }
                        }
                    }
                });
            }
            
            return true;
        } catch (error) {
            console.error('❌ Auth: Initialization failed:', error);
            return false;
        }
    },

    // Check authentication status via background script
    async checkAuthStatus() {
        try {
            console.log('🔐 Auth: Checking token authentication status...');
            
            const response = await new Promise((resolve, reject) => {
                if (!chrome?.runtime?.id) {
                    reject(new Error('Extension context invalidated'));
                    return;
                }
                
                chrome.runtime.sendMessage(
                    { action: 'checkAuthStatus' },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    }
                );
            });

            if (response?.success && response?.loggedIn) {
                console.log('✅ Auth: Token valid, user authenticated:', response.teacherName);
                
                this.teacherInfo = {
                    id: response.teacherId,
                    name: response.teacherName,
                    email: response.teacherEmail,
                    loginMethod: 'Token'
                };
                
                this.isLoggedIn = true;
                
                return {
                    success: true,
                    isLoggedIn: true,
                    teacher: this.teacherInfo
                };
            } else {
                console.log('❌ Auth: Token invalid or expired:', response?.error);
                this.isLoggedIn = false;
                this.teacherInfo = null;
                
                return {
                    success: true,
                    isLoggedIn: false,
                    error: response?.error || 'Token not found or expired'
                };
            }
            
        } catch (error) {
            console.error('❌ Auth: Token check failed:', error);
            
            if (error.message.includes('Extension context invalidated')) {
                return {
                    success: false,
                    isLoggedIn: false,
                    error: 'Extension was updated. Please refresh the page.',
                    contextInvalidated: true
                };
            }
            
            this.isLoggedIn = false;
            this.teacherInfo = null;
            
            return {
                success: false,
                isLoggedIn: false,
                error: 'Failed to check authentication status'
            };
        }
    },

    // Validate Meet URL via background script
    async validateMeetUrl(meetUrl) {
        try {
            console.log('🔍 Auth: Validating Meet URL for authenticated teacher...');
            
            if (!this.isLoggedIn) {
                console.log('❌ Auth: Not logged in for Meet URL validation');
                return {
                    success: false,
                    isValid: false,
                    error: 'Not authenticated - please enter your token'
                };
            }
            
            const response = await new Promise((resolve, reject) => {
                if (!chrome?.runtime?.id) {
                    reject(new Error('Extension context invalidated'));
                    return;
                }
                
                chrome.runtime.sendMessage(
                    { action: 'checkMeetUrl', meetUrl: meetUrl },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    }
                );
            });
            
            if (response && response.success && response.enrollment) {
                console.log('✅ Auth: Meet URL is valid for this teacher:', response.enrollment);
                this.enrollmentInfo = response.enrollment;
                
                return {
                    success: true,
                    isValid: true,
                    enrollmentInfo: response.enrollment
                };
            } else {
                console.log('❌ Auth: Meet URL not valid for this teacher:', response?.error);
                return {
                    success: true,
                    isValid: false,
                    error: response?.error || 'This Meet URL is not in your enrolled classes'
                };
            }
            
        } catch (error) {
            console.error('❌ Auth: Meet URL validation error:', error);
            
            if (error.message.includes('Extension context invalidated')) {
                return {
                    success: false,
                    isValid: false,
                    error: 'Extension was updated. Please refresh the page.',
                    contextInvalidated: true
                };
            }
            
            return {
                success: false,
                isValid: false,
                error: 'Failed to validate Meet URL'
            };
        }
    },

    // Get current teacher info
    getTeacherInfo() {
        return this.teacherInfo;
    },

    // Get current enrollment info
    getEnrollmentInfo() {
        return this.enrollmentInfo;
    },

    // Check if user is authenticated
    isAuthenticated() {
        return this.isLoggedIn && !!this.teacherInfo;
    },

    // Start auto-refresh
    startAutoRefresh(intervalMs = 30000) {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        console.log('🔄 Auth: Starting token auto-refresh every', intervalMs, 'ms');
        this.autoRefreshInterval = setInterval(async () => {
            try {
                const authStatus = await this.checkAuthStatus();
                
                if (!authStatus.isLoggedIn) {
                    console.log('⚠️ Auth: Token expired during auto-refresh');
                    this.stopAutoRefresh();
                    if (window.ClassLogger?.UI?.createLoginPrompt) {
                        window.ClassLogger.UI.createLoginPrompt();
                    }
                }
            } catch (error) {
                console.error('❌ Auth: Auto-refresh error:', error);
                this.stopAutoRefresh();
            }
        }, intervalMs);
    },

    // Stop auto-refresh
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            console.log('⏹️ Auth: Stopping token auto-refresh');
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    },

    // Clear auth data
    clearAuthData() {
        this.isLoggedIn = false;
        this.teacherInfo = null;
        this.enrollmentInfo = null;
        this.stopAutoRefresh();
    },

    // Cleanup
    destroy() {
        console.log('🧹 Auth: Cleaning up...');
        this.stopAutoRefresh();
        this.clearAuthData();
    }
};
// ===== ClassLogger API Module - Simple & Working =====
// Handles communication with background script for API calls

window.ClassLogger = window.ClassLogger || {};

window.ClassLogger.API = {
    // Initialize API module
    async init() {
        console.log('🌐 API: Initializing...');
        
        try {
            if (!chrome?.runtime?.id) {
                console.warn('⚠️ API: Extension context not available');
                return false;
            }
            
            console.log('✅ API: Initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ API: Initialization failed:', error);
            return false;
        }
    },

    // Generic message sender to background script
    async sendMessage(message) {
        return new Promise((resolve, reject) => {
            if (!chrome?.runtime?.id) {
                reject(new Error('Extension context invalidated'));
                return;
            }
            
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    },

    // Start class session
    async startClass(classData) {
        try {
            console.log('▶️ API: Starting class...');
            
            const response = await this.sendMessage({
                action: 'startClass',
                data: {
                    meetUrl: classData.meetUrl,
                    startTime: classData.startTime,
                    teacherInfo: classData.teacherInfo,
                    enrollmentInfo: classData.enrollmentInfo
                }
            });
            
            if (response?.success) {
                return {
                    success: true,
                    class_log_id: response.class_log_id || response.data?.class_log_id,
                    message: response.message || 'Class started successfully'
                };
            } else {
                return {
                    success: false,
                    error: response?.error || 'Failed to start class'
                };
            }
            
        } catch (error) {
            console.error('❌ API: Start class error:', error);
            return {
                success: false,
                error: error.message || 'Failed to start class'
            };
        }
    },

    // End class session
    async endClass(classData) {
        try {
            console.log('⏹️ API: Ending class...');
            
            const response = await this.sendMessage({
                action: 'endClass',
                data: {
                    class_log_id: classData.class_log_id,
                    endTime: classData.endTime,
                    classContent: classData.classContent
                }
            });
            
            if (response?.success) {
                return {
                    success: true,
                    duration_minutes: response.duration_minutes || 0,
                    message: response.message || 'Class ended successfully'
                };
            } else {
                return {
                    success: false,
                    error: response?.error || 'Failed to end class'
                };
            }
            
        } catch (error) {
            console.error('❌ API: End class error:', error);
            return {
                success: false,
                error: error.message || 'Failed to end class'
            };
        }
    },

    // Take screenshot
    async takeScreenshot() {
        try {
            console.log('📸 API: Taking screenshot...');
            
            const response = await this.sendMessage({
                action: 'takeScreenshot'
            });
            
            if (response?.success && response?.screenshot) {
                return {
                    success: true,
                    screenshot: response.screenshot,
                    timestamp: response.timestamp || new Date().toISOString()
                };
            } else {
                return {
                    success: false,
                    error: response?.error || 'Failed to take screenshot'
                };
            }
            
        } catch (error) {
            console.error('❌ API: Screenshot error:', error);
            return {
                success: false,
                error: error.message || 'Failed to take screenshot'
            };
        }
    },

    // Validate token (for popup)
    async validateToken(token) {
        try {
            console.log('🔐 API: Validating token...');
            
            const response = await this.sendMessage({
                action: 'validateToken',
                token: token
            });
            
            if (response?.valid && response?.teacher) {
                return {
                    success: true,
                    teacher: response.teacher,
                    tokenInfo: response.token_info
                };
            } else {
                return {
                    success: false,
                    error: response?.error || 'Token validation failed'
                };
            }
            
        } catch (error) {
            console.error('❌ API: Token validation error:', error);
            return {
                success: false,
                error: error.message || 'Failed to validate token'
            };
        }
    },

    // Check auth status (for content script)
    async checkAuthStatus() {
        try {
            console.log('🔍 API: Checking auth status...');
            
            const response = await this.sendMessage({
                action: 'checkAuthStatus'
            });
            
            return {
                success: response?.success || false,
                isLoggedIn: response?.loggedIn || false,
                teacherId: response?.teacherId,
                teacherName: response?.teacherName,
                teacherEmail: response?.teacherEmail,
                error: response?.error
            };
            
        } catch (error) {
            console.error('❌ API: Auth status check error:', error);
            return {
                success: false,
                isLoggedIn: false,
                error: error.message || 'Failed to check auth status'
            };
        }
    },

    // Validate Meet URL
    async validateMeetUrl(meetUrl) {
        try {
            console.log('🔗 API: Validating Meet URL...');
            
            const response = await this.sendMessage({
                action: 'checkMeetUrl',
                meetUrl: meetUrl
            });
            
            if (response?.success && response?.enrollment) {
                return {
                    success: true,
                    enrollmentInfo: response.enrollment
                };
            } else {
                return {
                    success: false,
                    error: response?.error || 'Meet URL validation failed'
                };
            }
            
        } catch (error) {
            console.error('❌ API: Meet URL validation error:', error);
            return {
                success: false,
                error: error.message || 'Failed to validate Meet URL'
            };
        }
    },

    // Save notes
    async saveNotes(notesData) {
        try {
            console.log('💾 API: Saving notes...');
            
            const response = await this.sendMessage({
                action: 'saveNotes',
                data: notesData
            });
            
            if (response?.success) {
                return {
                    success: true,
                    message: response.message || 'Notes saved successfully'
                };
            } else {
                return {
                    success: false,
                    error: response?.error || 'Failed to save notes'
                };
            }
            
        } catch (error) {
            console.error('❌ API: Save notes error:', error);
            return {
                success: false,
                error: error.message || 'Failed to save notes'
            };
        }
    },

    // Handle API errors
    handleApiError(error) {
        console.error('🚨 API: Error occurred:', error);
        
        if (error.message?.includes('Extension context invalidated')) {
            return {
                success: false,
                error: 'Extension was updated. Please refresh the page.',
                type: 'context_invalidated'
            };
        }
        
        if (error.message?.includes('Connection refused')) {
            return {
                success: false,
                error: 'Cannot connect to ClassLogger server. Please ensure it is running.',
                type: 'connection_refused'
            };
        }
        
        return {
            success: false,
            error: error.message || 'An unexpected error occurred',
            type: 'unknown'
        };
    },

    // Cleanup
    destroy() {
        console.log('🧹 API: Cleaning up...');
        // No specific cleanup needed
    }
};
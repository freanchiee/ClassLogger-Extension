// ===== ClassLogger Config Module =====
// Configuration and constants for the extension

window.ClassLogger = window.ClassLogger || {};

window.ClassLogger.Config = {
    // API Configuration
    API_BASE_URL: 'https://classlogger.com',
    API_TIMEOUT: 30000, // 30 seconds
    
    // Extension Settings
    EXTENSION_NAME: 'ClassLogger',
    EXTENSION_VERSION: '2.1.0',
    
    // Authentication
    TOKEN_STORAGE_KEY: 'classlogger_token',
    TOKEN_PATTERN: /^CL_[a-f0-9]{8}_\d{6}_[a-f0-9]{8}$/,
    TOKEN_EXPIRY_WARNING: 24 * 60 * 60 * 1000, // 24 hours in ms
    
    // Auto-refresh intervals
    AUTH_REFRESH_INTERVAL: 30 * 1000, // 30 seconds
    STATUS_UPDATE_INTERVAL: 5 * 1000, // 5 seconds
    
    // UI Settings
    WIDGET_POSITION: { top: '20px', right: '20px' },
    WIDGET_WIDTH: '340px',
    WIDGET_Z_INDEX: 999999,
    
    // Auto-save
    NOTES_AUTO_SAVE_DELAY: 2000, // 2 seconds
    
    // Screenshots
    SCREENSHOT_AUTO_INTERVAL: 5 * 60 * 1000, // 5 minutes
    SCREENSHOT_MAX_SIZE: 1920, // Max width/height
    SCREENSHOT_QUALITY: 0.8,
    
    // Content monitoring
    PARTICIPANT_CHECK_INTERVAL: 10 * 1000, // 10 seconds
    FEATURE_CHECK_INTERVAL: 5 * 1000, // 5 seconds
    
    // Error handling
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
    
    // Google Meet selectors (for monitoring)
    MEET_SELECTORS: {
        participantCount: '[data-participant-count-value]',
        participantList: '[data-participant-id]',
        screenShare: '[data-screen-share-active]',
        recording: '[data-recording-active]',
        chatButton: '[data-tooltip*="chat" i]',
        moreOptionsButton: '[data-tooltip*="more" i]',
        muteButton: '[data-is-muted]',
        cameraButton: '[data-is-camera-on]'
    },
    
    // Feature detection patterns
    FEATURE_PATTERNS: {
        screenShare: /screen.*share|share.*screen/i,
        recording: /record|recording/i,
        breakout: /breakout.*room|room.*breakout/i,
        whiteboard: /whiteboard|jamboard/i,
        chat: /chat|message/i
    },
    
    // API Endpoints
    API_ENDPOINTS: {
        // Authentication
        validateToken: '/api/teacher/tokens/validate',
        checkAuth: '/api/extension/auth-status',
        
        // Meet URL validation
        checkMeetUrl: '/api/extension/check-meet-url',
        
        // Class management
        startClass: '/api/extension/start-class',
        endClass: '/api/extension/end-class',
        updateClass: '/api/extension/update-class',
        
        // Content
        saveNotes: '/api/extension/save-notes',
        uploadFile: '/api/extension/upload-file',
        takeScreenshot: '/api/extension/screenshot',
        
        // Data retrieval
        getClassHistory: '/api/extension/class-history',
        getTeacherProfile: '/api/extension/teacher-profile',
        getEnrollments: '/api/extension/enrollments',
        
        // Health check
        ping: '/api/extension/ping'
    },
    
    // Storage keys
    STORAGE_KEYS: {
        token: 'classlogger_token',
        teacherInfo: 'classlogger_teacher_info',
        enrollmentInfo: 'classlogger_enrollment_info',
        lastClass: 'classlogger_last_class',
        settings: 'classlogger_settings',
        notes: 'classlogger_notes_cache'
    },
    
    // Default settings
    DEFAULT_SETTINGS: {
        autoSaveNotes: true,
        autoScreenshots: false,
        screenshotInterval: 5, // minutes
        notificationSound: false,
        darkMode: false,
        compactMode: false,
        showParticipantCount: true,
        showTimer: true,
        autoStartTracking: true
    },
    
    // Error messages
    ERROR_MESSAGES: {
        NO_TOKEN: 'Please enter your ClassLogger token in the extension popup',
        INVALID_TOKEN: 'Invalid token format. Please check your token.',
        TOKEN_EXPIRED: 'Your token has expired. Please generate a new one.',
        NOT_AUTHENTICATED: 'Authentication required. Please log in.',
        NO_MEET_URL: 'This Meet URL is not associated with your enrolled classes',
        EXTENSION_UPDATED: 'Extension was updated. Please refresh the page.',
        SERVER_UNREACHABLE: 'Cannot connect to ClassLogger server. Please ensure it is running.',
        UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
    },
    
    // Success messages
    SUCCESS_MESSAGES: {
        CLASS_STARTED: 'Class started successfully!',
        CLASS_ENDED: 'Class ended successfully!',
        NOTES_SAVED: 'Notes saved successfully',
        SCREENSHOT_TAKEN: 'Screenshot captured',
        TOKEN_VALIDATED: 'Token validated successfully'
    },
    
    // Debug settings
    DEBUG: {
        enabled: true,
        logLevel: 'info', // 'debug', 'info', 'warn', 'error'
        showTimestamps: true,
        showModuleNames: true
    },
    
    // Feature flags
    FEATURES: {
        autoScreenshots: true,
        participantMonitoring: true,
        featureDetection: true,
        chatMonitoring: false, // Disabled for privacy
        voiceDetection: false, // Disabled for privacy
        faceDetection: false, // Disabled for privacy
        backgroundBlur: false, // Not implemented
        virtualBackgrounds: false // Not implemented
    },
    
    // Performance settings
    PERFORMANCE: {
        enableBatching: true,
        batchSize: 10,
        batchTimeout: 5000,
        enableCaching: true,
        cacheTimeout: 60000,
        enableThrottling: true,
        throttleDelay: 1000
    },
    
    // Accessibility settings
    ACCESSIBILITY: {
        highContrast: false,
        largeText: false,
        screenReaderSupport: true,
        keyboardNavigation: true
    },
    
    // Get configuration value
    get(key, defaultValue = null) {
        return this.getNestedValue(this, key, defaultValue);
    },
    
    // Set configuration value
    set(key, value) {
        this.setNestedValue(this, key, value);
    },
    
    // Helper to get nested object values
    getNestedValue(obj, path, defaultValue = null) {
        if (typeof path === 'string') {
            path = path.split('.');
        }
        
        let current = obj;
        for (let i = 0; i < path.length; i++) {
            if (current[path[i]] === undefined) {
                return defaultValue;
            }
            current = current[path[i]];
        }
        
        return current;
    },
    
    // Helper to set nested object values
    setNestedValue(obj, path, value) {
        if (typeof path === 'string') {
            path = path.split('.');
        }
        
        let current = obj;
        for (let i = 0; i < path.length - 1; i++) {
            if (current[path[i]] === undefined) {
                current[path[i]] = {};
            }
            current = current[path[i]];
        }
        
        current[path[path.length - 1]] = value;
    },
    
    // Get API URL for endpoint
    getApiUrl(endpoint) {
        const baseUrl = this.API_BASE_URL;
        const endpointPath = this.API_ENDPOINTS[endpoint] || endpoint;
        return `${baseUrl}${endpointPath}`;
    },
    
    // Validate configuration
    validate() {
        const errors = [];
        
        // Check required configuration
        if (!this.API_BASE_URL) {
            errors.push('API_BASE_URL is required');
        }
        
        if (!this.TOKEN_PATTERN) {
            errors.push('TOKEN_PATTERN is required');
        }
        
        // Validate URL format
        try {
            new URL(this.API_BASE_URL);
        } catch (e) {
            errors.push('API_BASE_URL must be a valid URL');
        }
        
        // Validate intervals
        if (this.AUTH_REFRESH_INTERVAL < 1000) {
            errors.push('AUTH_REFRESH_INTERVAL must be at least 1000ms');
        }
        
        if (this.STATUS_UPDATE_INTERVAL < 1000) {
            errors.push('STATUS_UPDATE_INTERVAL must be at least 1000ms');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    // Load settings from storage
    async loadSettings() {
        try {
            const result = await chrome.storage.local.get([this.STORAGE_KEYS.settings]);
            const savedSettings = result[this.STORAGE_KEYS.settings] || {};
            
            // Merge with defaults
            Object.assign(this.DEFAULT_SETTINGS, savedSettings);
            
            console.log('🔧 Config: Settings loaded from storage');
            return true;
        } catch (error) {
            console.warn('⚠️ Config: Failed to load settings:', error);
            return false;
        }
    },
    
    // Save settings to storage
    async saveSettings(settings) {
        try {
            await chrome.storage.local.set({
                [this.STORAGE_KEYS.settings]: settings
            });
            
            console.log('💾 Config: Settings saved to storage');
            return true;
        } catch (error) {
            console.error('❌ Config: Failed to save settings:', error);
            return false;
        }
    },
    
    // Initialize configuration
    async init() {
        console.log('🔧 Config: Initializing...');
        
        try {
            // Validate configuration
            const validation = this.validate();
            if (!validation.valid) {
                console.error('❌ Config: Validation failed:', validation.errors);
                return false;
            }
            
            // Load user settings
            await this.loadSettings();
            
            console.log('✅ Config: Initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Config: Initialization failed:', error);
            return false;
        }
    }
};
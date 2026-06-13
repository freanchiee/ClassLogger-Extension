// ===== ClassLogger Monitoring Module =====
// Handles all Google Meet feature detection and participant tracking
// Maintains your exact detection logic and intervals

window.ClassLogger = window.ClassLogger || {};

window.ClassLogger.Monitoring = {
    // Monitoring intervals (will store interval IDs)
    participantMonitor: null,
    featureMonitor: null,
    chatMonitor: null,
    screenShareMonitor: null,
    
    // Class content tracking (matches your existing structure)
    classContent: {
        participantCount: 0,
        maxParticipants: 0,
        chatMessages: [],
        screenShareDetected: false,
        recordingDetected: false,
        breakoutRoomsUsed: false,
        topicsDiscussed: new Set(),
        files: []
    },
    
    // Start all monitoring (your existing flow)
    startContentMonitoring() {
        console.log('📊 ClassLogger Monitoring: Starting content monitoring');
        
        // Clear any existing intervals first
        this.stopContentMonitoring();
        
        // Participant monitoring - every 10 seconds
        this.participantMonitor = setInterval(() => {
            this.detectParticipants();
        }, window.ClassLogger.Config.PARTICIPANT_CHECK_INTERVAL);

        // Feature monitoring - every 5 seconds  
        this.featureMonitor = setInterval(() => {
            this.detectMeetFeatures();
        }, window.ClassLogger.Config.FEATURE_CHECK_INTERVAL);

        // Chat monitoring - every 3 seconds
        this.chatMonitor = setInterval(() => {
            this.detectChatActivity();
        }, window.ClassLogger.Config.CHAT_CHECK_INTERVAL);

        // Screen share monitoring - every 2 seconds
        this.screenShareMonitor = setInterval(() => {
            this.detectScreenShare();
        }, 2000);
        
        console.log('✅ All monitoring intervals started');
    },

    // Stop all monitoring (your existing flow)
    stopContentMonitoring() {
        console.log('📊 ClassLogger Monitoring: Stopping content monitoring');
        
        if (this.participantMonitor) {
            clearInterval(this.participantMonitor);
            this.participantMonitor = null;
        }
        if (this.featureMonitor) {
            clearInterval(this.featureMonitor);
            this.featureMonitor = null;
        }
        if (this.chatMonitor) {
            clearInterval(this.chatMonitor);
            this.chatMonitor = null;
        }
        if (this.screenShareMonitor) {
            clearInterval(this.screenShareMonitor);
            this.screenShareMonitor = null;
        }
        
        console.log('⏹️ All monitoring intervals stopped');
    },

    // Detect participants (your exact logic)
    detectParticipants() {
        try {
            // Use selectors from config
            const participantSelectors = window.ClassLogger.Config.SELECTORS.participants;

            let count = 0;
            for (const selector of participantSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > count) {
                    count = elements.length;
                }
            }

            // Add 1 for self (teacher) if participants detected
            if (count > 0) count += 1;
            
            // Update tracking data
            this.classContent.participantCount = count;
            this.classContent.maxParticipants = Math.max(
                this.classContent.maxParticipants, 
                count
            );

            // Update display
            this.updateParticipantDisplay();
            
            // Log significant changes
            if (window.ClassLogger.Config.DEBUG.ENABLED) {
                console.log('👥 Participants detected:', count, 'Max:', this.classContent.maxParticipants);
            }
            
        } catch (error) {
            if (window.ClassLogger.Config.DEBUG.ENABLED) {
                console.log('Could not detect participants:', error.message);
            }
        }
    },

    // Detect Google Meet features (your exact logic)
    detectMeetFeatures() {
        try {
            const features = [];
            const selectors = window.ClassLogger.Config.SELECTORS;

            // Recording detection
            if (document.querySelector(selectors.recording)) {
                this.classContent.recordingDetected = true;
                features.push('Recording');
            }

            // Screen share detection
            if (document.querySelector(selectors.screenShare)) {
                this.classContent.screenShareDetected = true;
                features.push('Screen Share');
            }

            // Captions detection
            if (document.querySelector(selectors.captions)) {
                features.push('Captions');
            }

            // Breakout rooms detection
            if (document.querySelector(selectors.breakoutRooms)) {
                this.classContent.breakoutRoomsUsed = true;
                features.push('Breakout Rooms');
            }

            // Whiteboard/Jamboard detection
            if (document.querySelector('[aria-label*="whiteboard" i], [aria-label*="jamboard" i]')) {
                features.push('Whiteboard');
            }

            // Update display
            this.updateFeaturesDisplay(features);
            
            // Log detected features
            if (window.ClassLogger.Config.DEBUG.ENABLED && features.length > 0) {
                console.log('🔧 Features detected:', features);
            }
            
        } catch (error) {
            if (window.ClassLogger.Config.DEBUG.ENABLED) {
                console.log('Could not detect features:', error.message);
            }
        }
    },

    // Detect chat activity (your exact logic)
    detectChatActivity() {
        try {
            const chatSelectors = window.ClassLogger.Config.SELECTORS.chat;

            for (const selector of chatSelectors) {
                const messages = document.querySelectorAll(selector);
                if (messages.length > this.classContent.chatMessages.length) {
                    // New chat messages detected
                    this.classContent.chatMessages.push({
                        timestamp: new Date(),
                        count: messages.length
                    });
                    
                    if (window.ClassLogger.Config.DEBUG.ENABLED) {
                        console.log('💬 New chat activity detected:', messages.length, 'total messages');
                    }
                    break;
                }
            }
        } catch (error) {
            if (window.ClassLogger.Config.DEBUG.ENABLED) {
                console.log('Could not detect chat:', error.message);
            }
        }
    },

    // Detect screen sharing (your exact logic)  
    detectScreenShare() {
        try {
            const presentingIndicators = [
                '[aria-label*="presenting" i]',
                '[aria-label*="shared screen" i]',
                '.presenting-indicator'
            ];

            for (const selector of presentingIndicators) {
                if (document.querySelector(selector)) {
                    if (!this.classContent.screenShareDetected) {
                        this.classContent.screenShareDetected = true;
                        if (window.ClassLogger.Config.DEBUG.ENABLED) {
                            console.log('📺 Screen sharing detected');
                        }
                    }
                    break;
                }
            }
        } catch (error) {
            if (window.ClassLogger.Config.DEBUG.ENABLED) {
                console.log('Could not detect screen share:', error.message);
            }
        }
    },

    // Update participant display in UI
    updateParticipantDisplay() {
        const participantEl = document.getElementById('cl-participant-count');
        if (participantEl) {
            participantEl.textContent = `👥 Participants: ${this.classContent.participantCount} (max: ${this.classContent.maxParticipants})`;
        }
    },

    // Update features display in UI  
    updateFeaturesDisplay(features) {
        const featuresEl = document.getElementById('cl-features-used');
        if (featuresEl) {
            featuresEl.textContent = `🔧 Features: ${features.length > 0 ? features.join(', ') : 'None'}`;
        }
    },

    // Get detected features list (your existing method)
    getDetectedFeatures() {
        const features = [];
        if (this.classContent.screenShareDetected) features.push('Screen Sharing');
        if (this.classContent.recordingDetected) features.push('Recording');
        if (this.classContent.chatMessages.length > 0) features.push('Chat');
        if (this.classContent.breakoutRoomsUsed) features.push('Breakout Rooms');
        return features;
    },

    // Get current class content data
    getClassContent() {
        return {
            ...this.classContent,
            detectedFeatures: this.getDetectedFeatures()
        };
    },

    // Reset monitoring data (for new class)
    resetClassContent() {
        console.log('🔄 Monitoring: Resetting class content data');
        this.classContent = {
            participantCount: 0,
            maxParticipants: 0,
            chatMessages: [],
            screenShareDetected: false,
            recordingDetected: false,
            breakoutRoomsUsed: false,
            topicsDiscussed: new Set(),
            files: []
        };
    },

    // Initialize monitoring module
    init() {
        console.log('🚀 Monitoring: Initializing monitoring module...');
        this.resetClassContent();
        return true;
    },

    // Cleanup monitoring module
    destroy() {
        console.log('🧹 Monitoring: Cleaning up monitoring module...');
        this.stopContentMonitoring();
        this.resetClassContent();
    }
};
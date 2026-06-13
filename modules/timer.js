// ===== ClassLogger Timer Module =====
// Handles class duration tracking and timer display
// Maintains your exact timer functionality

window.ClassLogger = window.ClassLogger || {};

window.ClassLogger.Timer = {
    // Timer state
    timerInterval: null,
    startTime: null,
    endTime: null,
    isRunning: false,
    
    // Start timer (your existing method)
    startTimer(existingStartTime = null) {
        console.log('⏰ Timer: Starting class timer...');
        
        const timerEl = document.getElementById('cl-timer');
        const durationEl = document.getElementById('cl-duration');
        
        if (!timerEl || !durationEl) {
            console.warn('Timer elements not found in DOM');
            return false;
        }
        
        // Set start time (use existing or current time)
        this.startTime = existingStartTime ? 
            new Date(existingStartTime).getTime() : 
            Date.now();
        
        this.isRunning = true;
        
        // Update timer display immediately
        this.updateTimerDisplay();
        
        // Start interval to update every second
        this.timerInterval = setInterval(() => {
            this.updateTimerDisplay();
        }, 1000);
        
        // Add active class for visual feedback
        timerEl.classList.add('cl-active');
        
        console.log('✅ Timer started at:', new Date(this.startTime));
        return true;
    },

    // Stop timer (your existing method)
    stopTimer() {
        console.log('⏹️ Timer: Stopping class timer...');
        
        const timerEl = document.getElementById('cl-timer');
        
        // Clear interval
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Set end time
        this.endTime = Date.now();
        this.isRunning = false;
        
        // Remove active class
        if (timerEl) {
            timerEl.classList.remove('cl-active');
        }
        
        console.log('✅ Timer stopped at:', new Date(this.endTime));
        console.log('📊 Total duration:', this.getDurationMinutes(), 'minutes');
        
        return true;
    },

    // Update timer display (your existing logic)
    updateTimerDisplay() {
        const durationEl = document.getElementById('cl-duration');
        
        if (!durationEl || !this.startTime) {
            return;
        }
        
        // Calculate elapsed time
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        // Format as MM:SS
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update display
        durationEl.textContent = formattedTime;
        
        // Add visual pulse effect when active
        if (this.isRunning) {
            durationEl.style.animation = 'cl-pulse 2s infinite';
        } else {
            durationEl.style.animation = 'none';
        }
    },

    // Pause timer (NEW: useful for breaks)
    pauseTimer() {
        console.log('⏸️ Timer: Pausing timer...');
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.isRunning = false;
        
        const timerEl = document.getElementById('cl-timer');
        if (timerEl) {
            timerEl.classList.remove('cl-active');
            timerEl.classList.add('cl-paused');
        }
        
        return true;
    },

    // Resume timer (NEW: useful for breaks)
    resumeTimer() {
        console.log('▶️ Timer: Resuming timer...');
        
        if (!this.startTime) {
            console.warn('Cannot resume - no start time set');
            return false;
        }
        
        // Restart interval
        this.timerInterval = setInterval(() => {
            this.updateTimerDisplay();
        }, 1000);
        
        this.isRunning = true;
        
        const timerEl = document.getElementById('cl-timer');
        if (timerEl) {
            timerEl.classList.add('cl-active');
            timerEl.classList.remove('cl-paused');
        }
        
        return true;
    },

    // Get current elapsed time in seconds
    getElapsedSeconds() {
        if (!this.startTime) return 0;
        
        const endTime = this.endTime || Date.now();
        return Math.floor((endTime - this.startTime) / 1000);
    },

    // Get current elapsed time in minutes
    getElapsedMinutes() {
        return Math.floor(this.getElapsedSeconds() / 60);
    },

    // Get duration in minutes (for class summary)
    getDurationMinutes() {
        if (!this.startTime) return 0;
        
        const endTime = this.endTime || Date.now();
        return Math.round((endTime - this.startTime) / (1000 * 60));
    },

    // Get formatted duration string
    getFormattedDuration() {
        const totalSeconds = this.getElapsedSeconds();
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    },

    // Get start time ISO string
    getStartTimeISO() {
        return this.startTime ? new Date(this.startTime).toISOString() : null;
    },

    // Get end time ISO string
    getEndTimeISO() {
        return this.endTime ? new Date(this.endTime).toISOString() : null;
    },

    // Check if timer is currently running
    isTimerRunning() {
        return this.isRunning && this.timerInterval !== null;
    },

    // Reset timer (for new class)
    resetTimer() {
        console.log('🔄 Timer: Resetting timer...');
        
        this.stopTimer();
        this.startTime = null;
        this.endTime = null;
        this.isRunning = false;
        
        // Clear display
        const durationEl = document.getElementById('cl-duration');
        if (durationEl) {
            durationEl.textContent = '00:00';
            durationEl.style.animation = 'none';
        }
        
        const timerEl = document.getElementById('cl-timer');
        if (timerEl) {
            timerEl.classList.remove('cl-active', 'cl-paused');
        }
        
        return true;
    },

    // Get timer statistics for class summary
    getTimerStats() {
        return {
            startTime: this.getStartTimeISO(),
            endTime: this.getEndTimeISO(),
            durationSeconds: this.getElapsedSeconds(),
            durationMinutes: this.getDurationMinutes(),
            formattedDuration: this.getFormattedDuration(),
            isRunning: this.isTimerRunning()
        };
    },

    // Initialize timer module
    init() {
        console.log('🚀 Timer: Initializing timer module...');
        this.resetTimer();
        return true;
    },

    // Cleanup timer module  
    destroy() {
        console.log('🧹 Timer: Cleaning up timer module...');
        this.stopTimer();
        this.resetTimer();
    }
};
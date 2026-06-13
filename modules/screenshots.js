// ===== ENHANCED ClassLogger Screenshots Module =====
// Handles ALL capture types: tab, desktop, window, specific-tab
// Maintains your existing functionality + adds enhanced capture options

window.ClassLogger = window.ClassLogger || {};

window.ClassLogger.Screenshots = {
    // Screenshot storage and intervals
    screenshots: [],
    autoScreenshotInterval: null,
    availableTabs: [],
    
    // Initialize screenshots module with enhanced capture
    init() {
        console.log('🚀 Screenshots: Initializing enhanced screenshots module...');
        this.clearScreenshots();
        this.loadAvailableTabs();
        return true;
    },

    // ENHANCED: Take screenshot with capture type options
    async takeScreenshot() {
        try {
            // Get capture options from UI
            const captureType = document.getElementById('cl-capture-type')?.value || 'tab';
            const quality = parseInt(document.getElementById('cl-capture-quality')?.value || '90');
            const selectedTabId = document.getElementById('cl-available-tabs')?.value;
            
            console.log('📸 Screenshots: Taking screenshot with options:', { captureType, quality, selectedTabId });
            
            // Prepare screenshot data
            const screenshotData = {
                captureType: captureType,
                quality: quality
            };
            
            if (captureType === 'specific-tab' && selectedTabId) {
                screenshotData.tabId = parseInt(selectedTabId);
            }
            
            // Call background script with enhanced options
            const screenshotResponse = await window.ClassLogger.API.sendMessage({ action: 'takeScreenshot', ...screenshotData });
            
            if (screenshotResponse && screenshotResponse.success) {
                // Create screenshot data object (enhanced with capture type)
                const processedScreenshot = {
                    timestamp: new Date(),
                    dataUrl: screenshotResponse.dataUrl,
                    type: 'manual',
                    captureType: screenshotResponse.captureType || captureType,
                    tabUrl: screenshotResponse.tabUrl,
                    tabTitle: screenshotResponse.tabTitle,
                    width: screenshotResponse.width,
                    height: screenshotResponse.height,
                    fileSize: this.calculateDataUrlSize(screenshotResponse.dataUrl)
                };
                
                // Store locally
                this.screenshots.push(processedScreenshot);
                
                // Update UI display
                this.updateScreenshotCount();
                this.showScreenshotFeedback(screenshotResponse.captureType);
                
                // Show enhanced preview
                this.showEnhancedPreview(processedScreenshot);
                
                // Save to database if class is active
                await this.saveScreenshotToDatabase(processedScreenshot);
                
                console.log('✅ Enhanced screenshot taken successfully:', screenshotResponse.captureType);
                return { success: true, data: processedScreenshot };
                
            } else {
                console.error('❌ Screenshot failed:', screenshotResponse?.error);
                this.showScreenshotError(screenshotResponse?.error || 'Screenshot failed');
                return { success: false, error: screenshotResponse?.error };
            }
            
        } catch (error) {
            console.error('❌ Screenshot error:', error);
            this.showScreenshotError('Screenshot not available');
            return { success: false, error: error.message };
        }
    },

    // ENHANCED: Auto screenshot with current capture settings
    async takeAutoScreenshot() {
        try {
            console.log('📸 Screenshots: Taking auto screenshot...');
            
            // Use current UI settings for auto screenshots
            const captureType = document.getElementById('cl-capture-type')?.value || 'tab';
            const quality = parseInt(document.getElementById('cl-capture-quality')?.value || '90');
            
            const screenshotResponse = await window.ClassLogger.API.sendMessage({
                action: 'takeScreenshot',
                captureType: captureType,
                quality: quality
            });
            
            if (screenshotResponse && screenshotResponse.success) {
                // Create screenshot data object
                const processedScreenshot = {
                    timestamp: new Date(),
                    dataUrl: screenshotResponse.dataUrl,
                    type: 'auto',
                    captureType: screenshotResponse.captureType || captureType,
                    tabUrl: screenshotResponse.tabUrl,
                    tabTitle: screenshotResponse.tabTitle,
                    fileSize: this.calculateDataUrlSize(screenshotResponse.dataUrl)
                };
                
                // Store locally
                this.screenshots.push(processedScreenshot);
                
                // Update UI display
                this.updateScreenshotCount();
                
                // Save to database if class is active
                await this.saveScreenshotToDatabase(processedScreenshot);
                
                console.log('✅ Auto screenshot taken successfully:', screenshotResponse.captureType);
                return { success: true, data: processedScreenshot };
                
            } else {
                console.log('⚠️ Auto screenshot failed:', screenshotResponse?.error);
                return { success: false, error: screenshotResponse?.error };
            }
            
        } catch (error) {
            console.log('⚠️ Auto screenshot failed:', error.message);
            return { success: false, error: error.message };
        }
    },

    // NEW: Load available tabs for specific-tab capture
    async loadAvailableTabs() {
        try {
            console.log('🔄 Screenshots: Loading available tabs...');
            
            const response = await window.ClassLogger.API.sendMessage({ action: 'getAvailableTabs' });
            
            if (response.success) {
                this.availableTabs = response.tabs;
                this.updateTabSelector();
                console.log('✅ Screenshots: Loaded', response.tabs.length, 'tabs');
            } else {
                console.error('❌ Screenshots: Failed to load tabs:', response.error);
            }
        } catch (error) {
            console.error('❌ Screenshots: Tab loading error:', error);
        }
    },

    // NEW: Update tab selector dropdown
    updateTabSelector() {
        const tabSelect = document.getElementById('cl-available-tabs');
        if (!tabSelect) return;
        
        tabSelect.innerHTML = '';
        
        this.availableTabs.forEach(tab => {
            const option = document.createElement('option');
            option.value = tab.id;
            
            // Create readable tab title
            let title = tab.title;
            if (title.length > 30) {
                title = title.substring(0, 30) + '...';
            }
            
            const hostname = new URL(tab.url).hostname;
            option.textContent = `${title} (${hostname})`;
            
            if (tab.active) {
                option.textContent += ' [Active]';
                option.selected = true;
            }
            
            tabSelect.appendChild(option);
        });
    },

    // NEW: Handle capture type change from UI
    handleCaptureTypeChange() {
        const captureType = document.getElementById('cl-capture-type')?.value;
        const tabSelector = document.getElementById('cl-tab-selector');
        
        console.log('🔄 Screenshots: Capture type changed to:', captureType);
        
        if (captureType === 'specific-tab') {
            if (tabSelector) tabSelector.style.display = 'block';
            this.loadAvailableTabs();
        } else {
            if (tabSelector) tabSelector.style.display = 'none';
        }

        // Update button text based on capture type
        this.updateButtonText(captureType);
    },

    // NEW: Update screenshot button text based on capture type
    updateButtonText(captureType) {
        const screenshotBtn = document.getElementById('cl-screenshot-btn');
        if (!screenshotBtn) return;
        
        const typeEmojis = {
            'tab': '📋',
            'desktop': '🖥️', 
            'window': '🪟',
            'specific-tab': '🎯'
        };
        
        const typeNames = {
            'tab': 'Tab',
            'desktop': 'Desktop',
            'window': 'Window', 
            'specific-tab': 'Specific Tab'
        };
        
        screenshotBtn.innerHTML = `${typeEmojis[captureType] || '📸'} Capture ${typeNames[captureType] || 'Screenshot'}`;
    },

    // ENHANCED: Show screenshot feedback with capture type
    showScreenshotFeedback(captureType) {
        const btn = document.getElementById('cl-screenshot-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            const typeEmojis = {
                'tab': '📋',
                'desktop': '🖥️', 
                'window': '🪟',
                'specific-tab': '🎯'
            };
            
            btn.innerHTML = `✅ ${typeEmojis[captureType] || '📸'} Captured!`;
            btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 2000);
        }
    },

    // NEW: Show enhanced screenshot preview with metadata
    showEnhancedPreview(screenshotData) {
        const preview = document.getElementById('cl-screenshot-preview');
        const img = document.getElementById('cl-screenshot-img');
        const typeSpan = document.getElementById('cl-screenshot-type');
        const sizeSpan = document.getElementById('cl-screenshot-size');
        const timeSpan = document.getElementById('cl-screenshot-time');
        
        if (preview && img) {
            img.src = screenshotData.dataUrl;
            
            if (typeSpan) typeSpan.textContent = screenshotData.captureType.toUpperCase();
            if (sizeSpan) sizeSpan.textContent = `${Math.round(screenshotData.fileSize / 1024)}KB`;
            if (timeSpan) timeSpan.textContent = screenshotData.timestamp.toLocaleTimeString();
            
            preview.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                preview.style.display = 'none';
            }, 5000);
        }
    },

    // EXISTING: Start auto screenshots (your existing method)
    startAutoScreenshots() {
        console.log('🔄 Screenshots: Starting auto screenshots...');
        
        // Clear any existing interval
        this.stopAutoScreenshots();
        
        // Start new interval (every 1 minute)
        this.autoScreenshotInterval = setInterval(() => {
            this.takeAutoScreenshot();
        }, window.ClassLogger.Config?.SCREENSHOT_INTERVAL || 60000);

        // Update button UI
        const autoBtn = document.getElementById('cl-auto-screenshot-btn');
        if (autoBtn) {
            autoBtn.textContent = '🔄 Auto (On)';
            autoBtn.dataset.active = 'true';
            autoBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            autoBtn.style.color = 'white';
        }
        
        console.log('✅ Auto screenshots started');
    },

    // EXISTING: Stop auto screenshots (your existing method)
    stopAutoScreenshots() {
        console.log('⏹️ Screenshots: Stopping auto screenshots...');
        
        if (this.autoScreenshotInterval) {
            clearInterval(this.autoScreenshotInterval);
            this.autoScreenshotInterval = null;
        }

        // Update button UI
        const autoBtn = document.getElementById('cl-auto-screenshot-btn');
        if (autoBtn) {
            autoBtn.textContent = '🔄 Auto (Off)';
            autoBtn.dataset.active = 'false';
            autoBtn.style.background = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
            autoBtn.style.color = 'white';
        }
        
        console.log('✅ Auto screenshots stopped');
    },

    // EXISTING: Save screenshot to database (your existing method)
    async saveScreenshotToDatabase(screenshotData) {
        try {
            const currentClassId = window.ClassLogger.currentClassId || window.ClassLogger.widget?.currentClassId;
            const teacherInfo = window.ClassLogger.Auth?.getTeacherInfo();
            
            console.log('📸 Attempting to save screenshot to database...');
            
            if (!currentClassId || !teacherInfo) {
                console.log('📸 No active class or teacher info, screenshot saved locally only');
                return { success: false, reason: 'No active class' };
            }
            
            const saveResponse = await window.ClassLogger.API.sendMessage({
                action: 'saveScreenshot',
                class_log_id: currentClassId,
                screenshot_data: screenshotData.dataUrl,
                screenshot_type: screenshotData.type,
                capture_type: screenshotData.captureType,
                timestamp: screenshotData.timestamp.toISOString()
            });
            
            if (saveResponse.success) {
                console.log('💾 Screenshot saved to database successfully');
                return { success: true, fileId: saveResponse.screenshot_id };
            } else {
                console.warn('⚠️ Failed to save screenshot to database:', saveResponse.error);
                return { success: false, error: saveResponse.error };
            }
            
        } catch (error) {
            console.error('❌ Error saving screenshot to database:', error);
            return { success: false, error: error.message };
        }
    },

    // EXISTING: Error handling and utility methods
    showScreenshotError(errorMessage) {
        const btn = document.getElementById('cl-screenshot-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '❌ Failed';
            btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 3000);
        }
        
        console.error('📸 Screenshot error:', errorMessage);
    },

    updateScreenshotCount() {
        const countEl = document.getElementById('cl-screenshot-count');
        const previewEl = document.getElementById('cl-screenshots-taken');
        const screenshotsEl = document.getElementById('cl-screenshots');
        const count = this.screenshots.length;
        
        if (countEl) countEl.textContent = `${count} taken`;
        if (previewEl) previewEl.textContent = `📸 Screenshots: ${count}`;
        if (screenshotsEl) screenshotsEl.textContent = count;
    },

    calculateDataUrlSize(dataUrl) {
        if (!dataUrl) return 0;
        
        try {
            const base64 = dataUrl.split(',')[1];
            if (!base64) return 0;
            return Math.round((base64.length * 3) / 4);
        } catch (error) {
            console.warn('Could not calculate screenshot size:', error);
            return 0;
        }
    },

    // EXISTING: Utility methods (keep your existing ones)
    getScreenshots() {
        return this.screenshots.map(screenshot => ({
            timestamp: screenshot.timestamp,
            type: screenshot.type,
            captureType: screenshot.captureType,
            fileSize: screenshot.fileSize
        }));
    },

    clearScreenshots() {
        console.log('🧹 Screenshots: Clearing all screenshots');
        this.screenshots = [];
        this.updateScreenshotCount();
    },

    getScreenshotStats() {
        const manual = this.screenshots.filter(s => s.type === 'manual').length;
        const auto = this.screenshots.filter(s => s.type === 'auto').length;
        const totalSize = this.screenshots.reduce((sum, s) => sum + (s.fileSize || 0), 0);
        
        // Enhanced stats with capture types
        const captureTypes = {};
        this.screenshots.forEach(s => {
            captureTypes[s.captureType] = (captureTypes[s.captureType] || 0) + 1;
        });
        
        return {
            total: this.screenshots.length,
            manual,
            auto,
            totalSize,
            averageSize: this.screenshots.length ? Math.round(totalSize / this.screenshots.length) : 0,
            captureTypes
        };
    },

    destroy() {
        console.log('🧹 Screenshots: Cleaning up screenshots module...');
        this.stopAutoScreenshots();
        this.clearScreenshots();
    }
};
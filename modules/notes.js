// REPLACE your modules/notes.js with this simple version:

window.ClassLogger = window.ClassLogger || {};

window.ClassLogger.Notes = {
    // Simple 4-field structure
    manualNotes: {
        overview: '',
        topics: '',
        files: '',
        details: '',
        lastSaved: null
    },
    
    autoSaveTimeout: null,
    
    initializeNotes() {
        console.log('📝 Notes: Initializing simple 4-field notes...');
        this.bindNotesEvents();
        this.loadExistingNotes();
        return true;
    },

    bindNotesEvents() {
        // Save buttons for each section
        const saveButtons = {
            'cl-save-overview': 'overview',
            'cl-save-topics': 'topics', 
            'cl-save-files': 'files',
            'cl-save-details': 'details'
        };
        
        Object.entries(saveButtons).forEach(([buttonId, section]) => {
            const btn = document.getElementById(buttonId);
            if (btn) {
                btn.onclick = () => this.saveNotes(section);
            }
        });

        // Auto-save on input changes
        const textareas = ['cl-overview', 'cl-topics', 'cl-files', 'cl-details'];
        textareas.forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                textarea.oninput = () => this.handleNotesInput(id);
                textarea.onpaste = () => setTimeout(() => this.handleNotesInput(id), 10);
            }
        });

        // Tab switching
        const notesTabButtons = document.querySelectorAll('.cl-notes-tab-btn');
        notesTabButtons.forEach(btn => {
            btn.onclick = () => this.switchNotesTab(btn.dataset.tab);
        });
    },

    handleNotesInput(fieldId) {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.autoSaveNotes();
        }, 3000);
        
        this.showUnsavedIndicator();
    },

    async autoSaveNotes() {
        try {
            console.log('💾 Notes: Auto-saving...');
            
            const noteData = this.collectNotesData();
            this.manualNotes = { ...noteData, lastSaved: new Date() };
            
            const currentClassId = window.ClassLogger.currentClassId;
            if (currentClassId && this.hasContent(noteData)) {
                await this.saveToDatabase(currentClassId, noteData);
            }
            
            this.showSavedIndicator();
            return { success: true };
            
        } catch (error) {
            console.error('❌ Auto-save failed:', error);
            this.showSaveError();
            return { success: false, error: error.message };
        }
    },

    async saveNotes(section = 'all') {
        try {
            console.log(`💾 Notes: Manual save for ${section}...`);
            
            const noteData = this.collectNotesData();
            this.manualNotes = { ...noteData, lastSaved: new Date() };
            
            const currentClassId = window.ClassLogger.currentClassId;
            if (currentClassId) {
                await this.saveToDatabase(currentClassId, noteData);
            }
            
            this.showSavedIndicator();
            return { success: true };
            
        } catch (error) {
            console.error('❌ Manual save failed:', error);
            this.showSaveError();
            return { success: false, error: error.message };
        }
    },

    // SIMPLE: Collect 4 fields directly
    collectNotesData() {
        return {
            overview: document.getElementById('cl-overview')?.value || '',
            topics: document.getElementById('cl-topics')?.value || '',
            files: document.getElementById('cl-files')?.value || '',
            details: document.getElementById('cl-details')?.value || ''
        };
    },

    // SIMPLE: Save directly to new 4 fields
    async saveToDatabase(classId, noteData) {
        try {
            console.log('💾 Notes: Saving to database class:', classId);
            console.log('📋 Data:', noteData);
            
            const response = await window.ClassLogger.API.sendMessage('saveClassContent', {
                class_log_id: classId,
                // Save directly to new fields
                overview: noteData.overview,
                topics: noteData.topics,
                files: noteData.files,
                details: noteData.details,
                timestamp: new Date().toISOString()
            });
            
            if (response && response.success) {
                console.log('✅ Notes saved to database');
                return { success: true };
            } else {
                console.warn('⚠️ Database save failed:', response?.error);
                return { success: false, error: response?.error || 'Unknown error' };
            }
            
        } catch (error) {
            console.error('❌ Database save error:', error);
            return { success: false, error: error.message };
        }
    },

    loadExistingNotes() {
        console.log('📂 Notes: Loading existing notes...');
        
        const inputs = {
            'cl-overview': this.manualNotes.overview,
            'cl-topics': this.manualNotes.topics,
            'cl-files': this.manualNotes.files,
            'cl-details': this.manualNotes.details
        };
        
        Object.entries(inputs).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
            }
        });
        
        if (this.manualNotes.lastSaved) {
            this.showSavedIndicator();
        }
    },

    switchNotesTab(tabName) {
        console.log('📑 Notes: Switching to tab:', tabName);
        
        // Update tab buttons
        document.querySelectorAll('.cl-notes-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.cl-notes-pane').forEach(pane => {
            if (pane.id === `cl-notes-${tabName}`) {
                pane.classList.add('active');
                pane.style.display = 'block';
            } else {
                pane.classList.remove('active');
                pane.style.display = 'none';
            }
        });
    },

    showUnsavedIndicator() {
        document.querySelectorAll('[id^="cl-save-"]').forEach(btn => {
            if (btn && !btn.disabled) {
                btn.textContent = btn.textContent.replace('💾', '⚠️').replace('Save', 'Save*');
                btn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            }
        });
    },

    showSavedIndicator() {
        document.querySelectorAll('[id^="cl-save-"]').forEach(btn => {
            if (btn) {
                btn.textContent = '✅ Saved';
                btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                
                setTimeout(() => {
                    if (btn.textContent === '✅ Saved') {
                        const section = btn.id.replace('cl-save-', '');
                        btn.textContent = `💾 Save ${section.charAt(0).toUpperCase() + section.slice(1)}`;
                        btn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                    }
                }, 2000);
            }
        });
    },

    showSaveError() {
        document.querySelectorAll('[id^="cl-save-"]').forEach(btn => {
            if (btn) {
                btn.textContent = '❌ Error';
                btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                
                setTimeout(() => {
                    const section = btn.id.replace('cl-save-', '');
                    btn.textContent = `💾 Save ${section.charAt(0).toUpperCase() + section.slice(1)}`;
                    btn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                }, 3000);
            }
        });
    },

    hasContent(noteData) {
        const combined = Object.values(noteData).join('').trim();
        return combined.length >= 5;
    },

    getNotesData() {
        return {
            ...this.manualNotes,
            lastSaved: this.manualNotes.lastSaved
        };
    },

    clearNotes() {
        console.log('🧹 Notes: Clearing notes...');
        
        this.manualNotes = {
            overview: '',
            topics: '',
            files: '',
            details: '',
            lastSaved: null
        };
        
        ['cl-overview', 'cl-topics', 'cl-files', 'cl-details'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        
        clearTimeout(this.autoSaveTimeout);
    },

    init() {
        console.log('🚀 Notes: Initializing notes module...');
        this.clearNotes();
        return true;
    },

    destroy() {
        console.log('🧹 Notes: Cleaning up notes module...');
        clearTimeout(this.autoSaveTimeout);
        this.clearNotes();
    }
};
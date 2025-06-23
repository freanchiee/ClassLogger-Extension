// ===== ClassLogger Content Script v2.1 =====
// Complete implementation with token authentication and all features

(function() {
  'use strict';
  
  // Prevent multiple initializations
  if (window.classLoggerInitialized) {
      console.log('🎓 ClassLogger: Already initialized');
      return;
  }
  window.classLoggerInitialized = true;

  class ClassLoggerWidget {
      constructor() {
          this.meetUrl = window.location.href;
          this.currentClassId = null;
          this.classStatus = 'not_started';
          this.enrollmentInfo = null;
          this.isLoggedIn = false;
          this.teacherInfo = null;
          this.autoRefreshInterval = null;
          this.isMinimized = false;
          this.screenshots = [];
          this.autoScreenshotInterval = null;
          this.timerInterval = null;
          this.startTime = null;
          this.autoSaveTimeout = null;
          
          // Class content tracking
          this.classContent = {
              startTime: null,
              endTime: null,
              chatMessages: [],
              participantCount: 0,
              maxParticipants: 0,
              screenShareDetected: false,
              recordingDetected: false,
              breakoutRoomsUsed: false,
              topicsDiscussed: new Set(),
              files: [],
              screenshots: [],
              manualNotes: {
                  classDescription: '',
                  topicsCovered: '',
                  homeworkAssigned: '',
                  keyPoints: '',
                  followUpNeeded: '',
                  lastSaved: null
              }
          };
          
          // Monitoring intervals
          this.participantMonitor = null;
          this.featureMonitor = null;
          this.chatMonitor = null;
          this.screenShareMonitor = null;
          
          // Avoid duplicate widgets
          if (document.getElementById('classlogger-widget')) {
              console.log('🎓 ClassLogger: Widget already exists');
              return;
          }
          
          console.log('🎓 ClassLogger: Creating enhanced widget with all features');
          this.init();
          this.startAutoRefresh();
      }

      async init() {
          console.log('🎓 ClassLogger: Initializing on', this.meetUrl);
          
          try {
              // Check if user is logged in
              const authStatus = await this.sendMessage({ action: 'getAuthStatus' });
              
              if (!authStatus || !authStatus.success) {
                  console.log('⚠️ ClassLogger: Auth check failed, showing login prompt');
                  this.createLoginPrompt();
                  return;
              }

              if (!authStatus.loggedIn) {
                  console.log('👤 ClassLogger: Not logged in, showing login prompt');
                  this.createLoginPrompt();
                  return;
              }

              console.log('✅ ClassLogger: User logged in as', authStatus.teacherName);
              this.isLoggedIn = true;
              this.teacherInfo = {
                  name: authStatus.teacherName,
                  id: authStatus.teacherId,
                  email: authStatus.teacherEmail,
                  loginMethod: 'Token'
              };

              // Check if this Meet URL belongs to teacher's classes
              await this.checkMeetUrl();

          } catch (error) {
              console.error('❌ ClassLogger: Initialization error:', error);
              this.createErrorWidget('Failed to connect to ClassLogger API');
          }
      }

      startAutoRefresh() {
          this.autoRefreshInterval = setInterval(async () => {
              if (!this.isLoggedIn) {
                  console.log('🔄 ClassLogger: Auto-checking login state...');
                  await this.init();
              }
          }, 60000);
      }

      stopAutoRefresh() {
          if (this.autoRefreshInterval) {
              clearInterval(this.autoRefreshInterval);
              this.autoRefreshInterval = null;
          }
      }

      async checkMeetUrl() {
          try {
              console.log('🔍 ClassLogger: Checking Meet URL...');
              
              const urlCheck = await this.sendMessage({ 
                  action: 'checkMeetUrl', 
                  meetUrl: this.meetUrl 
              });

              if (!urlCheck || !urlCheck.success) {
                  console.log('❌ ClassLogger: Meet URL check failed:', urlCheck?.error);
                  this.createNoClassWidget(urlCheck?.error || 'This Meet URL is not associated with any of your enrolled students');
                  return;
              }

              console.log('✅ ClassLogger: Valid Meet URL found for student:', urlCheck.enrollment.student_name);
              this.enrollmentInfo = urlCheck.enrollment;
              this.createWidget();
              
          } catch (error) {
              console.error('❌ ClassLogger: Meet URL check error:', error);
              this.createNoClassWidget('Unable to verify Meet URL - API endpoints may not be available');
          }
      }

      createLoginPrompt() {
          const widget = this.createBaseWidget(`
              <div class="cl-header">
                  <div class="cl-header-content">
                      <span class="cl-icon">🎓</span>
                      <span class="cl-title">ClassLogger</span>
                  </div>
              </div>
              <div class="cl-main-content">
                  <div class="cl-status cl-warning">Please login to use ClassLogger</div>
                  <div class="cl-help">
                      Click the ClassLogger extension icon in your browser toolbar to enter your weekly token
                  </div>
                  <button id="cl-open-popup-btn" class="cl-btn cl-btn-primary">
                      🔐 Click to Login
                  </button>
                  <div class="cl-auto-refresh">
                      <span class="cl-refresh-indicator">🔄</span>
                      <span class="cl-refresh-text">Auto-checking login state...</span>
                  </div>
              </div>
          `);

          const openPopupBtn = document.getElementById('cl-open-popup-btn');
          if (openPopupBtn) {
              openPopupBtn.onclick = () => {
                  alert('Please click the ClassLogger extension icon in your browser toolbar to enter your weekly token');
              };
          }
      }

      createErrorWidget(message) {
          const widget = this.createBaseWidget(`
              <div class="cl-header">
                  <div class="cl-header-content">
                      <span class="cl-icon">🎓</span>
                      <span class="cl-title">ClassLogger</span>
                  </div>
              </div>
              <div class="cl-main-content">
                  <div class="cl-status cl-error">
                      ⚠️ ${message}
                  </div>
                  <div class="cl-help">
                      Please check that your ClassLogger API is running on localhost:3000 and you have a valid token.
                  </div>
                  <button id="cl-retry-btn" class="cl-btn cl-btn-secondary">
                      🔄 Retry Connection
                  </button>
              </div>
          `);

          const retryBtn = document.getElementById('cl-retry-btn');
          if (retryBtn) {
              retryBtn.onclick = () => this.init();
          }
      }

      createNoClassWidget(reason = 'Meet URL not found in your classes') {
          const widget = this.createBaseWidget(`
              <div class="cl-header">
                  <div class="cl-header-content">
                      <span class="cl-icon">🎓</span>
                      <span class="cl-title">ClassLogger</span>
                  </div>
              </div>
              <div class="cl-main-content">
                  <div class="cl-status cl-warning">
                      📚 ${reason}
                  </div>
                  <div class="cl-help">
                      ${this.isLoggedIn ? 
                          'Make sure you\'re using the Google Meet URL from your student enrollments. The URL should match exactly what\'s in your ClassLogger dashboard.' : 
                          'Please login first using the extension popup'
                      }
                  </div>
                  <div class="cl-teacher-info">
                      ${this.teacherInfo ? `Logged in as: ${this.teacherInfo.name} (${this.teacherInfo.loginMethod})` : 'Not logged in'}
                  </div>
                  ${this.isLoggedIn ? `
                      <button id="cl-refresh-btn" class="cl-btn cl-btn-secondary">
                          🔄 Check Again
                      </button>
                  ` : ''}
              </div>
          `);

          const refreshBtn = document.getElementById('cl-refresh-btn');
          if (refreshBtn) {
              refreshBtn.onclick = () => this.checkMeetUrl();
          }
      }

      createWidget() {
          const studentName = this.enrollmentInfo?.student_name || 'Student';
          const subject = this.enrollmentInfo?.subject || 'Class';

          const widget = this.createBaseWidget(`
              <div class="cl-header">
                  <div class="cl-header-content">
                      <span class="cl-icon">🎓</span>
                      <span class="cl-title">ClassLogger</span>
                  </div>
                  <button id="cl-minimize-btn" class="cl-minimize-btn" title="Minimize">
                      <span id="cl-minimize-icon">−</span>
                  </button>
              </div>
              
              <div id="cl-main-content" class="cl-main-content">
                  <div class="cl-class-info">
                      <div class="cl-student">👨‍🎓 ${studentName}</div>
                      <div class="cl-subject">📚 ${subject}</div>
                  </div>
                  
                  <div id="cl-status" class="cl-status">Ready to start class</div>
                  
                  <div class="cl-actions">
                      <button id="cl-start-btn" class="cl-btn cl-btn-success">
                          🟢 Start Class
                      </button>
                      <button id="cl-end-btn" class="cl-btn cl-btn-danger" style="display: none;">
                          🔴 End Class
                      </button>
                      <button id="cl-notes-btn" class="cl-btn cl-btn-secondary" style="display: none;">
                          📝 Notes
                      </button>
                  </div>
                  
                  <!-- Screenshot Controls -->
                  <div id="cl-screenshot-controls" class="cl-screenshot-controls" style="display: none;">
                      <button id="cl-screenshot-btn" class="cl-btn cl-btn-purple">
                          📸 Screenshot
                      </button>
                      <button id="cl-auto-screenshot-btn" class="cl-btn cl-btn-purple" data-active="false">
                          🔄 Auto (Off)
                      </button>
                      <span id="cl-screenshot-count" class="cl-screenshot-count">0 taken</span>
                  </div>
                  
                  <div id="cl-timer" class="cl-timer" style="display: none;">
                      <span id="cl-duration">00:00</span>
                  </div>
                  
                  <!-- Manual Notes Section -->
                  <div id="cl-notes-section" class="cl-notes-section" style="display: none;">
                      <div class="cl-notes-header">
                          <span class="cl-notes-title">📝 Class Notes</span>
                          <button id="cl-close-notes" class="cl-close-btn">✕</button>
                      </div>
                      
                      <div class="cl-notes-tabs">
                          <button class="cl-tab-btn cl-tab-active" data-tab="description">Description</button>
                          <button class="cl-tab-btn" data-tab="topics">Topics</button>
                          <button class="cl-tab-btn" data-tab="homework">Homework</button>
                          <button class="cl-tab-btn" data-tab="points">Key Points</button>
                      </div>
                      
                      <div class="cl-notes-content">
                          <div id="tab-description" class="cl-tab-content cl-tab-active">
                              <textarea id="cl-class-description" placeholder="What did you cover in this class? Brief description of the lesson..." 
                                        rows="3" class="cl-notes-input"></textarea>
                          </div>
                          
                          <div id="tab-topics" class="cl-tab-content">
                              <textarea id="cl-topics-covered" placeholder="List the main topics discussed (one per line)..." 
                                        rows="3" class="cl-notes-input"></textarea>
                          </div>
                          
                          <div id="tab-homework" class="cl-tab-content">
                              <textarea id="cl-homework-assigned" placeholder="Homework assignments, practice problems, or tasks given..." 
                                        rows="3" class="cl-notes-input"></textarea>
                          </div>
                          
                          <div id="tab-points" class="cl-tab-content">
                              <textarea id="cl-key-points" placeholder="Important points, student questions, areas needing follow-up..." 
                                        rows="3" class="cl-notes-input"></textarea>
                          </div>
                      </div>
                      
                      <div class="cl-notes-actions">
                          <button id="cl-save-notes" class="cl-btn cl-btn-primary">💾 Save Notes</button>
                          <span id="cl-notes-status" class="cl-notes-status"></span>
                      </div>
                  </div>
                  
                  <!-- Class Content Preview -->
                  <div id="cl-content-preview" class="cl-content-preview" style="display: none;">
                      <div class="cl-content-header">📊 Class Activity</div>
                      <div id="cl-participant-count" class="cl-stat">👥 Participants: 0</div>
                      <div id="cl-features-used" class="cl-stat">🔧 Features: None</div>
                      <div id="cl-screenshots-taken" class="cl-stat">📸 Screenshots: 0</div>
                      <div id="cl-notes-preview" class="cl-stat" style="display: none;">📝 Notes: Added</div>
                  </div>
                  
                  <div class="cl-teacher-info">
                      Logged in as: ${this.teacherInfo?.name || 'Teacher'} (${this.teacherInfo?.loginMethod || 'Unknown'})
                  </div>
              </div>
          `);

          this.stopAutoRefresh();
          this.bindEvents();
      }

      // Screenshot functionality
      async takeScreenshot() {
          try {
              console.log('📸 Taking screenshot...');
              
              const screenshotResponse = await this.sendMessage({
                  action: 'takeScreenshot'
              });

              if (screenshotResponse && screenshotResponse.success) {
                  this.classContent.screenshots.push({
                      timestamp: new Date(),
                      dataUrl: screenshotResponse.dataUrl,
                      type: 'manual'
                  });
                  
                  this.updateScreenshotCount();
                  this.showScreenshotFeedback();
                  console.log('✅ Screenshot taken successfully');
              } else {
                  console.error('❌ Screenshot failed:', screenshotResponse?.error);
                  this.showScreenshotError(screenshotResponse?.error || 'Screenshot failed');
              }
          } catch (error) {
              console.error('❌ Screenshot error:', error);
              this.showScreenshotError('Screenshot not available');
          }
      }

      startAutoScreenshots() {
          this.autoScreenshotInterval = setInterval(() => {
              this.takeAutoScreenshot();
          }, 60000); // Every 1 minute

          const autoBtn = document.getElementById('cl-auto-screenshot-btn');
          if (autoBtn) {
              autoBtn.textContent = '🔄 Auto (On)';
              autoBtn.dataset.active = 'true';
              autoBtn.style.background = 'linear-gradient(135deg, #42d88e 0%, #1b7888 100%)';
              autoBtn.style.color = 'white';
          }
      }

      stopAutoScreenshots() {
          if (this.autoScreenshotInterval) {
              clearInterval(this.autoScreenshotInterval);
              this.autoScreenshotInterval = null;
          }

          const autoBtn = document.getElementById('cl-auto-screenshot-btn');
          if (autoBtn) {
              autoBtn.textContent = '🔄 Auto (Off)';
              autoBtn.dataset.active = 'false';
              autoBtn.style.background = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
              autoBtn.style.color = 'white';
          }
      }

      async takeAutoScreenshot() {
          try {
              const screenshotResponse = await this.sendMessage({
                  action: 'takeScreenshot'
              });

              if (screenshotResponse && screenshotResponse.success) {
                  this.classContent.screenshots.push({
                      timestamp: new Date(),
                      dataUrl: screenshotResponse.dataUrl,
                      type: 'auto'
                  });
                  
                  this.updateScreenshotCount();
                  console.log('✅ Auto screenshot taken');
              }
          } catch (error) {
              console.log('Auto screenshot failed:', error.message);
          }
      }

      updateScreenshotCount() {
          const countEl = document.getElementById('cl-screenshot-count');
          const previewEl = document.getElementById('cl-screenshots-taken');
          const count = this.classContent.screenshots.length;
          
          if (countEl) {
              countEl.textContent = `${count} taken`;
          }
          if (previewEl) {
              previewEl.textContent = `📸 Screenshots: ${count}`;
          }
      }

      showScreenshotFeedback() {
          const btn = document.getElementById('cl-screenshot-btn');
          if (btn) {
              const originalText = btn.textContent;
              btn.textContent = '✅ Captured!';
              btn.style.background = 'linear-gradient(135deg, #42d88e 0%, #34d399 100%)';
              
              setTimeout(() => {
                  btn.textContent = originalText;
                  btn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
              }, 1500);
          }
      }

      showScreenshotError(message) {
          const btn = document.getElementById('cl-screenshot-btn');
          if (btn) {
              const originalText = btn.textContent;
              btn.textContent = '❌ Failed';
              btn.style.background = 'linear-gradient(135deg, #f16565 0%, #ef4444 100%)';
              
              setTimeout(() => {
                  btn.textContent = originalText;
                  btn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
              }, 2000);
          }
      }

      showScreenshotControls() {
          const controls = document.getElementById('cl-screenshot-controls');
          if (controls) {
              controls.style.display = 'flex';
          }
      }

      hideScreenshotControls() {
          const controls = document.getElementById('cl-screenshot-controls');
          if (controls) {
              controls.style.display = 'none';
          }
          this.stopAutoScreenshots();
      }

      // Notes functionality
      toggleNotesSection() {
          const notesSection = document.getElementById('cl-notes-section');
          if (notesSection) {
              const isVisible = notesSection.style.display !== 'none';
              if (isVisible) {
                  this.hideNotesSection();
              } else {
                  this.showNotesSection();
              }
          }
      }

      showNotesSection() {
          const notesSection = document.getElementById('cl-notes-section');
          if (notesSection) {
              notesSection.style.display = 'block';
              this.loadSavedNotes();
          }
      }

      hideNotesSection() {
          const notesSection = document.getElementById('cl-notes-section');
          if (notesSection) {
              notesSection.style.display = 'none';
          }
      }

      switchNotesTab(tabName) {
          document.querySelectorAll('.cl-tab-btn').forEach(btn => {
              btn.classList.remove('cl-tab-active');
          });
          document.querySelectorAll('.cl-tab-content').forEach(content => {
              content.classList.remove('cl-tab-active');
          });

          document.querySelector(`[data-tab="${tabName}"]`).classList.add('cl-tab-active');
          document.getElementById(`tab-${tabName}`).classList.add('cl-tab-active');
      }

      async saveNotes() {
          try {
              const notes = this.collectNotesData();
              this.classContent.manualNotes = { ...notes, lastSaved: new Date() };
              
              this.updateNotesStatus('💾 Saved!', 'success');
              this.updateNotesPreview();
              
              setTimeout(() => {
                  this.updateNotesStatus('', '');
              }, 2000);
              
          } catch (error) {
              console.error('Failed to save notes:', error);
              this.updateNotesStatus('❌ Save failed', 'error');
          }
      }

      async autoSaveNotes() {
          try {
              const notes = this.collectNotesData();
              this.classContent.manualNotes = { ...notes, lastSaved: new Date() };
              this.updateNotesStatus('💾 Auto-saved', 'auto');
              this.updateNotesPreview();
              
              setTimeout(() => {
                  this.updateNotesStatus('', '');
              }, 1000);
              
          } catch (error) {
              console.error('Auto-save failed:', error);
          }
      }

      collectNotesData() {
          return {
              classDescription: document.getElementById('cl-class-description')?.value || '',
              topicsCovered: document.getElementById('cl-topics-covered')?.value || '',
              homeworkAssigned: document.getElementById('cl-homework-assigned')?.value || '',
              keyPoints: document.getElementById('cl-key-points')?.value || ''
          };
      }

      loadSavedNotes() {
          const notes = this.classContent.manualNotes;
          if (notes) {
              const descEl = document.getElementById('cl-class-description');
              const topicsEl = document.getElementById('cl-topics-covered');
              const homeworkEl = document.getElementById('cl-homework-assigned');
              const pointsEl = document.getElementById('cl-key-points');

              if (descEl) descEl.value = notes.classDescription || '';
              if (topicsEl) topicsEl.value = notes.topicsCovered || '';
              if (homeworkEl) homeworkEl.value = notes.homeworkAssigned || '';
              if (pointsEl) pointsEl.value = notes.keyPoints || '';
          }
      }

      updateNotesStatus(message, type) {
          const statusEl = document.getElementById('cl-notes-status');
          if (statusEl) {
              statusEl.textContent = message;
              statusEl.className = `cl-notes-status cl-notes-${type}`;
          }
      }

      updateNotesPreview() {
          const previewEl = document.getElementById('cl-notes-preview');
          const notes = this.classContent.manualNotes;
          
          if (previewEl) {
              const hasNotes = notes.classDescription || notes.topicsCovered || 
                            notes.homeworkAssigned || notes.keyPoints;
              
              if (hasNotes) {
                  previewEl.style.display = 'block';
                  previewEl.textContent = '📝 Notes: Added';
              } else {
                  previewEl.style.display = 'none';
              }
          }
      }

      bindNotesEvents() {
          const closeBtn = document.getElementById('cl-close-notes');
          if (closeBtn) {
              closeBtn.onclick = () => this.hideNotesSection();
          }

          const tabButtons = document.querySelectorAll('.cl-tab-btn');
          tabButtons.forEach(btn => {
              btn.onclick = () => this.switchNotesTab(btn.dataset.tab);
          });

          const saveBtn = document.getElementById('cl-save-notes');
          if (saveBtn) {
              saveBtn.onclick = () => this.saveNotes();
          }

          const textareas = document.querySelectorAll('.cl-notes-input');
          textareas.forEach(textarea => {
              textarea.oninput = () => {
                  clearTimeout(this.autoSaveTimeout);
                  this.autoSaveTimeout = setTimeout(() => {
                      this.autoSaveNotes();
                  }, 2000);
              };
          });
      }

      generateClassSummary() {
          const duration = this.classContent.endTime - this.classContent.startTime;
          const durationMinutes = Math.round(duration / (1000 * 60));
          const notes = this.classContent.manualNotes;

          const summary = {
              duration_minutes: durationMinutes,
              max_participants: this.classContent.maxParticipants,
              features_used: [],
              content_summary: '',
              topics_covered: [],
              manual_notes: notes,
              homework_assigned: notes.homeworkAssigned || null,
              screenshots_taken: this.classContent.screenshots.length,
              screenshots: this.classContent.screenshots.map(s => ({
                  timestamp: s.timestamp,
                  type: s.type
              }))
          };

          // Add detected features
          if (this.classContent.screenShareDetected) summary.features_used.push('Screen Sharing');
          if (this.classContent.recordingDetected) summary.features_used.push('Recording');
          if (this.classContent.chatMessages.length > 0) summary.features_used.push('Chat');
          if (this.classContent.screenshots.length > 0) summary.features_used.push('Screenshots');

          // Generate content summary (prioritize manual notes)
          if (notes.classDescription) {
              summary.content_summary = notes.classDescription;
          } else {
              // Fallback to auto-generated summary
              const parts = [];
              if (this.classContent.maxParticipants > 1) {
                  parts.push(`Interactive session with ${this.classContent.maxParticipants} participants`);
              }
              if (this.classContent.screenShareDetected) {
                  parts.push('included screen sharing/presentation');
              }
              if (this.classContent.screenshots.length > 0) {
                  parts.push(`with ${this.classContent.screenshots.length} screenshots captured`);
              }
              if (this.classContent.chatMessages.length > 0) {
                  parts.push(`and ${this.classContent.chatMessages.length} chat interactions`);
              }

              summary.content_summary = parts.length > 0 
                  ? `${this.enrollmentInfo?.subject || 'Class'} session ${parts.join(', ')}.`
                  : `${this.enrollmentInfo?.subject || 'Class'} session completed via Google Meet.`;
          }

          // Handle topics covered (prioritize manual notes)
          if (notes.topicsCovered) {
              summary.topics_covered = notes.topicsCovered
                  .split('\n')
                  .map(topic => topic.trim())
                  .filter(topic => topic.length > 0);
          } else {
              // Fallback to subject-based topics
              const subject = this.enrollmentInfo?.subject || '';
              if (subject.toLowerCase().includes('math')) {
                  summary.topics_covered = ['Mathematical concepts', 'Problem solving'];
              } else if (subject.toLowerCase().includes('physics')) {
                  summary.topics_covered = ['Physics principles', 'Scientific concepts'];
              } else if (subject.toLowerCase().includes('english')) {
                  summary.topics_covered = ['Language skills', 'Communication'];
              } else {
                  summary.topics_covered = ['Subject fundamentals', 'Interactive learning'];
              }
          }

          return summary;
      }

      startContentMonitoring() {
          console.log('📊 ClassLogger: Starting content monitoring');
          
          this.participantMonitor = setInterval(() => {
              this.detectParticipants();
          }, 10000);

          this.featureMonitor = setInterval(() => {
              this.detectMeetFeatures();
          }, 5000);

          this.chatMonitor = setInterval(() => {
              this.detectChatActivity();
          }, 3000);

          this.screenShareMonitor = setInterval(() => {
              this.detectScreenShare();
          }, 2000);
      }

      stopContentMonitoring() {
          console.log('📊 ClassLogger: Stopping content monitoring');
          
          if (this.participantMonitor) clearInterval(this.participantMonitor);
          if (this.featureMonitor) clearInterval(this.featureMonitor);
          if (this.chatMonitor) clearInterval(this.chatMonitor);
          if (this.screenShareMonitor) clearInterval(this.screenShareMonitor);
      }

      detectParticipants() {
          try {
              const participantSelectors = [
                  '[data-allocation-index]',
                  '[data-participant-id]',
                  '.participantNameContainer',
                  '[jsname="nJMiKe"]'
              ];

              let count = 0;
              for (const selector of participantSelectors) {
                  const elements = document.querySelectorAll(selector);
                  if (elements.length > count) {
                      count = elements.length;
                  }
              }

              if (count > 0) count += 1;
              
              this.classContent.participantCount = count;
              this.classContent.maxParticipants = Math.max(this.classContent.maxParticipants, count);

              this.updateParticipantDisplay();
          } catch (error) {
              console.log('Could not detect participants:', error.message);
          }
      }

      detectMeetFeatures() {
          try {
              const features = [];

              if (document.querySelector('[aria-label*="recording" i], [aria-label*="record" i]')) {
                  this.classContent.recordingDetected = true;
                  features.push('Recording');
              }

              if (document.querySelector('[aria-label*="screen" i], [aria-label*="present" i]')) {
                  this.classContent.screenShareDetected = true;
                  features.push('Screen Share');
              }

              if (document.querySelector('[aria-label*="caption" i], [aria-label*="subtitle" i]')) {
                  features.push('Captions');
              }

              if (document.querySelector('[aria-label*="whiteboard" i], [aria-label*="jamboard" i]')) {
                  features.push('Whiteboard');
              }

              this.updateFeaturesDisplay(features);
          } catch (error) {
              console.log('Could not detect features:', error.message);
          }
      }

      detectChatActivity() {
          try {
              const chatSelectors = [
                  '[data-message-text]',
                  '.chat-message',
                  '[jsname="bgckF"]'
              ];

              for (const selector of chatSelectors) {
                  const messages = document.querySelectorAll(selector);
                  if (messages.length > this.classContent.chatMessages.length) {
                      this.classContent.chatMessages.push({
                          timestamp: new Date(),
                          count: messages.length
                      });
                      break;
                  }
              }
          } catch (error) {
              console.log('Could not detect chat:', error.message);
          }
      }

      detectScreenShare() {
          try {
              const presentingIndicators = [
                  '[aria-label*="presenting" i]',
                  '[aria-label*="shared screen" i]',
                  '.presenting-indicator'
              ];

              for (const selector of presentingIndicators) {
                  if (document.querySelector(selector)) {
                      this.classContent.screenShareDetected = true;
                      break;
                  }
              }
          } catch (error) {
              console.log('Could not detect screen share:', error.message);
          }
      }

      updateParticipantDisplay() {
          const participantEl = document.getElementById('cl-participant-count');
          if (participantEl) {
              participantEl.textContent = `👥 Participants: ${this.classContent.participantCount} (max: ${this.classContent.maxParticipants})`;
          }
      }

      updateFeaturesDisplay(features) {
          const featuresEl = document.getElementById('cl-features-used');
          if (featuresEl) {
              featuresEl.textContent = `🔧 Features: ${features.length > 0 ? features.join(', ') : 'Basic session'}`;
          }
      }

      showContentPreview() {
          const previewEl = document.getElementById('cl-content-preview');
          if (previewEl) {
              previewEl.style.display = 'block';
          }
      }

      hideContentPreview() {
          const previewEl = document.getElementById('cl-content-preview');
          if (previewEl) {
              previewEl.style.display = 'none';
          }
      }

      toggleMinimize() {
          const widget = document.getElementById('classlogger-widget');
          const minimizeIcon = document.getElementById('cl-minimize-icon');
          
          if (widget && minimizeIcon) {
              this.isMinimized = !this.isMinimized;
              
              if (this.isMinimized) {
                  widget.classList.add('minimized');
                  minimizeIcon.textContent = '+';
                  widget.title = 'Click to expand ClassLogger';
              } else {
                  widget.classList.remove('minimized');
                  minimizeIcon.textContent = '−';
                  widget.title = '';
              }
          }
      }

      async startClass() {
          try {
              const startBtn = document.getElementById('cl-start-btn');
              if (startBtn) {
                  startBtn.disabled = true;
                  startBtn.textContent = '⏳ Starting...';
              }

              this.updateStatus('Starting class...', 'loading');
              this.classContent.startTime = new Date();
              this.startContentMonitoring();

              const response = await this.sendMessage({
                  action: 'startClass',
                  data: {
                      meetUrl: this.meetUrl,
                      student_email: this.enrollmentInfo?.student_email,
                      enrollment_id: this.enrollmentInfo?.id
                  }
              });

              if (response && response.success) {
                  this.currentClassId = response.class_log_id;
                  this.classStatus = 'ongoing';
                  
                  const statusMessage = response.resumed ? 
                      'Class resumed - Monitoring activity' : 'Class started - Monitoring activity';
                  
                  this.updateStatus(statusMessage, 'ongoing');
                  this.startTimer(response.class_data?.start_time);
                  this.showContentPreview();
                  this.showScreenshotControls();
                  console.log('✅ ClassLogger: Class started successfully with ID:', this.currentClassId);
              } else {
                  const error = response?.error || 'Failed to start class';
                  this.updateStatus(`Failed to start: ${error}`, 'error');
                  this.stopContentMonitoring();
                  
                  if (startBtn) {
                      startBtn.disabled = false;
                      startBtn.textContent = '🟢 Start Class';
                  }
              }
          } catch (error) {
              console.error('❌ ClassLogger: Start class error:', error);
              this.updateStatus('Error: Failed to start class', 'error');
              this.stopContentMonitoring();
              
              const startBtn = document.getElementById('cl-start-btn');
              if (startBtn) {
                  startBtn.disabled = false;
                  startBtn.textContent = '🟢 Start Class';
              }
          }
      }

      async endClass() {
          try {
              this.updateStatus('Ending class...', 'loading');
              this.classContent.endTime = new Date();
              this.stopContentMonitoring();
              this.stopAutoScreenshots();

              const classSummary = this.generateClassSummary();

              const response = await this.sendMessage({
                  action: 'endClass',
                  data: {
                      class_log_id: this.currentClassId,
                      classContent: classSummary
                  }
              });

              if (response && response.success) {
                  this.classStatus = 'completed';
                  this.updateStatus(`Class completed (${response.duration_minutes || 0} min)`, 'completed');
                  this.stopTimer();
                  this.hideContentPreview();
                  this.hideScreenshotControls();
                  console.log('✅ ClassLogger: Class ended with enhanced summary:', classSummary);
              } else {
                  const error = response?.error || 'Failed to end class';
                  
                  if (error.includes('Extension context invalidated') || error.includes('Extension was updated')) {
                      this.showContextInvalidatedError();
                  } else {
                      this.updateStatus(`Failed to end: ${error}`, 'error');
                  }
              }
          } catch (error) {
              console.error('❌ ClassLogger: End class error:', error);
              
              if (error.message.includes('Extension context invalidated')) {
                  this.showContextInvalidatedError();
              } else {
                  this.updateStatus('Error: Failed to end class', 'error');
              }
          }
      }

      showContextInvalidatedError() {
          const widget = this.createBaseWidget(`
              <div class="cl-header">
                  <div class="cl-header-content">
                      <span class="cl-icon">🎓</span>
                      <span class="cl-title">ClassLogger</span>
                  </div>
              </div>
              <div class="cl-main-content">
                  <div class="cl-status cl-error">
                      🔄 Extension was updated during class
                  </div>
                  <div class="cl-help">
                      The extension was updated while your class was running. 
                      Please refresh this page to restore functionality.
                  </div>
                  <div class="cl-actions">
                      <button id="cl-refresh-page-btn" class="cl-btn cl-btn-primary">
                          🔄 Refresh Page
                      </button>
                  </div>
                  <div class="cl-teacher-info">
                      Your class data has been saved automatically
                  </div>
              </div>
          `);

          const refreshBtn = document.getElementById('cl-refresh-page-btn');
          if (refreshBtn) {
              refreshBtn.onclick = () => {
                  window.location.reload();
              };
          }
      }

      updateStatus(message, type) {
          const statusEl = document.getElementById('cl-status');
          const startBtn = document.getElementById('cl-start-btn');
          const endBtn = document.getElementById('cl-end-btn');
          const notesBtn = document.getElementById('cl-notes-btn');

          if (statusEl) {
              statusEl.textContent = message;
              statusEl.className = `cl-status ${type === 'ongoing' ? 'cl-ongoing' : type === 'error' ? 'cl-error' : type === 'warning' ? 'cl-warning' : ''}`;
          }

          if (startBtn && endBtn && notesBtn) {
              if (type === 'ongoing') {
                  startBtn.style.display = 'none';
                  endBtn.style.display = 'block';
                  notesBtn.style.display = 'block';
              } else if (type === 'completed') {
                  startBtn.style.display = 'block';
                  endBtn.style.display = 'none';
                  notesBtn.style.display = 'none';
                  startBtn.textContent = '🟢 Start New Class';
                  startBtn.disabled = false;
              } else {
                  startBtn.style.display = 'block';
                  endBtn.style.display = 'none';
                  notesBtn.style.display = 'none';
              }
          }
      }

      startTimer(existingStartTime = null) {
          const timerEl = document.getElementById('cl-timer');
          const durationEl = document.getElementById('cl-duration');
          
          if (timerEl && durationEl) {
              timerEl.style.display = 'block';
              timerEl.classList.add('cl-active');
              
              this.startTime = existingStartTime ? new Date(existingStartTime).getTime() : Date.now();
              
              this.timerInterval = setInterval(() => {
                  const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                  const minutes = Math.floor(elapsed / 60);
                  const seconds = elapsed % 60;
                  durationEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
              }, 1000);
          }
      }

      stopTimer() {
          const timerEl = document.getElementById('cl-timer');
          
          if (this.timerInterval) {
              clearInterval(this.timerInterval);
              this.timerInterval = null;
          }
          
          if (timerEl) {
              timerEl.classList.remove('cl-active');
          }
      }

      bindEvents() {
          const startBtn = document.getElementById('cl-start-btn');
          const endBtn = document.getElementById('cl-end-btn');
          const notesBtn = document.getElementById('cl-notes-btn');
          const minimizeBtn = document.getElementById('cl-minimize-btn');
          const screenshotBtn = document.getElementById('cl-screenshot-btn');
          const autoScreenshotBtn = document.getElementById('cl-auto-screenshot-btn');

          if (startBtn) {
              startBtn.onclick = () => this.startClass();
          }
          if (endBtn) {
              endBtn.onclick = () => this.endClass();
          }
          if (notesBtn) {
              notesBtn.onclick = () => this.toggleNotesSection();
          }
          if (minimizeBtn) {
              minimizeBtn.onclick = () => this.toggleMinimize();
          }
          if (screenshotBtn) {
              screenshotBtn.onclick = () => this.takeScreenshot();
          }
          if (autoScreenshotBtn) {
              autoScreenshotBtn.onclick = () => {
                  if (autoScreenshotBtn.dataset.active === 'true') {
                      this.stopAutoScreenshots();
                  } else {
                      this.startAutoScreenshots();
                  }
              };
          }
          
          // Notes section events
          this.bindNotesEvents();
      }

      createBaseWidget(innerHTML) {
          const existingWidget = document.getElementById('classlogger-widget');
          if (existingWidget) {
              existingWidget.remove();
          }

          const widget = document.createElement('div');
          widget.id = 'classlogger-widget';
          widget.className = 'cl-widget';
          widget.innerHTML = innerHTML;

          if (!document.getElementById('classlogger-styles')) {
              this.addStyles();
          }

          document.body.appendChild(widget);
          return widget;
      }

      addStyles() {
          const existingStyles = document.getElementById('classlogger-styles');
          if (existingStyles) {
              existingStyles.remove();
          }

          const style = document.createElement('style');
          style.id = 'classlogger-styles';
          style.textContent = `
              .cl-widget {
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  z-index: 9999;
                  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                  border-radius: 16px;
                  padding: 0;
                  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                  border: 2px solid #42d88e;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  width: 320px;
                  font-size: 14px;
                  max-height: 90vh;
                  overflow: hidden;
                  transition: all 0.3s ease;
              }

              .cl-widget.minimized {
                  height: 50px;
                  width: 200px;
              }

              .cl-header {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 12px 16px;
                  background: linear-gradient(135deg, #42d88e, #1b7888);
                  color: white;
                  border-radius: 14px 14px 0 0;
              }

              .cl-header-content {
                  display: flex;
                  align-items: center;
              }

              .cl-icon {
                  font-size: 18px;
                  margin-right: 8px;
              }

              .cl-title {
                  font-weight: bold;
                  font-size: 16px;
              }

              .cl-minimize-btn {
                  background: rgba(255,255,255,0.2);
                  border: none;
                  color: white;
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 16px;
                  font-weight: bold;
                  transition: background 0.2s;
              }

              .cl-minimize-btn:hover {
                  background: rgba(255,255,255,0.3);
              }

              .cl-main-content {
                  padding: 16px;
                  transition: all 0.3s ease;
              }

              .cl-widget.minimized .cl-main-content {
                  display: none;
              }

              .cl-class-info {
                  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                  border-radius: 10px;
                  padding: 12px;
                  margin-bottom: 12px;
                  border-left: 4px solid #42d88e;
              }

              .cl-student {
                  font-weight: 600;
                  color: #1f2937;
                  font-size: 15px;
                  margin-bottom: 4px;
              }

              .cl-subject {
                  color: #6b7280;
                  font-size: 13px;
                  font-weight: 500;
              }

              .cl-status {
                  margin-bottom: 12px;
                  font-size: 14px;
                  color: #6b7280;
                  text-align: center;
                  padding: 8px;
                  border-radius: 6px;
                  background: #f8fafc;
              }

              .cl-status.cl-ongoing {
                  color: #059669;
                  font-weight: 600;
                  background: #ecfdf5;
                  border: 1px solid #42d88e;
              }

              .cl-status.cl-warning {
                  color: #f59e0b;
                  font-weight: 600;
                  background: #fffbeb;
                  border: 1px solid #f1c65d;
              }

              .cl-status.cl-error {
                  color: #dc2626;
                  font-weight: 600;
                  background: #fef2f2;
                  border: 1px solid #f16565;
              }

              .cl-help {
                  font-size: 12px;
                  color: #9ca3af;
                  text-align: center;
                  line-height: 1.4;
                  margin-bottom: 12px;
                  padding: 8px;
                  background: #f9fafb;
                  border-radius: 6px;
              }

              .cl-auto-refresh {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 6px;
                  margin-top: 12px;
                  padding: 6px;
                  background: #f0f9ff;
                  border-radius: 6px;
                  font-size: 11px;
                  color: #0369a1;
              }

              .cl-refresh-indicator {
                  animation: cl-spin 2s linear infinite;
              }

              @keyframes cl-spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
              }

              .cl-actions {
                  display: flex;
                  gap: 8px;
                  margin-bottom: 8px;
              }

              .cl-screenshot-controls {
                  display: none;
                  flex-wrap: wrap;
                  gap: 6px;
                  margin-bottom: 8px;
                  padding: 10px;
                  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
                  border-radius: 8px;
                  border-left: 4px solid #8b5cf6;
              }

              .cl-btn {
                  flex: 1;
                  border: none;
                  padding: 10px 12px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-weight: 600;
                  font-size: 13px;
                  transition: all 0.3s ease;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }

              .cl-btn:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
              }

              .cl-btn:disabled {
                  opacity: 0.6;
                  cursor: not-allowed;
                  transform: none;
              }

              .cl-btn-primary {
                  background: linear-gradient(135deg, #42d88e 0%, #1b7888 100%);
                  color: white;
              }

              .cl-btn-secondary {
                  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                  color: white;
              }

              .cl-btn-success {
                  background: linear-gradient(135deg, #42d88e 0%, #34d399 100%);
                  color: white;
              }

              .cl-btn-danger {
                  background: linear-gradient(135deg, #f16565 0%, #ef4444 100%);
                  color: white;
              }

              .cl-btn-purple {
                  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                  color: white;
                  font-size: 11px;
                  padding: 6px 10px;
                  min-width: auto;
              }

              .cl-screenshot-count {
                  font-size: 10px;
                  color: #7c3aed;
                  font-weight: 600;
                  background: rgba(139, 92, 246, 0.1);
                  padding: 4px 6px;
                  border-radius: 4px;
                  align-self: center;
              }

              .cl-timer {
                  text-align: center;
                  font-family: 'Courier New', monospace;
                  font-size: 18px;
                  font-weight: bold;
                  color: #1b7888;
                  padding: 8px;
                  background: #ecfdf5;
                  border-radius: 6px;
                  margin-bottom: 8px;
                  border: 1px solid #42d88e;
              }

              .cl-notes-section {
                  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                  border: 2px solid #42d88e;
                  border-radius: 12px;
                  margin-bottom: 12px;
                  font-size: 13px;
                  max-height: 350px;
                  overflow: hidden;
                  box-shadow: 0 8px 25px rgba(66, 216, 142, 0.15);
              }

              .cl-notes-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 12px 16px;
                  background: linear-gradient(135deg, #42d88e 0%, #1b7888 100%);
                  color: white;
                  border-radius: 10px 10px 0 0;
              }

              .cl-notes-title {
                  font-weight: 700;
                  font-size: 14px;
                  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
              }

              .cl-close-btn {
                  background: rgba(255,255,255,0.2);
                  border: none;
                  color: white;
                  cursor: pointer;
                  padding: 4px 8px;
                  border-radius: 6px;
                  font-size: 14px;
                  font-weight: bold;
                  transition: all 0.2s ease;
              }

              .cl-close-btn:hover {
                  background: rgba(255,255,255,0.3);
                  transform: scale(1.1);
              }

              .cl-notes-tabs {
                  display: flex;
                  background: linear-gradient(90deg, #f1c65d 0%, #42d88e 25%, #1b7888 50%, #f16565 75%, #f1c65d 100%);
                  padding: 2px;
                  gap: 2px;
              }

              .cl-tab-btn {
                  flex: 1;
                  background: rgba(255,255,255,0.9);
                  border: none;
                  padding: 10px 8px;
                  font-size: 11px;
                  font-weight: 600;
                  color: #374151;
                  cursor: pointer;
                  border-radius: 6px;
                  transition: all 0.3s ease;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }

              .cl-tab-btn:hover {
                  background: white;
                  color: #1b7888;
                  transform: translateY(-1px);
                  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              }

              .cl-tab-btn.cl-tab-active {
                  background: white;
                  color: #1b7888;
                  box-shadow: 0 4px 12px rgba(27, 120, 136, 0.2);
                  transform: translateY(-2px);
              }

              .cl-notes-content {
                  padding: 16px;
                  min-height: 120px;
                  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
              }

              .cl-tab-content {
                  display: none;
                  animation: fadeIn 0.3s ease-in-out;
              }

              .cl-tab-content.cl-tab-active {
                  display: block;
              }

              @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
              }

              .cl-notes-input {
                  width: 100%;
                  border: 2px solid #e5e7eb;
                  border-radius: 8px;
                  padding: 12px;
                  font-size: 13px;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  resize: vertical;
                  min-height: 80px;
                  background: white;
                  transition: all 0.3s ease;
                  line-height: 1.5;
              }

              .cl-notes-input:focus {
                  outline: none;
                  border-color: #42d88e;
                  box-shadow: 0 0 0 3px rgba(66, 216, 142, 0.1);
                  background: #fafffe;
              }

              .cl-notes-input::placeholder {
                  color: #9ca3af;
                  font-style: italic;
              }

              .cl-notes-actions {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 12px 16px;
                  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
                  border-top: 1px solid #e5e7eb;
                  border-radius: 0 0 10px 10px;
              }

              .cl-notes-status {
                  font-size: 11px;
                  font-weight: 600;
                  padding: 4px 8px;
                  border-radius: 6px;
                  transition: all 0.3s ease;
              }

              .cl-notes-success {
                  color: #065f46;
                  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                  border: 1px solid #42d88e;
              }

              .cl-notes-auto {
                  color: #1b7888;
                  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                  border: 1px solid #1b7888;
              }

              .cl-notes-error {
                  color: #dc2626;
                  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
                  border: 1px solid #f16565;
              }

              .cl-content-preview {
                  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                  border: 2px solid #f1c65d;
                  border-radius: 10px;
                  padding: 12px;
                  margin-bottom: 8px;
                  font-size: 12px;
                  box-shadow: 0 4px 15px rgba(241, 198, 93, 0.2);
              }

              .cl-content-header {
                  font-weight: 700;
                  color: #92400e;
                  margin-bottom: 8px;
                  text-align: center;
                  font-size: 13px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }

              .cl-stat {
                  color: #78350f;
                  margin-bottom: 4px;
                  padding: 4px 8px;
                  background: rgba(255, 255, 255, 0.6);
                  border-radius: 6px;
                  border-left: 3px solid #f1c65d;
                  font-size: 11px;
                  font-weight: 600;
              }

              .cl-teacher-info {
                  font-size: 11px;
                  color: #9ca3af;
                  text-align: center;
                  padding: 4px;
                  background: #f9fafb;
                  border-radius: 4px;
              }

              @keyframes cl-pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.7; }
              }

              .cl-timer.cl-active {
                  animation: cl-pulse 2s infinite;
              }
          `;
          document.head.appendChild(style);
      }

      async sendMessage(message) {
          return new Promise((resolve) => {
              try {
                  if (!chrome || !chrome.runtime || !chrome.storage) {
                      console.warn('⚠️ Extension context invalidated - please refresh the page');
                      this.updateStatus('Extension updated - Please refresh page', 'error');
                      resolve({ success: false, error: 'Extension context invalidated - please refresh the page' });
                      return;
                  }

                  chrome.runtime.sendMessage(message, (response) => {
                      if (chrome.runtime.lastError) {
                          console.error('Chrome runtime error:', chrome.runtime.lastError);
                          if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
                              this.updateStatus('Extension updated - Please refresh page', 'error');
                              resolve({ success: false, error: 'Extension was updated - please refresh the page' });
                          } else {
                              resolve({ success: false, error: chrome.runtime.lastError.message });
                          }
                      } else {
                          resolve(response || { success: false, error: 'No response from extension background' });
                      }
                  });
              } catch (error) {
                  console.error('Send message error:', error);
                  if (error.message.includes('Extension context invalidated')) {
                      this.updateStatus('Extension updated - Please refresh page', 'error');
                      resolve({ success: false, error: 'Extension was updated - please refresh the page' });
                  } else {
                      resolve({ success: false, error: error.message });
                  }
              }
          });
      }
  }

  // Initialize widget when page is ready
  function initializeWidget() {
      // Only initialize on Google Meet pages
      if (!window.location.hostname.includes('meet.google.com')) {
          return;
      }

      // Wait for page to be ready
      if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
              setTimeout(() => new ClassLoggerWidget(), 1000);
          });
      } else {
          setTimeout(() => new ClassLoggerWidget(), 1000);
      }
  }

  // Listen for messages from popup to refresh state
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.action === 'refreshLoginState') {
              console.log('🔄 ClassLogger: Received refresh request from popup');
              // Force refresh the widget
              const existingWidget = document.getElementById('classlogger-widget');
              if (existingWidget) {
                  existingWidget.remove();
              }
              // Reinitialize
              setTimeout(() => new ClassLoggerWidget(), 500);
              sendResponse({ success: true });
          }
      });
  }

  // Initialize
  initializeWidget();

})();
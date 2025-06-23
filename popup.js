/* ===== Enhanced popup.js - Fixed CSP Issues ===== */
class ClassLoggerPopup {
    constructor() {
      this.checkInterval = null
      this.init()
    }
  
    async init() {
      this.showLoading('Checking token status...')
      
      // Check if user has valid token
      const authStatus = await this.sendMessage({ action: 'getAuthStatus' })
      
      this.hideLoading()
      
      if (authStatus && authStatus.success && authStatus.loggedIn) {
        this.showDashboard(authStatus.teacherName, authStatus.teacherEmail)
        this.startStatusMonitoring()
        // Auto-switch to status tab when logged in
        this.switchToTab('status')
      } else {
        this.showLoggedOutState()
        this.stopStatusMonitoring()
        // Auto-switch to login tab when not logged in
        this.switchToTab('login')
      }
      
      this.bindEvents()
    }
  
    switchToTab(tabName) {
      // Remove active from all tabs and content
      document.querySelectorAll('.popup-tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelectorAll('.popup-tab-content').forEach(content => {
        content.classList.remove('active');
      });
  
      // Add active to selected tab and content
      const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
      const tabContent = document.getElementById(`${tabName}-tab`);
      
      if (tabBtn) tabBtn.classList.add('active');
      if (tabContent) tabContent.classList.add('active');
    }
  
    startStatusMonitoring() {
      // Check status every 30 seconds when logged in
      this.checkInterval = setInterval(async () => {
        const authStatus = await this.sendMessage({ action: 'getAuthStatus' })
        if (!authStatus || !authStatus.success || !authStatus.loggedIn) {
          this.showLoggedOutState()
          this.stopStatusMonitoring()
          this.switchToTab('login')
        }
      }, 30000)
    }
  
    stopStatusMonitoring() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval)
        this.checkInterval = null
      }
    }
  
    bindEvents() {
      // Tab switching
      document.querySelectorAll('.popup-tab-btn').forEach(btn => {
        btn.onclick = () => this.switchToTab(btn.dataset.tab);
      });
  
      // Token input form
      const tokenForm = document.getElementById('token-input-form')
      if (tokenForm) {
        tokenForm.addEventListener('submit', (e) => this.handleTokenSubmit(e))
      }
  
      // Dashboard buttons
      const clearTokenBtn = document.getElementById('clear-token-btn')
      if (clearTokenBtn) {
        clearTokenBtn.addEventListener('click', () => this.handleClearToken())
      }
  
      const refreshBtn = document.getElementById('refresh-btn')
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => this.init())
      }
  
      // Login Now button (fixed inline handler)
      const loginNowBtn = document.getElementById('login-now-btn')
      if (loginNowBtn) {
        loginNowBtn.addEventListener('click', () => this.switchToTab('login'))
      }
    }
  
    async handleTokenSubmit(e) {
      e.preventDefault()
      
      const tokenInput = document.getElementById('extension-token')
      const token = tokenInput.value.trim()
      
      if (!token) {
        this.showError('Please enter your extension token')
        return
      }
  
      // Basic token format validation
      const tokenPattern = /^CL_[a-f0-9]{8}_\d{6}_[a-f0-9]{8}$/
      if (!tokenPattern.test(token)) {
        this.showError('Invalid token format. Please check your token and try again.')
        return
      }
      
      this.showLoading('Validating token...')
      this.hideError()
      
      try {
        console.log('🔐 Popup: Validating token...')
        
        const response = await this.sendMessage({
          action: 'validateToken',
          token: token
        })
        
        this.hideLoading()
        
        console.log('📥 Popup: Received response:', response)
        
        // Handle the response from background script
        if (response && response.valid && response.teacher) {
          console.log('✅ Popup: Token validation successful')
          this.showDashboard(response.teacher.name, response.teacher.email, response.token_info)
          this.clearTokenForm()
          this.startStatusMonitoring()
          this.switchToTab('status') // Auto-switch to status tab on successful login
          
          // Notify content scripts to refresh
          this.notifyContentScripts()
        } else {
          console.error('❌ Popup: Token validation failed:', response)
          this.showError(response?.error || 'Invalid token')
        }
      } catch (error) {
        console.error('❌ Popup: Token validation error:', error)
        this.hideLoading()
        this.showError('Token validation failed. Please try again.')
      }
    }
  
    async handleClearToken() {
      const confirmClear = confirm('Are you sure you want to clear your token? You will need to enter it again.')
      if (!confirmClear) return
      
      this.showLoading('Clearing token...')
      
      try {
        await this.sendMessage({ action: 'logout' })
        this.hideLoading()
        this.showLoggedOutState()
        this.clearTokenForm()
        this.stopStatusMonitoring()
        this.switchToTab('login')
        
        // Notify content scripts to refresh
        this.notifyContentScripts()
      } catch (error) {
        this.hideLoading()
        this.showError('Failed to clear token')
      }
    }
  
    // Notify all content scripts to refresh their state
    async notifyContentScripts() {
      try {
        const tabs = await chrome.tabs.query({ url: "https://meet.google.com/*" })
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, { action: 'refreshLoginState' }, () => {
            // Ignore errors for tabs that don't have content script
            if (chrome.runtime.lastError) {
              console.log('Content script not available on tab:', tab.id)
            }
          })
        }
      } catch (error) {
        console.log('Could not notify content scripts:', error)
      }
    }
  
    showLoggedOutState() {
      const dashboard = document.getElementById('dashboard')
      const loggedOutStatus = document.getElementById('logged-out-status')
      
      if (dashboard) dashboard.style.display = 'none'
      if (loggedOutStatus) loggedOutStatus.style.display = 'block'
      this.hideError()
    }
  
    showDashboard(teacherName, teacherEmail, tokenInfo = null) {
      const dashboard = document.getElementById('dashboard')
      const loggedOutStatus = document.getElementById('logged-out-status')
      
      if (dashboard) dashboard.style.display = 'block'
      if (loggedOutStatus) loggedOutStatus.style.display = 'none'
      
      const userNameEl = document.getElementById('user-name')
      const userEmailEl = document.getElementById('user-email')
      
      if (userNameEl) userNameEl.textContent = teacherName || 'Teacher'
      if (userEmailEl) userEmailEl.textContent = teacherEmail || ''
      
      // Update token status if available
      if (tokenInfo) {
        const expiryEl = document.getElementById('token-expiry')
        const usageEl = document.getElementById('token-usage')
        
        if (expiryEl) {
          if (tokenInfo.days_until_expiry !== undefined) {
            if (tokenInfo.days_until_expiry <= 1) {
              expiryEl.textContent = `Expires in ${tokenInfo.hours_until_expiry || 'few'} hours`
              expiryEl.parentElement.style.borderColor = '#f16565' // Red for urgent
            } else {
              expiryEl.textContent = `Expires in ${tokenInfo.days_until_expiry} days`
              expiryEl.parentElement.style.borderColor = tokenInfo.days_until_expiry <= 2 ? '#f1c65d' : '#42d88e'
            }
          } else {
            expiryEl.textContent = 'Expires in X days'
          }
        }
        
        if (usageEl) {
          if (tokenInfo.usage_count !== undefined) {
            usageEl.textContent = `Used ${tokenInfo.usage_count} times`
          } else {
            usageEl.textContent = 'Used X times'
          }
        }
      } else {
        // No token info available - show defaults with better styling
        const expiryEl = document.getElementById('token-expiry')
        const usageEl = document.getElementById('token-usage')
        
        if (expiryEl) {
          expiryEl.textContent = 'Checking expiry...'
          expiryEl.parentElement.style.borderColor = '#42d88e'
        }
        if (usageEl) {
          usageEl.textContent = 'Checking usage...'
        }
      }
    }
  
    showLoading(message = 'Loading...') {
      const loadingEl = document.getElementById('loading')
      const loadingText = document.getElementById('loading-text')
      
      if (loadingEl) loadingEl.style.display = 'flex'
      if (loadingText) loadingText.textContent = message
    }
  
    hideLoading() {
      const loadingEl = document.getElementById('loading')
      if (loadingEl) loadingEl.style.display = 'none'
    }
  
    showError(message) {
      const errorEl = document.getElementById('token-error')
      if (errorEl) {
        errorEl.textContent = message
        errorEl.style.display = 'block'
      }
    }
  
    hideError() {
      const errorEl = document.getElementById('token-error')
      if (errorEl) {
        errorEl.style.display = 'none'
      }
    }
  
    clearTokenForm() {
      const tokenInput = document.getElementById('extension-token')
      if (tokenInput) tokenInput.value = ''
    }
  
    sendMessage(message) {
      return new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
            } else {
              resolve(response || { success: false, error: 'No response' })
            }
          })
        } catch (error) {
          reject(error)
        }
      })
    }
  }
  
  // Initialize popup when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new ClassLoggerPopup()
    })
  } else {
    new ClassLoggerPopup()
  }
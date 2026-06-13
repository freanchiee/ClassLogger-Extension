// popup.js - Fixed to work with your popup.html structure

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 ClassLogger popup loaded');
  
  // Get DOM elements that match your popup.html
  const loading = document.getElementById('loading');
  const loginForm = document.getElementById('loginForm');
  const dashboard = document.getElementById('dashboard');
  const loginError = document.getElementById('loginError');
  
  const tokenInput = document.getElementById('tokenInput');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const tokenStatus = document.getElementById('tokenStatus');
  const meetStatus = document.getElementById('meetStatus');
  const classStatus = document.getElementById('classStatus');

  // Initialize popup
  await checkAuthStatus();

  // Event listeners
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  
  // Allow enter key in token input
  if (tokenInput) {
    tokenInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleLogin();
      }
    });
  }

  async function checkAuthStatus() {
    try {
      console.log('🔍 Checking authentication status...');
      
      // Check with background script
      const response = await chrome.runtime.sendMessage({ 
        action: 'checkAuthStatus' 
      });
      
      console.log('📥 Auth status response:', response);
      
      if (response && response.success && response.loggedIn) {
        showDashboard(response);
      } else {
        showLoginForm();
      }
      
    } catch (error) {
      console.error('❌ Auth check error:', error);
      showLoginForm();
    } finally {
      if (loading) loading.style.display = 'none';
    }
  }

  async function handleLogin() {
    if (!tokenInput) return;
    
    const token = tokenInput.value.trim();
    
    if (!token) {
      showError('Please enter a token');
      return;
    }
    
    try {
      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Validating...';
      }
      hideError();
      
      console.log('🔐 Validating token...');
      
      // Send validation request to background script
      const response = await chrome.runtime.sendMessage({
        action: 'validateToken',
        token: token
      });
      
      console.log('📥 Validation response:', response);
      
      if (response && response.success && response.valid) {
        console.log('✅ Token validated successfully');
        showDashboard(response);
        tokenInput.value = ''; // Clear input
      } else {
        console.log('❌ Token validation failed:', response?.error);
        showError(response?.error || 'Invalid token');
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      showError('Login failed: ' + error.message);
    } finally {
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
      }
    }
  }

  async function handleLogout() {
    if (!logoutBtn) return;
    
    try {
      logoutBtn.disabled = true;
      logoutBtn.textContent = 'Logging out...';
      
      console.log('🚪 Logging out...');
      
      const response = await chrome.runtime.sendMessage({ 
        action: 'logout' 
      });
      
      if (response && response.success) {
        console.log('✅ Logged out successfully');
        showLoginForm();
      } else {
        console.error('❌ Logout failed:', response?.error);
      }
      
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      if (logoutBtn) {
        logoutBtn.disabled = false;
        logoutBtn.textContent = 'Logout';
      }
    }
  }

  function showLoginForm() {
    if (loginForm) loginForm.classList.add('active');
    if (dashboard) dashboard.classList.remove('active');
    if (loading) loading.style.display = 'none';
    hideError();
  }

  function showDashboard(authData) {
    if (loginForm) loginForm.classList.remove('active');
    if (dashboard) dashboard.classList.add('active');
    if (loading) loading.style.display = 'none';
    
    // Update user info
    if (userName) {
      userName.textContent = authData.teacherName || authData.teacher?.name || 'Teacher';
    }
    if (userEmail) {
      userEmail.textContent = authData.teacherEmail || authData.teacher?.email || 'No email';
    }
    
    // Update token status
    if (tokenStatus) {
      if (authData.tokenInfo) {
        const daysLeft = authData.tokenInfo.days_until_expiry || 0;
        tokenStatus.textContent = `Expires in ${daysLeft} days (Used ${authData.tokenInfo.usage_count || 0} times)`;
      } else {
        tokenStatus.textContent = 'Active';
      }
    }
    
    // Update feature status
    if (meetStatus) {
      meetStatus.textContent = 'Working';
      meetStatus.className = 'status active';
    }
    
    if (classStatus) {
      classStatus.textContent = 'Ready';
      classStatus.className = 'status active';
    }
  }

  function showError(message) {
    if (loginError) {
      loginError.textContent = message;
      loginError.style.display = 'block';
    }
  }

  function hideError() {
    if (loginError) {
      loginError.style.display = 'none';
    }
  }
});
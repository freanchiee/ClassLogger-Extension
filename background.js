// ===== ClassLogger Background Service Worker - Fixed JSON Parsing =====
// Token-based authentication system for ClassLogger extension

console.log('🎓 ClassLogger Background: Service worker starting...');

// Configuration
const API_BASE_URL = 'http://localhost:3000';

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🔄 Background received message:', request.action, request);
    
    // Handle token validation (for popup login)
    if (request.action === 'validateToken') {
        handleValidateToken(request.token, sendResponse);
        return true;
    }
    
    // Handle auth status check (for content script)
    if (request.action === 'getAuthStatus') {
        handleAuthStatus(sendResponse);
        return true;
    }
    
    if (request.action === 'checkMeetUrl') {
        console.log('🔍 checkMeetUrl request data:', request);
        handleCheckMeetUrl(request.meetUrl, sendResponse);
        return true;
    }
    
    if (request.action === 'startClass') {
        console.log('🚀 startClass request data:', request);
        handleStartClass(request.data, sendResponse);
        return true;
    }
    
    if (request.action === 'endClass') {
        console.log('🛑 endClass request data:', request);
        handleEndClass(request.data, sendResponse);
        return true;
    }
    
    // Handle screenshot capture
    if (request.action === 'takeScreenshot') {
        console.log('📸 takeScreenshot request');
        handleTakeScreenshot(sendResponse);
        return true;
    }
    
    // Handle logout
    if (request.action === 'logout') {
        handleLogout(sendResponse);
        return true;
    }
    
    console.log('❓ Unknown action:', request.action);
    sendResponse({ success: false, error: 'Unknown action' });
});

async function handleValidateToken(token, sendResponse) {
    try {
        console.log('🔐 Validating token for popup...');
        
        if (!token) {
            sendResponse({ valid: false, success: false, error: 'No token provided' });
            return;
        }
        
        console.log('📡 Calling /api/teacher/tokens/validate...');
        const validationResponse = await fetch(`${API_BASE_URL}/api/teacher/tokens/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
        });
        
        console.log('📥 Token validation response status:', validationResponse.status);
        
        if (!validationResponse.ok) {
            sendResponse({ 
                valid: false, 
                success: false, 
                error: `API error: ${validationResponse.status} ${validationResponse.statusText}` 
            });
            return;
        }

        const validationData = await validationResponse.json();
        console.log('📥 Token validation response data:', validationData);
        
        if (validationData.success && validationData.teacher) {
            // Store the token if valid
            try {
                await chrome.storage.local.set({ classlogger_token: token });
                console.log('✅ Token stored successfully');
            } catch (storageError) {
                console.warn('⚠️ Chrome storage not available, token not stored:', storageError);
            }
            
            // Return the data in the format the popup expects
            sendResponse({
                valid: true,
                success: true,
                teacher: validationData.teacher,
                token_info: validationData.token_info || null
            });
        } else {
            console.log('❌ Token validation failed:', validationData.error);
            sendResponse({ 
                valid: false, 
                success: false, 
                error: validationData.error || 'Invalid token' 
            });
        }
        
    } catch (error) {
        console.error('❌ Token validation error:', error);
        sendResponse({ 
            valid: false, 
            success: false, 
            error: 'Connection failed - Make sure your ClassLogger API is running on localhost:3000'
        });
    }
}

async function handleAuthStatus(sendResponse) {
    try {
        console.log('🔐 Checking auth status for content script...');
        
        // Get stored token
        const result = await chrome.storage.local.get(['classlogger_token']);
        const token = result.classlogger_token;
        
        console.log('🎫 Token found:', token ? 'YES (' + token.substring(0, 20) + '...)' : 'NO');
        
        if (!token) {
            console.log('❌ No token found');
            sendResponse({ success: false, loggedIn: false, error: 'No token found' });
            return;
        }
        
        console.log('📡 Calling /api/teacher/tokens/validate for auth status...');
        const authResponse = await fetch(`${API_BASE_URL}/api/teacher/tokens/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
        });
        
        console.log('📥 Auth API response status:', authResponse.status);
        
        if (!authResponse.ok) {
            sendResponse({ 
                success: false, 
                loggedIn: false, 
                error: `API error: ${authResponse.status} ${authResponse.statusText}` 
            });
            return;
        }

        const authData = await authResponse.json();
        console.log('📥 Auth API response data:', authData);
        
        if (authData.success && authData.teacher) {
            // Convert to the format content script expects
            sendResponse({
                success: true,
                loggedIn: true,
                teacherId: authData.teacher.id,
                teacherName: authData.teacher.name,
                teacherEmail: authData.teacher.email,
                loginMethod: 'Token'
            });
        } else {
            console.log('❌ Auth failed:', authData.error);
            sendResponse({ 
                success: false, 
                loggedIn: false, 
                error: authData.error || 'Invalid token' 
            });
        }
        
    } catch (error) {
        console.error('❌ Auth status error:', error);
        sendResponse({ 
            success: false, 
            loggedIn: false, 
            error: 'Connection failed - Make sure your ClassLogger API is running'
        });
    }
}

async function handleCheckMeetUrl(meetUrl, sendResponse) {
    try {
        console.log('🔍 handleCheckMeetUrl called with meetUrl:', meetUrl);
        
        const result = await chrome.storage.local.get(['classlogger_token']);
        const token = result.classlogger_token;
        
        console.log('🎫 Token for meet URL check:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
        
        if (!token) {
            console.error('❌ No token found');
            sendResponse({ success: false, error: 'Not authenticated' });
            return;
        }
        
        // First get teacher ID from the auth status endpoint
        console.log('🔐 Getting teacher ID from auth status...');
        const teacherResponse = await fetch(`${API_BASE_URL}/api/teacher/tokens/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
        });
        
        console.log('📥 Teacher response status:', teacherResponse.status);
        
        if (!teacherResponse.ok) {
            sendResponse({ 
                success: false, 
                error: `Authentication failed: ${teacherResponse.status} ${teacherResponse.statusText}` 
            });
            return;
        }

        const teacherData = await teacherResponse.json();
        console.log('👨‍🏫 Teacher data received:', teacherData);
        
        if (!teacherData.success || !teacherData.teacher) {
            console.error('❌ Authentication failed:', teacherData);
            sendResponse({ success: false, error: 'Authentication failed: ' + (teacherData.error || 'Unknown error') });
            return;
        }
        
        const requestBody = { 
            meetUrl: meetUrl,
            teacherId: teacherData.teacher.id 
        };
        
        console.log('📤 Sending request to check-meet-url with:', requestBody);
        
        // Now check the meet URL using existing endpoint
        const meetResponse = await fetch(`${API_BASE_URL}/api/teacher/check-meet-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('📥 Check Meet URL response status:', meetResponse.status);
        
        if (!meetResponse.ok) {
            sendResponse({ 
                success: false, 
                error: `API error: ${meetResponse.status} ${meetResponse.statusText}` 
            });
            return;
        }

        const meetData = await meetResponse.json();
        console.log('📥 Check Meet URL response data:', meetData);
        
        sendResponse(meetData);
        
    } catch (error) {
        console.error('❌ Check Meet URL error:', error);
        sendResponse({ 
            success: false, 
            error: 'Failed to check Meet URL - Make sure your API is running' 
        });
    }
}

async function handleStartClass(classData, sendResponse) {
    try {
        console.log('🚀 Starting class with data:', classData);
        
        const result = await chrome.storage.local.get(['classlogger_token']);
        const token = result.classlogger_token;
        
        console.log('🎫 Token for start class:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
        
        if (!token) {
            console.error('❌ No token found for start class');
            sendResponse({ success: false, error: 'Not authenticated' });
            return;
        }
        
        // Add token to the request data
        const requestData = {
            ...classData,
            token: token
        };
        
        console.log('📤 Sending start class request to /api/extension/start-class...');
        const startResponse = await fetch(`${API_BASE_URL}/api/extension/start-class`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('📥 Start class response status:', startResponse.status);
        
        if (!startResponse.ok) {
            sendResponse({ 
                success: false, 
                error: `API error: ${startResponse.status} ${startResponse.statusText}` 
            });
            return;
        }

        const startData = await startResponse.json();
        console.log('📥 Start class response data:', startData);
        
        sendResponse(startData);
        
    } catch (error) {
        console.error('❌ Start class error:', error);
        sendResponse({ 
            success: false, 
            error: 'Failed to start class - Make sure your API is running' 
        });
    }
}

async function handleEndClass(classData, sendResponse) {
    try {
        console.log('🛑 Ending class with data:', classData);
        
        const result = await chrome.storage.local.get(['classlogger_token']);
        const token = result.classlogger_token;
        
        console.log('🎫 Token for end class:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
        
        if (!token) {
            console.error('❌ No token found for end class');
            sendResponse({ success: false, error: 'Not authenticated' });
            return;
        }
        
        // Add token to the request data
        const requestData = {
            ...classData,
            token: token
        };
        
        console.log('📤 Sending end class request to /api/extension/end-class...');
        const endResponse = await fetch(`${API_BASE_URL}/api/extension/end-class`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('📥 End class response status:', endResponse.status);
        
        if (!endResponse.ok) {
            sendResponse({ 
                success: false, 
                error: `API error: ${endResponse.status} ${endResponse.statusText}` 
            });
            return;
        }

        const endData = await endResponse.json();
        console.log('📥 End class response data:', endData);
        
        sendResponse(endData);
        
    } catch (error) {
        console.error('❌ End class error:', error);
        sendResponse({ 
            success: false, 
            error: 'Failed to end class - Make sure your API is running' 
        });
    }
}

async function handleTakeScreenshot(sendResponse) {
    try {
        console.log('📸 Taking screenshot...');
        
        // Get the current active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
            console.error('❌ No active tab found');
            sendResponse({ success: false, error: 'No active tab found' });
            return;
        }
        
        const activeTab = tabs[0];
        console.log('📋 Active tab:', activeTab.url);
        
        // Check if we have the necessary permissions
        if (!chrome.tabs.captureVisibleTab) {
            console.error('❌ captureVisibleTab permission not available');
            sendResponse({ success: false, error: 'Screenshot permission not available' });
            return;
        }
        
        // Capture the visible tab
        chrome.tabs.captureVisibleTab(activeTab.windowId, {
            format: 'png',
            quality: 90
        }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                console.error('❌ Screenshot capture failed:', chrome.runtime.lastError);
                sendResponse({ 
                    success: false, 
                    error: 'Screenshot failed: ' + chrome.runtime.lastError.message 
                });
                return;
            }
            
            if (!dataUrl) {
                console.error('❌ No screenshot data received');
                sendResponse({ success: false, error: 'No screenshot data received' });
                return;
            }
            
            console.log('✅ Screenshot captured successfully, size:', dataUrl.length);
            sendResponse({ 
                success: true, 
                dataUrl: dataUrl,
                timestamp: new Date().toISOString(),
                tabUrl: activeTab.url
            });
        });
        
    } catch (error) {
        console.error('❌ Screenshot error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

async function handleLogout(sendResponse) {
    try {
        console.log('👋 Logging out...');
        await chrome.storage.local.remove(['classlogger_token']);
        console.log('✅ Token removed from storage');
        sendResponse({ success: true });
    } catch (error) {
        console.error('❌ Logout error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('🎓 ClassLogger extension installed with token-based authentication');
});

// Handle tab updates to maintain functionality
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('meet.google.com')) {
        console.log('📋 Google Meet tab updated:', tabId);
    }
});

// Monitor for tab activation changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab.url && tab.url.includes('meet.google.com')) {
            console.log('📋 Google Meet tab activated:', activeInfo.tabId);
        }
    } catch (error) {
        // Tab might have been closed, ignore error
    }
});
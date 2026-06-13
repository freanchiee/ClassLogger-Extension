// ===== ClassLogger Background Service Worker - Fixed JSON Parsing =====
// Token-based authentication system for ClassLogger extension

console.log('🎓 ClassLogger Background: Service worker starting...');

// Configuration
const API_BASE_URL = 'https://classlogger.com';

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🔄 Background received message:', request.action, request);
    
    // Handle token validation (for popup login)
    if (request.action === 'validateToken') {
        handleValidateToken(request.token, sendResponse);
        return true;
    }
    
    // Handle auth status check (for content script)
    if (request.action === 'checkAuthStatus') {
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

    // Handle available tabs request (for screenshot tab selection)
    if (request.action === 'getAvailableTabs') {
        console.log('🗂️ getAvailableTabs request');
        handleGetAvailableTabs(sendResponse);
        return true;
    }

    // Handle save screenshot — persist to Supabase via the website API
    if (request.action === 'saveScreenshot') {
        console.log('💾 saveScreenshot request');
        handleSaveScreenshot(request, sendResponse);
        return true;
    }

    // Handle save resource (image/file upload or link)
    if (request.action === 'saveResource') {
        console.log('📎 saveResource request');
        handleSaveResource(request, sendResponse);
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

// Persist a captured screenshot to the class record in Supabase
async function handleSaveScreenshot(request, sendResponse) {
    try {
        const token = await getValidToken();
        if (!token) {
            sendResponse({ success: false, error: 'Not authenticated' });
            return;
        }

        const resp = await fetch(`${API_BASE_URL}/api/extension/screenshot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                class_log_id: request.class_log_id,
                screenshot_data: request.screenshot_data,
                screenshot_type: request.screenshot_type || 'manual',
                timestamp: request.timestamp
            })
        });

        const data = await parseResponseSafe(resp);
        if (!resp.ok || !data.success) {
            console.warn('⚠️ saveScreenshot API error:', data.error);
            sendResponse({ success: false, error: data.error || `API error ${resp.status}` });
            return;
        }

        console.log('✅ Screenshot saved to class:', data.screenshot_url || data.screenshot_id);
        sendResponse({ success: true, screenshot_id: data.screenshot_id, screenshot_url: data.screenshot_url });
    } catch (error) {
        console.warn('⚠️ handleSaveScreenshot failed:', error.message);
        sendResponse({ success: false, error: error.message });
    }
}

// Safely parse a fetch Response — returns parsed JSON, or a {success:false,error}
// object derived from the text body (handles 413 "Request Entity Too Large" etc.)
async function parseResponseSafe(resp) {
    const text = await resp.text();
    try {
        return JSON.parse(text);
    } catch {
        let error = text?.slice(0, 120) || `HTTP ${resp.status}`;
        if (resp.status === 413 || /request entity too large/i.test(text)) {
            error = 'Screenshot too large to upload';
        }
        return { success: false, error };
    }
}

// Persist a resource (uploaded image/file or a link) to the class record
async function handleSaveResource(request, sendResponse) {
    try {
        const token = await getValidToken();
        if (!token) {
            sendResponse({ success: false, error: 'Not authenticated' });
            return;
        }

        const resp = await fetch(`${API_BASE_URL}/api/extension/save-resource`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                class_log_id: request.class_log_id,
                type: request.type,           // 'link' or 'file'
                file_data: request.file_data, // base64 for files
                url: request.url,             // for links
                name: request.name
            })
        });

        const data = await parseResponseSafe(resp);
        if (!resp.ok || !data.success) {
            sendResponse({ success: false, error: data.error || `API error ${resp.status}` });
            return;
        }
        sendResponse({ success: true, resource: data.resource });
    } catch (error) {
        console.warn('⚠️ handleSaveResource failed:', error.message);
        sendResponse({ success: false, error: error.message });
    }
}

// Return the list of open tabs that can be captured
async function handleGetAvailableTabs(sendResponse) {
    try {
        const tabs = await chrome.tabs.query({});
        const available = tabs
            .filter(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')))
            .map(t => ({
                id: t.id,
                title: t.title || 'Untitled',
                url: t.url,
                favIconUrl: t.favIconUrl || null,
                active: t.active
            }));
        sendResponse({ success: true, tabs: available });
    } catch (error) {
        console.error('❌ getAvailableTabs failed:', error);
        sendResponse({ success: false, error: error.message, tabs: [] });
    }
}

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
            error: 'Connection failed - Make sure you are logged in at classlogger.com'
        });
    }
}

// Fetch a fresh extension JWT using the logged-in classlogger.com cookie session.
// This is what enables auto-detection of the website login — no manual token needed.
async function getExtensionToken() {
    try {
        console.log('🔑 Requesting extension token via cookie session...');
        const resp = await fetch(`${API_BASE_URL}/api/extension/issue-temp-token`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!resp.ok) {
            console.log('⚠️ issue-temp-token returned', resp.status);
            return { success: false, error: `Not logged in at classlogger.com (${resp.status})` };
        }

        const data = await resp.json();
        if (data.success && data.token) {
            // NOTE: Do NOT write to chrome.storage here — the content script's
            // storage.onChanged listener would fire on every call and trigger an
            // infinite reinitialize loop. Tokens are fetched fresh on demand.
            console.log('✅ Extension token obtained for:', data.user?.email);
            return { success: true, token: data.token, user: data.user };
        }

        return { success: false, error: data.error || 'No token returned' };
    } catch (e) {
        console.error('❌ getExtensionToken failed:', e);
        return { success: false, error: e.message };
    }
}

// Get a valid extension token: try the cookie session first (auto-detect),
// fall back to any cached token.
async function getValidToken() {
    const fresh = await getExtensionToken();
    if (fresh.success) return fresh.token;

    const result = await chrome.storage.local.get(['classlogger_token']);
    return result.classlogger_token || null;
}

async function handleAuthStatus(sendResponse) {
    try {
        console.log('🔐 Checking auth status for content script...');

        // Auto-detect: ask classlogger.com for a token using the session cookie
        const tokenResult = await getExtensionToken();

        if (tokenResult.success && tokenResult.user) {
            console.log('✅ Auto-detected website login for:', tokenResult.user.email);
            sendResponse({
                success: true,
                loggedIn: true,
                teacherId: tokenResult.user.id,
                teacherName: tokenResult.user.name,
                teacherEmail: tokenResult.user.email,
                loginMethod: 'Session'
            });
            return;
        }

        console.log('❌ No active website session:', tokenResult.error);
        sendResponse({
            success: false,
            loggedIn: false,
            error: tokenResult.error || 'Please log in at classlogger.com'
        });

    } catch (error) {
        console.error('❌ Auth status error:', error);
        sendResponse({
            success: false,
            loggedIn: false,
            error: 'Connection failed - please log in at classlogger.com'
        });
    }
}

async function handleCheckMeetUrl(meetUrl, sendResponse) {
    try {
        console.log('🔍 handleCheckMeetUrl called with meetUrl:', meetUrl);

        // Auto-detect the logged-in teacher via the website session
        const tokenResult = await getExtensionToken();

        if (!tokenResult.success || !tokenResult.user) {
            console.error('❌ Not authenticated:', tokenResult.error);
            sendResponse({ success: false, error: tokenResult.error || 'Not authenticated - please log in at classlogger.com' });
            return;
        }

        const requestBody = {
            meetUrl: meetUrl,
            teacherId: tokenResult.user.id
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

        // Get a fresh token from the website session (Bearer auth required)
        const token = await getValidToken();

        console.log('🎫 Token for start class:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

        if (!token) {
            console.error('❌ No token found for start class');
            sendResponse({ success: false, error: 'Not authenticated - please log in at classlogger.com' });
            return;
        }

        console.log('📤 Sending start class request to /api/extension/start-class...');
        const startResponse = await fetch(`${API_BASE_URL}/api/extension/start-class`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(classData)
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

        // Get a fresh token from the website session (Bearer auth required)
        const token = await getValidToken();

        console.log('🎫 Token for end class:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

        if (!token) {
            console.error('❌ No token found for end class');
            sendResponse({ success: false, error: 'Not authenticated - please log in at classlogger.com' });
            return;
        }

        console.log('📤 Sending end class request to /api/extension/end-class...');
        const endResponse = await fetch(`${API_BASE_URL}/api/extension/end-class`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(classData)
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
        
        // Capture the visible tab as JPEG — far smaller than PNG, avoids
        // "Request Entity Too Large" (413) when POSTing the base64 body.
        chrome.tabs.captureVisibleTab(activeTab.windowId, {
            format: 'jpeg',
            quality: 75
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
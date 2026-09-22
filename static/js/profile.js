// Profile Dropdown and User Management

document.addEventListener('DOMContentLoaded', function() {
    initializeProfile();
    initializeDropdownToggle();
    initializeDropdownLinks();
});

function initializeProfile() {
    // Load user data from session/localStorage
    const userData = getUserData();
    
    if (userData) {
        updateProfileDisplay(userData);
    } else {
        // Fetch user data from backend
        fetch('/api/user')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateProfileDisplay(data.user);
                }
            })
            .catch(err => console.log('Could not fetch user data:', err));
    }
}

function getUserData() {
    // Try to get from localStorage or sessionStorage
    const stored = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    return stored ? JSON.parse(stored) : null;
}

function updateProfileDisplay(userData) {
    if (!userData) return;
    
    // Get user's initial
    const initial = userData.full_name 
        ? userData.full_name.charAt(0).toUpperCase()
        : userData.username.charAt(0).toUpperCase();
    
    // Update navbar avatar
    const userInitial = document.getElementById('userInitial');
    if (userInitial) {
        userInitial.textContent = initial;
    }
    
    // Update dropdown header
    const dropdownName = document.getElementById('dropdownName');
    const dropdownEmail = document.getElementById('dropdownEmail');
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    
    if (dropdownName) {
        dropdownName.textContent = userData.full_name || userData.username;
    }
    if (dropdownEmail) {
        dropdownEmail.textContent = userData.email || 'user@example.com';
    }
    if (dropdownAvatar) {
        dropdownAvatar.textContent = initial;
    }
    
    // Store user data for profile page
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
}

function initializeDropdownToggle() {
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-profile')) {
                profileDropdown.classList.remove('active');
            }
        });
        
        // Close dropdown when clicking inside (on items)
        profileDropdown.addEventListener('click', function(e) {
            if (e.target.closest('.dropdown-item')) {
                profileDropdown.classList.remove('active');
            }
        });
    }
}

function initializeDropdownLinks() {
    const profileLink = document.getElementById('profileLink');
    const settingsLink = document.getElementById('settingsLink');
    const logoutLink = document.getElementById('logoutLink');
    
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            e.preventDefault();
            openProfileModal();
        });
    }
    
    if (settingsLink) {
        settingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            openSettingsModal();
        });
    }
    
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
}

function openProfileModal() {
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    const modalHTML = `
        <div id="profileModal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 550px;">
                <div class="modal-header">
                    <h2>Your Profile</h2>
                    <button class="close-btn" onclick="document.getElementById('profileModal').remove()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="display: flex; flex-direction: column; gap: 2rem;">
                        <!-- Profile Header -->
                        <div style="display: flex; gap: 1.5rem; align-items: flex-start; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-light);">
                            <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #1e40af); color: white; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 700; flex-shrink: 0;">
                                ${userData.full_name ? userData.full_name.charAt(0).toUpperCase() : userData.username.charAt(0).toUpperCase()}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-light); margin-bottom: 0.25rem;">${userData.full_name || userData.username}</div>
                                <div style="font-size: 0.95rem; color: var(--text-light-secondary); margin-bottom: 1rem;">${userData.email || 'user@example.com'}</div>
                                <div style="display: inline-block; background-color: var(--color-primary-light); color: var(--color-primary); padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.85rem; font-weight: 600;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; margin-right: 0.5rem; vertical-align: -2px;">
                                        <circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle>
                                    </svg>
                                    Active Account
                                </div>
                            </div>
                        </div>
                        
                        <!-- Profile Details -->
                        <div style="display: grid; gap: 1.25rem;">
                            <div>
                                <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-light-secondary); display: block; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em;">Full Name</label>
                                <div style="padding: 0.875rem 1rem; background-color: var(--bg-light-tertiary); border: 1px solid var(--border-light); border-radius: 0.5rem; color: var(--text-light); font-weight: 500;">${userData.full_name || 'Not set'}</div>
                            </div>
                            
                            <div>
                                <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-light-secondary); display: block; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em;">Username</label>
                                <div style="padding: 0.875rem 1rem; background-color: var(--bg-light-tertiary); border: 1px solid var(--border-light); border-radius: 0.5rem; color: var(--text-light); font-weight: 500;">${userData.username}</div>
                            </div>
                            
                            <div>
                                <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-light-secondary); display: block; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em;">Email Address</label>
                                <div style="padding: 0.875rem 1rem; background-color: var(--bg-light-tertiary); border: 1px solid var(--border-light); border-radius: 0.5rem; color: var(--text-light); font-weight: 500;">${userData.email}</div>
                            </div>
                            
                            <div>
                                <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-light-secondary); display: block; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em;">Member Since</label>
                                <div style="padding: 0.875rem 1rem; background-color: var(--bg-light-tertiary); border: 1px solid var(--border-light); border-radius: 0.5rem; color: var(--text-light); font-weight: 500;">${userData.created_at ? new Date(userData.created_at).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}) : 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Close modal when clicking outside
    document.getElementById('profileModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

function openSettingsModal() {
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    const modalHTML = `
        <div id="settingsModal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 650px;">
                <div class="modal-header">
                    <h2>Account Settings</h2>
                    <button class="close-btn" onclick="document.getElementById('settingsModal').remove()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="display: flex; flex-direction: column; gap: 2.5rem;">
                        <!-- General Settings -->
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary);">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path><path d="M15 9h-6v6h6z"></path>
                                </svg>
                                <h3 style="font-size: 1.125rem; font-weight: 700; margin: 0; color: var(--text-light);">General</h3>
                            </div>
                            <div style="display: grid; gap: 1.25rem;">
                                <div>
                                    <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-light-secondary); display: block; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em;">Full Name</label>
                                    <input type="text" value="${userData.full_name || ''}" style="width: 100%; padding: 0.875rem 1rem; border: 1px solid var(--border-light); border-radius: 0.5rem; font-size: 0.95rem; background-color: var(--bg-light-secondary); color: var(--text-light);" disabled>
                                </div>
                                <div>
                                    <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-light-secondary); display: block; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em;">Email Address</label>
                                    <input type="email" value="${userData.email}" style="width: 100%; padding: 0.875rem 1rem; border: 1px solid var(--border-light); border-radius: 0.5rem; font-size: 0.95rem; background-color: var(--bg-light-secondary); color: var(--text-light);" disabled>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Security Settings -->
                        <div style="padding-top: 1.5rem; border-top: 1px solid var(--border-light);">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary);">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                <h3 style="font-size: 1.125rem; font-weight: 700; margin: 0; color: var(--text-light);">Security</h3>
                            </div>
                            <button style="padding: 0.875rem 1.5rem; background-color: var(--color-primary); color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; font-size: 0.95rem; transition: all 0.2s ease-out; display: inline-flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.backgroundColor='#1e40af'" onmouseout="this.style.backgroundColor='#2563eb'" onclick="alert('Password change functionality coming soon')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v6m0 6v6"></path><path d="M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24"></path><path d="M1 12h6m6 0h6"></path><path d="M4.22 19.78l4.24-4.24m2.12-2.12l4.24-4.24"></path></svg>
                                Change Password
                            </button>
                        </div>
                        
                        <!-- Preferences -->
                        <div style="padding-top: 1.5rem; border-top: 1px solid var(--border-light);">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary);">
                                    <circle cx="12" cy="12" r="1"></circle><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24M1 12h6m6 0h6m-16.78 7.78l4.24-4.24m2.12-2.12l4.24-4.24"></path>
                                </svg>
                                <h3 style="font-size: 1.125rem; font-weight: 700; margin: 0; color: var(--text-light);">Preferences</h3>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; background-color: var(--bg-light-tertiary); border: 1px solid var(--border-light); border-radius: 0.5rem;">
                                <div>
                                    <div style="font-weight: 700; color: var(--text-light); margin-bottom: 0.25rem;">Email Notifications</div>
                                    <div style="font-size: 0.85rem; color: var(--text-light-secondary);">Receive email updates about your activity</div>
                                </div>
                                <input type="checkbox" checked style="width: 1.5rem; height: 1.5rem; cursor: pointer; accent-color: var(--color-primary);">
                            </div>
                        </div>
                        
                        <!-- Storage Info -->
                        <div style="padding-top: 1.5rem; border-top: 1px solid var(--border-light);">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary);">
                                    <path d="M8 2H5a3 3 0 00-3 3v12a3 3 0 003 3h3m8-18h3a3 3 0 013 3v12a3 3 0 01-3 3h-3"></path><path d="M12 8v8m0-8l-3 3m3-3l3 3"></path>
                                </svg>
                                <h3 style="font-size: 1.125rem; font-weight: 700; margin: 0; color: var(--text-light);">Storage</h3>
                            </div>
                            <div style="padding: 1.25rem; background-color: var(--bg-light-tertiary); border: 1px solid var(--border-light); border-radius: 0.5rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                                    <span style="color: var(--text-light); font-weight: 500;">Storage Used</span>
                                    <span style="font-weight: 700; color: var(--text-light);">Unlimited</span>
                                </div>
                                <div style="width: 100%; height: 10px; background-color: var(--border-light); border-radius: 5px; overflow: hidden;">
                                    <div style="width: 35%; height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Close modal when clicking outside
    document.getElementById('settingsModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

function handleLogout() {
    // Clear stored user data
    localStorage.removeItem('userData');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userData');
    
    // Make logout request to backend
    fetch('/logout', {
        method: 'GET'
    })
    .then(response => {
        // Redirect to login page
        window.location.href = '/login';
    })
    .catch(err => {
        console.error('Logout error:', err);
        // Force redirect to login on error
        window.location.href = '/login';
    });
}

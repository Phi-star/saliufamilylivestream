document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const usernameDisplay = document.getElementById('usernameDisplay');
    const welcomeUsername = document.getElementById('welcomeUsername');
    const userAvatar = document.getElementById('userAvatar');
    const userStatus = document.getElementById('userStatus');
    const liveStreamsContainer = document.getElementById('liveStreamsContainer');
    const usersListContainer = document.getElementById('usersListContainer');
    const logoutBtn = document.getElementById('logoutBtn');
    const notificationToast = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');
    const notificationCount = document.querySelector('.notification-count');

    // Current user and state
    let currentUser = localStorage.getItem('currentUser');
    let allUsers = JSON.parse(localStorage.getItem('users')) || [];
    let notifications = 0;

    // Initialize the dashboard
    function initDashboard() {
        if (!currentUser) {
            window.location.href = 'index.html';
            return;
        }

        // Display user info
        const user = getUserData(currentUser);
        usernameDisplay.textContent = currentUser;
        welcomeUsername.textContent = currentUser;
        userAvatar.textContent = currentUser.charAt(0).toUpperCase();
        userStatus.textContent = user.isLive ? 'Live Now' : 'Offline';
        if (user.isLive) userStatus.style.color = 'var(--danger-color)';

        // Load initial data
        loadLiveStreams();
        loadAllUsers();
        checkForLiveNotifications();

        // Set up periodic updates
        setInterval(loadLiveStreams, 10000);
    }

    // Get user data from localStorage
    function getUserData(username) {
        return JSON.parse(localStorage.getItem(username)) || { 
            username: username,
            friends: [],
            isLive: false,
            notifications: [],
            viewers: 0,
            streamTitle: '',
            streamCategory: ''
        };
    }

    // Load live streams from all users
    function loadLiveStreams() {
        const liveStreams = allUsers
            .map(username => getUserData(username))
            .filter(user => user.isLive);

        if (liveStreams.length === 0) {
            liveStreamsContainer.innerHTML = `
                <div class="no-streams">
                    <i class="fas fa-video-slash"></i>
                    <p>No live streams at the moment</p>
                </div>
            `;
            return;
        }

        liveStreamsContainer.innerHTML = liveStreams.map(user => `
            <div class="stream-card" data-username="${user.username}">
                <div class="stream-thumbnail">
                    <img src="https://via.placeholder.com/400x225?text=${user.username}'s+Stream" alt="Stream Thumbnail">
                    <span class="live-badge">LIVE</span>
                </div>
                <div class="stream-info">
                    <div class="streamer-info">
                        <div class="streamer-avatar">${user.username.charAt(0).toUpperCase()}</div>
                        <div class="streamer-name">${user.username}</div>
                    </div>
                    <h3 class="stream-title">${user.streamTitle || `${user.username}'s Live Stream`}</h3>
                    <span class="stream-category">${user.streamCategory || 'Just Chatting'}</span>
                    <div class="stream-viewers">
                        <i class="fas fa-users"></i>
                        <span>${user.viewers || 0} viewers</span>
                    </div>
                </div>
                <a href="watch.html?streamer=${user.username}" class="watch-btn">Watch Stream</a>
            </div>
        `).join('');
    }

    // Load all users (for friends list)
    function loadAllUsers() {
        if (allUsers.length <= 1) {
            usersListContainer.innerHTML = `
                <div class="no-users">
                    <i class="fas fa-user-friends"></i>
                    <p>No other users found</p>
                </div>
            `;
            return;
        }

        usersListContainer.innerHTML = allUsers
            .filter(username => username !== currentUser)
            .map(username => {
                const user = getUserData(username);
                const currentUserData = getUserData(currentUser);
                const isFriend = currentUserData.friends.includes(username);
                
                return `
                    <div class="user-card" data-username="${username}">
                        <div class="user-avatar">${username.charAt(0).toUpperCase()}</div>
                        <div class="user-details">
                            <div class="user-name">${username}</div>
                            <div class="user-status ${user.isLive ? 'live' : ''}">
                                ${user.isLive ? 'Live Now' : 'Offline'}
                            </div>
                        </div>
                        <button class="add-friend-btn ${isFriend ? 'added' : ''}" 
                                data-username="${username}">
                            ${isFriend ? 'Added' : 'Add Friend'}
                        </button>
                    </div>
                `;
            }).join('');

        // Add event listeners to add friend buttons
        document.querySelectorAll('.add-friend-btn:not(.added)').forEach(btn => {
            btn.addEventListener('click', function() {
                const friendUsername = this.dataset.username;
                addFriend(friendUsername);
            });
        });
    }

    // Add a friend
    function addFriend(friendUsername) {
        const user = getUserData(currentUser);
        if (!user.friends.includes(friendUsername)) {
            user.friends.push(friendUsername);
            saveUserData(currentUser, user);
            
            // Update UI
            const btn = document.querySelector(`.add-friend-btn[data-username="${friendUsername}"]`);
            btn.textContent = 'Added';
            btn.classList.add('added');
            
            // Send notification to the friend
            const friend = getUserData(friendUsername);
            friend.notifications = friend.notifications || [];
            friend.notifications.push({
                type: 'friend_request',
                from: currentUser,
                message: `${currentUser} added you as a friend`,
                timestamp: new Date().toISOString(),
                read: false
            });
            saveUserData(friendUsername, friend);
            
            showNotification(`${friendUsername} added to your friends list`);
        }
    }

    // Check for live notifications
    function checkForLiveNotifications() {
        const user = getUserData(currentUser);
        const liveNotifications = (user.notifications || [])
            .filter(n => n.type === 'live_stream' && !n.read)
            .slice(0, 3);
        
        if (liveNotifications.length > 0) {
            notifications += liveNotifications.length;
            notificationCount.textContent = notifications;
            
            // Mark as read
            user.notifications.forEach(n => {
                if (n.type === 'live_stream') n.read = true;
            });
            saveUserData(currentUser, user);
            
            // Show notifications
            liveNotifications.forEach((notification, i) => {
                setTimeout(() => {
                    showNotification(notification.message, 'info');
                }, i * 3000);
            });
        }
    }

    // Show notification toast
    function showNotification(message, type = 'success') {
        toastMessage.textContent = message;
        notificationToast.className = `notification-toast ${type}`;
        notificationToast.classList.add('show');
        
        setTimeout(() => {
            notificationToast.classList.remove('show');
        }, 5000);
    }

    // Save user data to localStorage
    function saveUserData(username, data) {
        localStorage.setItem(username, JSON.stringify(data));
    }

    // Logout button click handler
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Initialize the dashboard
    initDashboard();
});

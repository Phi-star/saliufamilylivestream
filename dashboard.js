document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const usernameDisplay = document.getElementById('usernameDisplay');
    const welcomeUsername = document.getElementById('welcomeUsername');
    const userAvatar = document.getElementById('userAvatar');
    const userStatus = document.getElementById('userStatus');
    const startStreamBtn = document.getElementById('startStreamBtn');
    const streamSetup = document.getElementById('streamSetup');
    const streamPreview = document.getElementById('streamPreview');
    const livePreview = document.getElementById('livePreview');
    const goLiveBtn = document.getElementById('goLiveBtn');
    const cancelStreamBtn = document.getElementById('cancelStreamBtn');
    const accessCameraBtn = document.getElementById('accessCameraBtn');
    const switchCameraBtn = document.getElementById('switchCameraBtn');
    const streamTitle = document.getElementById('streamTitle');
    const streamCategory = document.getElementById('streamCategory');
    const liveStreamsContainer = document.getElementById('liveStreamsContainer');
    const usersListContainer = document.getElementById('usersListContainer');
    const logoutBtn = document.getElementById('logoutBtn');
    const streamModal = document.getElementById('streamModal');
    const closeStreamBtn = document.querySelector('.close-stream');
    const streamViewer = document.getElementById('streamViewer');
    const streamerName = document.getElementById('streamerName');
    const streamTitleDisplay = document.getElementById('streamTitleDisplay');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const viewerCount = document.getElementById('viewerCount');
    const onlineCount = document.getElementById('onlineCount');
    const notificationToast = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');
    const notificationCount = document.querySelector('.notification-count');

    // Current user and stream state
    let currentUser = localStorage.getItem('currentUser');
    let currentStream = null;
    let mediaStream = null;
    let peerConnection = null;
    let dataChannel = null;
    let viewers = 0;
    let onlineUsers = 0;
    let notifications = 0;
    let allUsers = JSON.parse(localStorage.getItem('users')) || [];
    let currentFacingMode = 'user'; // 'user' for front camera, 'environment' for back

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
        setInterval(updateViewerCount, 5000);
    }

    // Get user data from localStorage
    function getUserData(username) {
        return JSON.parse(localStorage.getItem(username)) || { 
            username: username,
            friends: [],
            isLive: false,
            notifications: []
        };
    }

    // Save user data to localStorage
    function saveUserData(username, data) {
        localStorage.setItem(username, JSON.stringify(data));
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
                <button class="watch-btn">Watch Stream</button>
            </div>
        `).join('');

        // Add event listeners to watch buttons
        document.querySelectorAll('.watch-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const username = this.closest('.stream-card').dataset.username;
                watchStream(username);
            });
        });
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
                

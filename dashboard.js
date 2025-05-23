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
    let isStreaming = false;

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
        updateUserStatus(user.isLive);

        // Load initial data
        loadLiveStreams();
        loadAllUsers();
        checkForLiveNotifications();

        // Set up periodic updates
        setInterval(loadLiveStreams, 10000);
        setInterval(updateViewerCount, 5000);
    }

    // Update user status display
    function updateUserStatus(isLive) {
        userStatus.textContent = isLive ? 'Live Now' : 'Offline';
        userStatus.style.color = isLive ? 'var(--danger-color)' : '';
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
            streamCategory: '',
            streamKey: ''
        };
    }

    // Save user data to localStorage
    function saveUserData(username, data) {
        localStorage.setItem(username, JSON.stringify(data));
    }

    // Generate a random stream key
    function generateStreamKey() {
        return 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Load live streams from all users
    function loadLiveStreams() {
        const liveStreams = allUsers
            .map(username => getUserData(username))
            .filter(user => user.isLive && user.username !== currentUser);

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
                `;
            }).join('');

        // Add event listeners to add friend buttons
        document.querySelectorAll('.add-friend-btn:not(.added)').forEach(btn => {
            btn.addEventListener('click', function() {
                const friendUsername = this.dataset.username;
                addFriend(friendUsername);
            });
        });

        // Add click handler for live users
        document.querySelectorAll('.user-card .user-status.live').forEach(status => {
            status.closest('.user-card').addEventListener('click', function() {
                const username = this.dataset.username;
                watchStream(username);
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

    // Start stream button click handler
    startStreamBtn.addEventListener('click', function() {
        startStreamBtn.classList.add('hidden');
        streamSetup.classList.remove('hidden');
    });

    // Access camera and prepare stream button
    accessCameraBtn.addEventListener('click', async function() {
        const title = streamTitle.value.trim();
        if (!title) {
            showNotification('Please enter a stream title', 'error');
            return;
        }

        try {
            // Request camera and microphone access
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: currentFacingMode
                }, 
                audio: true 
            });
            
            // Show preview
            livePreview.srcObject = mediaStream;
            streamPreview.classList.remove('hidden');
            
            // Scroll to preview
            streamPreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            showNotification('Camera accessed successfully!', 'success');
        } catch (err) {
            console.error('Error accessing media devices:', err);
            showNotification('Could not access camera/microphone. Please check permissions.', 'error');
        }
    });

    // Switch camera button
    switchCameraBtn.addEventListener('click', async function() {
        if (!mediaStream) return;
        
        // Stop current tracks
        mediaStream.getTracks().forEach(track => track.stop());
        
        // Toggle facing mode
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        
        try {
            // Get new media stream with opposite camera
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: currentFacingMode
                }, 
                audio: true 
            });
            
            // Update preview
            livePreview.srcObject = mediaStream;
            showNotification(`Switched to ${currentFacingMode === 'user' ? 'front' : 'back'} camera`, 'info');
        } catch (err) {
            console.error('Error switching cameras:', err);
            showNotification('Could not switch cameras', 'error');
        }
    });

    // Go live button click handler
    goLiveBtn.addEventListener('click', function() {
        if (isStreaming) return;
        
        const title = streamTitle.value.trim() || `${currentUser}'s Live Stream`;
        const category = streamCategory.value;
        
        // Update user status
        const user = getUserData(currentUser);
        user.isLive = true;
        user.streamTitle = title;
        user.streamCategory = category;
        user.viewers = 0;
        user.streamStartTime = new Date().toISOString();
        user.streamKey = generateStreamKey();
        saveUserData(currentUser, user);
        
        // Create current stream object
        currentStream = {
            username: currentUser,
            title: title,
            category: category,
            viewers: 0,
            startTime: new Date().toISOString(),
            streamKey: user.streamKey
        };
        
        // Enter full-screen mode for the preview
        if (livePreview.requestFullscreen) {
            livePreview.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else if (livePreview.webkitRequestFullscreen) {
            livePreview.webkitRequestFullscreen();
        } else if (livePreview.msRequestFullscreen) {
            livePreview.msRequestFullscreen();
        }
        
        // Update UI
        updateUserStatus(true);
        isStreaming = true;
        
        // Notify all users
        notifyUsersAboutLiveStream();
        
        // Generate and show the stream link (for demo purposes)
        const streamLink = `${window.location.origin}/watch.html?stream=${currentUser}&key=${user.streamKey}`;
        console.log('Stream link (for testing):', streamLink);
        showNotification(`You are now live! Stream URL: ${streamLink}`, 'success');
        
        // Reset the stream setup UI
        streamSetup.classList.add('hidden');
        startStreamBtn.classList.remove('hidden');
        streamTitle.value = '';
    });

    // Cancel stream button click handler
    cancelStreamBtn.addEventListener('click', function() {
        stopStream();
    });

    // Watch a stream
    function watchStream(username) {
        if (!currentUser) {
            showNotification('You need to be logged in to watch streams', 'error');
            return;
        }
        
        const streamer = getUserData(username);
        
        if (!streamer.isLive) {
            showNotification('This user is not currently live.', 'error');
            return;
        }
        
        // Update stream info in modal
        streamerName.textContent = username;
        streamTitleDisplay.textContent = streamer.streamTitle || `${username}'s Stream`;
        viewerCount.textContent = `${streamer.viewers || 0} viewers`;
        
        // In a real app, this would connect to the actual stream via WebRTC or HLS
        // For demo purposes, we'll use a placeholder with simulated WebRTC
        simulateStreamConnection(username);
        
        // Show the modal
        streamModal.classList.remove('hidden');
        
        // Update viewer count for the streamer
        if (streamer.viewers) {
            streamer.viewers += 1;
        } else {
            streamer.viewers = 1;
        }
        saveUserData(username, streamer);
        
        // Simulate chat and viewers
        simulateChat(username);
        simulateViewers(username);
    }

    // Simulate stream connection (would be WebRTC in real implementation)
    function simulateStreamConnection(username) {
        console.log(`Connecting to ${username}'s stream...`);
        
        // For demo, we'll use a placeholder video
        streamViewer.src = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';
        streamViewer.play().catch(e => console.error('Error playing stream:', e));
    }

    // Close stream modal
    closeStreamBtn.addEventListener('click', function() {
        streamModal.classList.add('hidden');
        if (streamViewer.srcObject) {
            streamViewer.srcObject.getTracks().forEach(track => track.stop());
            streamViewer.srcObject = null;
        }
        streamViewer.src = '';
    });

    // Send chat message
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', 'sender');
        messageElement.innerHTML = `
            <span class="message-sender">You</span>
            <span class="message-text">${message}</span>
            <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        `;
        chatMessages.appendChild(messageElement);
        
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Simulate incoming chat messages
    function simulateChat(username) {
        // Clear any existing interval
        if (window.chatInterval) clearInterval(window.chatInterval);
        
        const messages = [
            "Hey everyone! How's it going?",
            "This stream is awesome!",
            "LOL that was hilarious",
            "First time watching, loving the content!",
            "Can you play my favorite song next?",
            "Greetings from Germany!",
            "The stream quality is great!",
            "How long have you been streaming today?",
            "Thanks for the amazing content!",
            "Just subscribed to your channel!"
        ];
        
        const users = ['StreamFan123', 'ViewerPro', 'ChatLover', 'StreamBuddy', 'RandomUser'];
        
        window.chatInterval = setInterval(() => {
            if (!streamModal.classList.contains('hidden')) {
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                const randomUser = users[Math.floor(Math.random() * users.length)];
                const isViewer = Math.random() > 0.7;
                
                const messageElement = document.createElement('div');
                messageElement.classList.add('chat-message');
                if (isViewer) messageElement.classList.add('viewer');
                
                messageElement.innerHTML = `
                    <span class="message-sender">${randomUser}</span>
                    <span class="message-text">${randomMessage}</span>
                    <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                `;
                
                chatMessages.appendChild(messageElement);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }, 3000);
    }

    // Simulate viewer count updates
    function simulateViewers(username) {
        if (window.viewerInterval) clearInterval(window.viewerInterval);
        
        let count = parseInt(viewerCount.textContent) || 1;
        onlineCount.textContent = `${count} online`;
        
        window.viewerInterval = setInterval(() => {
            if (!streamModal.classList.contains('hidden')) {
                const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                count = Math.max(1, count + change);
                viewerCount.textContent = `${count} viewers`;
                onlineCount.textContent = `${count} online`;
                
                // Update the streamer's viewer count
                const streamer = getUserData(username);
                if (streamer.isLive) {
                    streamer.viewers = count;
                    saveUserData(username, streamer);
                }
            }
        }, 5000);
    }

    // Notify users about live stream
    function notifyUsersAboutLiveStream() {
        allUsers.forEach(username => {
            if (username !== currentUser) {
                const user = getUserData(username);
                user.notifications = user.notifications || [];
                user.notifications.push({
                    type: 'live_stream',
                    from: currentUser,
                    message: `${currentUser} is now live streaming: ${currentStream.title}`,
                    timestamp: new Date().toISOString(),
                    read: false
                });
                saveUserData(username, user);
            }
        });
    }

    // Check for live notifications
    function checkForLiveNotifications() {
        const user = getUserData(currentUser);
        const liveNotifications = (user.notifications || [])
            .filter(n => n.type === 'live_stream' && !n.read)
            .slice(0, 3); // Show max 3 notifications
        
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

    // Update viewer count periodically
    function updateViewerCount() {
        if (currentStream) {
            const user = getUserData(currentUser);
            if (user.isLive) {
                // Simulate viewer fluctuation
                const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                user.viewers = Math.max(0, (user.viewers || 0) + change);
                saveUserData(currentUser, user);
            }
        }
    }

    // Stop the stream
    function stopStream() {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        
        if (currentStream) {
            // Update user status
            const user = getUserData(currentUser);
            user.isLive = false;
            user.streamTitle = '';
            user.streamCategory = '';
            user.viewers = 0;
            saveUserData(currentUser, user);
            
            currentStream = null;
            isStreaming = false;
            
            // Update UI
            updateUserStatus(false);
        }
        
        // Reset stream UI
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        livePreview.srcObject = null;
        streamSetup.classList.add('hidden');
        streamPreview.classList.add('hidden');
        startStreamBtn.classList.remove('hidden');
        streamTitle.value = '';
        
        showNotification('Your live stream has ended.');
    }

    // Logout button click handler
    logoutBtn.addEventListener('click', function() {
        // Stop stream if live
        if (isStreaming) {
            stopStream();
        }
        
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Initialize the dashboard
    initDashboard();

    // Event listeners
    sendMessageBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
});

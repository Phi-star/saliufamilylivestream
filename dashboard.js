document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const usernameDisplay = document.getElementById('usernameDisplay');
    const welcomeUsername = document.getElementById('welcomeUsername');
    const userAvatar = document.getElementById('userAvatar');
    const userStatus = document.getElementById('userStatus');
    const startStreamBtn = document.getElementById('startStreamBtn');
    const streamPreview = document.getElementById('streamPreview');
    const livePreview = document.getElementById('livePreview');
    const goLiveBtn = document.getElementById('goLiveBtn');
    const cancelStreamBtn = document.getElementById('cancelStreamBtn');
    const liveStreamsContainer = document.getElementById('liveStreamsContainer');
    const friendsListContainer = document.getElementById('friendsListContainer');
    const logoutBtn = document.getElementById('logoutBtn');
    const streamModal = document.getElementById('streamModal');
    const closeStreamBtn = document.querySelector('.close-stream');
    const streamViewer = document.getElementById('streamViewer');
    const streamerName = document.getElementById('streamerName');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const viewerCount = document.getElementById('viewerCount');

    // Current user
    let currentUser = localStorage.getItem('currentUser');
    let currentStream = null;
    let stream = null;
    let peerConnection = null;
    let dataChannel = null;
    let viewers = 0;

    // Initialize the dashboard
    function initDashboard() {
        if (!currentUser) {
            window.location.href = 'index.html';
            return;
        }

        // Display user info
        const user = JSON.parse(localStorage.getItem(currentUser));
        usernameDisplay.textContent = currentUser;
        welcomeUsername.textContent = currentUser;
        userAvatar.textContent = currentUser.charAt(0).toUpperCase();
        userStatus.textContent = user.isLive ? 'Live Now' : 'Offline';

        // Load live streams
        loadLiveStreams();

        // Load friends list
        loadFriendsList();
    }

    // Load live streams from "database"
    function loadLiveStreams() {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const liveStreams = users
            .map(username => JSON.parse(localStorage.getItem(username)))
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
                    <h3 class="stream-title">${user.username}'s Live Stream</h3>
                    <span class="stream-category">Just Chatting</span>
                    <div class="stream-viewers">
                        <i class="fas fa-users"></i>
                        <span>${Math.floor(Math.random() * 100) + 1} viewers</span>
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

    // Load friends list
    function loadFriendsList() {
        const user = JSON.parse(localStorage.getItem(currentUser));
        const friends = user.friends || [];

        if (friends.length === 0) {
            friendsListContainer.innerHTML = `
                <div class="no-friends">
                    <i class="fas fa-user-friends"></i>
                    <p>You don't have any friends yet</p>
                    <button class="add-friends-btn">Add Friends</button>
                </div>
            `;
            return;
        }

        friendsListContainer.innerHTML = friends.map(friend => {
            const friendData = JSON.parse(localStorage.getItem(friend));
            return `
                <div class="friend-card" data-username="${friend}">
                    <div class="friend-avatar">${friend.charAt(0).toUpperCase()}</div>
                    <div class="friend-details">
                        <div class="friend-name">${friend}</div>
                        <div class="friend-status ${friendData.isLive ? 'online' : ''}">
                            ${friendData.isLive ? 'Live Now' : 'Offline'}
                        </div>
                    </div>
                    <div class="friend-actions">
                        <button class="friend-btn" title="Message"><i class="fas fa-comment"></i></button>
                        <button class="friend-btn" title="View Profile"><i class="fas fa-user"></i></button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners to friend cards
        document.querySelectorAll('.friend-card').forEach(card => {
            const username = card.dataset.username;
            const friendData = JSON.parse(localStorage.getItem(username));
            
            if (friendData.isLive) {
                card.addEventListener('click', () => watchStream(username));
            }
        });
    }

    // Start stream button click handler
    startStreamBtn.addEventListener('click', async function() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            livePreview.srcObject = stream;
            streamPreview.classList.remove('hidden');
            startStreamBtn.classList.add('hidden');
            
            // Simulate WebRTC connection setup
            setupWebRTC();
        } catch (err) {
            console.error('Error accessing media devices:', err);
            alert('Could not access camera/microphone. Please check permissions.');
        }
    });

    // Go live button click handler
    goLiveBtn.addEventListener('click', function() {
        // Update user status
        const user = JSON.parse(localStorage.getItem(currentUser));
        user.isLive = true;
        localStorage.setItem(currentUser, JSON.stringify(user));
        userStatus.textContent = 'Live Now';
        
        // Create a new stream entry
        currentStream = {
            username: currentUser,
            title: `${currentUser}'s Live Stream`,
            category: 'Just Chatting',
            viewers: 0,
            startTime: new Date().toISOString()
        };
        
        // Show success message
        alert('You are now live!');
        
        // Refresh streams list for other users
        // In a real app, this would be handled by a server
    });

    // Cancel stream button click handler
    cancelStreamBtn.addEventListener('click', function() {
        stopStream();
    });

    // Watch a stream
    function watchStream(username) {
        const streamer = JSON.parse(localStorage.getItem(username));
        
        if (!streamer.isLive) {
            alert('This user is not currently live.');
            return;
        }
        
        streamerName.textContent = username;
        viewerCount.textContent = Math.floor(Math.random() * 100) + 1;
        
        // In a real app, this would connect to the actual stream
        streamViewer.src = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';
        
        // Show the modal
        streamModal.classList.add('show');
        
        // Simulate chat messages
        simulateChat();
    }

    // Close stream modal
    closeStreamBtn.addEventListener('click', function() {
        streamModal.classList.remove('show');
        if (streamViewer.srcObject) {
            streamViewer.srcObject.getTracks().forEach(track => track.stop());
            streamViewer.srcObject = null;
        }
    });

    // Send chat message
    sendMessageBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });

    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', 'sender');
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Simulate incoming chat messages
    function simulateChat() {
        const messages = [
            "Hey everyone!",
            "How's it going?",
            "This stream is awesome!",
            "LOL that was funny",
            "First time watching, loving it!",
            "Can you play my favorite song?",
            "Greetings from Germany!",
            "The quality is great!",
            "How long have you been streaming?",
            "Thanks for the content!"
        ];
        
        setInterval(() => {
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            const randomUser = ['StreamFan123', 'ViewerPro', 'ChatLover', 'StreamBuddy', 'RandomUser'][Math.floor(Math.random() * 5)];
            
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message');
            messageElement.textContent = `${randomUser}: ${randomMessage}`;
            chatMessages.appendChild(messageElement);
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 3000);
    }

    // Setup WebRTC (simplified simulation)
    function setupWebRTC() {
        console.log('Setting up WebRTC connection...');
        // In a real app, this would set up peer connections, signaling, etc.
    }

    // Stop the stream
    function stopStream() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        if (currentStream) {
            // Update user status
            const user = JSON.parse(localStorage.getItem(currentUser));
            user.isLive = false;
            localStorage.setItem(currentUser, JSON.stringify(user));
            userStatus.textContent = 'Offline';
            
            currentStream = null;
        }
        
        livePreview.srcObject = null;
        streamPreview.classList.add('hidden');
        startStreamBtn.classList.remove('hidden');
    }

    // Logout button click handler
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Initialize the dashboard
    initDashboard();

    // Simulate viewer count updates
    setInterval(() => {
        if (streamModal.classList.contains('show')) {
            const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            let current = parseInt(viewerCount.textContent);
            current = Math.max(1, current + change); // Never go below 1
            viewerCount.textContent = current;
        }
    }, 5000);
})

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const urlParams = new URLSearchParams(window.location.search);
    const streamerUsername = urlParams.get('stream');
    const streamKey = urlParams.get('key');
    
    const currentUser = localStorage.getItem('currentUser');
    const authMessage = document.getElementById('authMessage');
    const streamPlayer = document.getElementById('streamPlayer');
    const streamTitle = document.getElementById('streamTitle');
    const streamerName = document.getElementById('streamerName');
    const viewerCount = document.getElementById('viewerCount');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    // Check authentication
    if (!currentUser) {
        authMessage.classList.remove('hidden');
        return;
    }

    // Load streamer data from localStorage
    const streamerData = JSON.parse(localStorage.getItem(streamerUsername)) || {
        username: streamerUsername,
        streamTitle: `${streamerUsername}'s Stream`,
        viewers: 0
    };

    // Update UI with stream info
    function updateStreamInfo() {
        streamTitle.textContent = streamerData.streamTitle;
        streamerName.textContent = `Streamer: ${streamerUsername}`;
        viewerCount.textContent = `${streamerData.viewers || 0}`;
    }

    updateStreamInfo();

    // Simulate loading the stream
    function loadStream() {
        // In a real app, you would connect to the actual stream here
        streamPlayer.src = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';
        streamPlayer.play().catch(e => console.error('Error playing stream:', e));
    }

    loadStream();

    // Fullscreen functionality
    function setupFullscreen() {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });

        // Change icon based on fullscreen state
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            } else {
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            }
        });
    }

    setupFullscreen();

    // Simulate viewer count updates
    function simulateViewers() {
        let viewers = parseInt(streamerData.viewers) || 1;
        
        const updateViewerCount = () => {
            const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            viewers = Math.max(1, viewers + change);
            viewerCount.textContent = `${viewers}`;
            
            // Update the streamer's viewer count in localStorage
            if (streamerData) {
                streamerData.viewers = viewers;
                localStorage.setItem(streamerUsername, JSON.stringify(streamerData));
            }
        };

        // Initial update
        updateViewerCount();
        
        // Update every 5 seconds
        setInterval(updateViewerCount, 5000);
    }

    simulateViewers();

    // Chat functionality (without random messages)
    function setupChat() {
        // Handle sending messages
        function sendMessage() {
            const message = chatInput.value.trim();
            if (!message) return;
            
            addChatMessage('You', message, true);
            chatInput.value = '';
        }

        function addChatMessage(sender, text, isSender = false) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message');
            if (isSender) messageElement.classList.add('sender');
            
            messageElement.innerHTML = `
                <span class="message-sender">${sender}</span>
                <span class="message-text">${text}</span>
                <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            `;
            
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        sendMessageBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }

    setupChat();
})

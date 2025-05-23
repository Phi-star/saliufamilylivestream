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
        // For demo purposes, we're using a sample video
        streamPlayer.src = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';
        streamPlayer.play().catch(e => console.error('Error playing stream:', e));
    }

    loadStream();

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

    // Chat functionality
    function setupChat() {
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
        
        // Simulate incoming chat messages
        setInterval(() => {
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const isViewer = Math.random() > 0.7;
            
            addChatMessage(randomUser, randomMessage, isViewer);
        }, 3000);

        // Handle sending messages
        function sendMessage() {
            const message = chatInput.value.trim();
            if (!message) return;
            
            addChatMessage('You', message, false, true);
            chatInput.value = '';
        }

        function addChatMessage(sender, text, isViewer = false, isSender = false) {
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
});

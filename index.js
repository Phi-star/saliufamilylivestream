document.addEventListener('DOMContentLoaded', function() {
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const showSignUpLink = document.getElementById('showSignUp');
    const container = document.getElementById('container');
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const modal = document.getElementById('successModal');
    const closeModal = document.querySelector('.close');

    // Toggle between sign up and sign in forms
    signUpButton.addEventListener('click', () => {
        container.classList.add('right-panel-active');
    });

    signInButton.addEventListener('click', () => {
        container.classList.remove('right-panel-active');
    });

    // Show sign up form when "Sign Up" link is clicked
    showSignUpLink.addEventListener('click', (e) => {
        e.preventDefault();
        container.classList.add('right-panel-active');
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Check if user is already logged in
    checkLoggedIn();

    // Sign up form submission
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        
        // Validate inputs
        if (!username || !email || !password || !confirmPassword) {
            showModal('Error', 'Please fill in all fields');
            return;
        }
        
        if (password !== confirmPassword) {
            showModal('Error', 'Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            showModal('Error', 'Password must be at least 6 characters');
            return;
        }
        
        // Check if username already exists
        if (localStorage.getItem(username)) {
            showModal('Error', 'Username already exists');
            return;
        }
        
        // Save user data to localStorage
        const user = {
            username,
            email,
            password,
            friends: [],
            streams: [],
            isLive: false
        };
        
        localStorage.setItem(username, JSON.stringify(user));
        
        // Save list of users
        let users = JSON.parse(localStorage.getItem('users')) || [];
        users.push(username);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Show success message
        showModal('Success!', 'Account created successfully. You can now login.');
        
        // Reset form
        signupForm.reset();
        
        // Switch to login form
        container.classList.remove('right-panel-active');
    });

    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        // Check if user exists
        const user = JSON.parse(localStorage.getItem(username));
        
        if (user && user.password === password) {
            // Save current user session
            localStorage.setItem('currentUser', username);
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            showModal('Error', 'Invalid username or password. Please try again.');
        }
    });

    // Check if user is already logged in
    function checkLoggedIn() {
        if (localStorage.getItem('currentUser')) {
            window.location.href = 'dashboard.html';
        }
    }

    // Helper function to show modal
    function showModal(title, message) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        modal.style.display = 'block';
    }
})

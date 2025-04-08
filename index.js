document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const forgotPasswordLink = document.querySelector('#forgot-password');
    const loadingSpinner = document.querySelector('.loading');
    
    // Admin credentials
    const ADMIN_EMAIL = "studentaffairs@edu.ng";
    const ADMIN_PASSWORD = "admin123"; // Replace with actual admin password
    
    // Regular user password (same for all non-admin users)
    const USER_PASSWORD = "user123"; // Replace with actual user password
    
    // Domain validation for university emails
    const VALID_EMAIL_DOMAIN = "@edu.ng";
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        let isValid = true;
        
        // Reset errors
        document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
        
        // Email validation
        if (!email || !validateEmail(email)) {
            document.getElementById('login-email-error').textContent = 'Please enter a valid email address';
            document.getElementById('login-email-error').style.display = 'block';
            isValid = false;
        }
        
        // Domain validation
        if (!email.endsWith(VALID_EMAIL_DOMAIN)) {
            document.getElementById('login-email-error').textContent = 'Please use your university email address';
            document.getElementById('login-email-error').style.display = 'block';
            isValid = false;
        }
        
        // Password validation
        if (!password) {
            document.getElementById('login-password-error').textContent = 'Password is required';
            document.getElementById('login-password-error').style.display = 'block';
            isValid = false;
        }
        
        if (isValid) {
            // Show loading spinner
            loadingSpinner.style.display = 'block';
            
            // Simulate server request with setTimeout
            setTimeout(() => {
                // Check if admin or regular user
                if (email === ADMIN_EMAIL) {
                    // Admin login
                    if (password === ADMIN_PASSWORD) {
                        console.log('Admin login successful');
                        // Redirect to admin dashboard
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        document.getElementById('login-password-error').textContent = 'Invalid password';
                        document.getElementById('login-password-error').style.display = 'block';
                        loadingSpinner.style.display = 'none';
                    }
                } else {
                    // Regular user login
                    if (password === USER_PASSWORD) {
                        console.log('User login successful');
                        // Redirect to user dashboard
                        window.location.href = 'user-dashboard.html';
                    } else {
                        document.getElementById('login-password-error').textContent = 'Invalid password';
                        document.getElementById('login-password-error').style.display = 'block';
                        loadingSpinner.style.display = 'none';
                    }
                }
            }, 1000); // Simulating network delay
        }
    });
    
    // Handle forgot password
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        
        if (!email || !validateEmail(email)) {
            document.getElementById('login-email-error').textContent = 'Please enter your email address first';
            document.getElementById('login-email-error').style.display = 'block';
            return;
        }
        
        if (!email.endsWith(VALID_EMAIL_DOMAIN)) {
            document.getElementById('login-email-error').textContent = 'Please use your university email address';
            document.getElementById('login-email-error').style.display = 'block';
            return;
        }
        
        // Show loading spinner
        loadingSpinner.style.display = 'block';
    
    // Email validation helper function
    function validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email.toLowerCase());
    }
}); 
});
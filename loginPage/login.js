document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  const loggedInUser = localStorage.getItem('loggedInUser');
  if (loggedInUser) {
      // User is already logged in, redirect to dashboard
      window.location.href = '../index.html';
  }

  // Get reference to the login form
  const loginForm = document.getElementById('loginForm');
  
  // Add event listener for form submission
  if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
  }
  
  // Handle forgot password link
  const forgotPasswordLink = document.getElementById('forgot-password');
  if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
          e.preventDefault();
          alert('Password reset functionality will be implemented soon.');
      });
  }
});

// Function to extract name from email address
function extractNameFromEmail(email) {
    // Check if it's a PAU email
    if (!email.endsWith('@pau.edu.ng')) {
        return null;
    }
    
    // Get the part before @pau.edu.ng
    const namePart = email.split('@')[0];
    
    // Check if there's a dot in the name part (firstname.lastname format)
    if (namePart.includes('.')) {
        const [firstName, lastName] = namePart.split('.');
        // Capitalize first letter of each name
        const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
        return {
            firstName: formattedFirstName,
            lastName: formattedLastName,
            fullName: `${formattedFirstName} ${formattedLastName}`
        };
    } else {
        // If no dot, treat the whole part as a name and capitalize first letter
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
        return {
            firstName: formattedName,
            lastName: '',
            fullName: formattedName
        };
    }
}

// Function to handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    // Show loading spinner
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
    
    // Get input values
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Validate email format
    if (!email.endsWith('@pau.edu.ng')) {
        showMessage('Please use your university email address (@pau.edu.ng)', 'error');
        document.getElementById('login-email-error').textContent = 'Please use your university email address';
        document.getElementById('login-email-error').style.display = 'block';
        
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        return;
    }
    
    // Get existing users from localStorage or create default admin if none exist
    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    // If no users exist, create a default admin user
    if (users.length === 0) {
        const defaultAdmin = {
            id: 'ADM10000',
            name: 'Admin User',
            email: 'elvis.ebenuwah@pau.edu.ng',
            password: 'Admin123',  // Updated to Admin123
            registrationDate: new Date().toISOString(),
            role: 'admin'
        };
        users.push(defaultAdmin);
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Find user with matching credentials
    const user = users.find(u => u.email === email && u.password === password);
    
    // If user not found but email is valid PAU email, create new user with default password
    if (!user && email.endsWith('@pau.edu.ng') && email !== 'elvis.ebenuwah@pau.edu.ng') {
        const nameInfo = extractNameFromEmail(email);
        
        if (nameInfo) {
            // Check if user with this email already exists but with wrong password
            const existingUser = users.find(u => u.email === email);
            
            if (existingUser) {
                // Wrong password for existing user
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                
                showMessage('Incorrect password. Please try again.', 'error');
                document.getElementById('login-password-error').textContent = 'Incorrect password';
                document.getElementById('login-password-error').style.display = 'block';
                return;
            }
            
            // Create new user with default password
            const newUser = {
                id: 'STU' + Math.floor(10000 + Math.random() * 90000),
                name: nameInfo.fullName,
                email: email,
                password: 'User123',  // Default password for new users
                registrationDate: new Date().toISOString(),
                role: 'student'
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            // Store logged in user info
            localStorage.setItem('loggedInUser', JSON.stringify({
                name: newUser.name,
                id: newUser.id,
                email: newUser.email,
                role: newUser.role
            }));
            
            showMessage('Account created with default password. Redirecting to dashboard...', 'success');
            
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
            return;
        }
    }
    
    if (user) {
        // Extract name from email if not already present
        let userName = user.name;
        if (!userName || userName.trim() === '') {
            const nameInfo = extractNameFromEmail(email);
            if (nameInfo) {
                userName = nameInfo.fullName;
                // Update the user's name in storage
                user.name = userName;
                localStorage.setItem('users', JSON.stringify(users));
            }
        }
        
        // Store logged in user info
        localStorage.setItem('loggedInUser', JSON.stringify({
            name: userName,
            id: user.id,
            email: user.email,
            role: user.role || 'student'
        }));
        
        // Show success message
        showMessage('Login successful! Redirecting to dashboard...', 'success');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
            window.location.href = '../adminDashboard/adminDashboard.html'
        }, 1500);
    } else {
        // Hide loading spinner
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // For admin email with wrong password
        if (email === 'admin@pau.edu.ng') {
            showMessage('Invalid admin credentials. Please try again.', 'error');
            document.getElementById('login-password-error').textContent = 'Invalid admin credentials';
            document.getElementById('login-password-error').style.display = 'block';
        } else {
            // Try logging in with default password
            showMessage('Please use the default password: User123', 'error');
            document.getElementById('login-password-error').textContent = 'Try using the default password: User123';
            document.getElementById('login-password-error').style.display = 'block';
        }
    }
}

// Helper function to display messages to the user
function showMessage(message, type = 'info') {
    // Reset error messages
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.style.display = 'none';
    });
    
    // Check if a message container already exists
    let messageContainer = document.querySelector('.message-container');
    
    // If not, create a new one
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        document.body.appendChild(messageContainer);
    }
    
    // Create the message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    // Add the message to the container
    messageContainer.appendChild(messageElement);
    
    // Remove the message after a delay
    setTimeout(() => {
        messageElement.remove();
        // If no more messages, remove the container
        if (messageContainer.children.length === 0) {
            messageContainer.remove();
        }
    }, 3000);
}
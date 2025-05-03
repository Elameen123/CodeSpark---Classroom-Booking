document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in, get additional user data
        firebase.database().ref('users/' + user.uid).once('value')
          .then(snapshot => {
            const userData = snapshot.val();
            if (userData) {
              // Store user data in localStorage for easy access
              localStorage.setItem('loggedInUser', JSON.stringify({
                name: userData.name,
                id: userData.id,
                email: user.email,
                role: userData.role || 'student',
                uid: user.uid
              }));
              
              // Redirect based on role
              if (userData.role === 'admin') {
                window.location.href = '../adminDashboard/adminDashboard.html';
              } else {
                window.location.href = '../index.html';
              }
            } else {
              // User exists in Auth but not in database - create profile
              console.log("User exists in Auth but not in database, creating profile");
              createUserDataInDB(user.uid, user.email);
            }
          })
          .catch(error => {
            console.error("Error getting user data:", error);
            showMessage("Error loading user profile. Please try again.", "error");
            firebase.auth().signOut(); // Sign out on error to prevent loops
          });
      }
    });
  
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
        handleForgotPassword();
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
  
  // Handle forgot password
  function handleForgotPassword() {
    const email = document.getElementById('login-email').value;
    
    if (!email) {
      showMessage('Please enter your email address first', 'error');
      return;
    }
    
    if (!email.endsWith('@pau.edu.ng')) {
      showMessage('Please use your university email address (@pau.edu.ng)', 'error');
      return;
    }
    
    // Show loading spinner
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
      loadingElement.style.display = 'block';
    }
    
    // Send password reset email
    firebase.auth().sendPasswordResetEmail(email)
      .then(() => {
        // Hide loading spinner
        if (loadingElement) {
          loadingElement.style.display = 'none';
        }
        showMessage('Password reset email sent. Check your inbox.', 'success');
      })
      .catch(error => {
        // Hide loading spinner
        if (loadingElement) {
          loadingElement.style.display = 'none';
        }
        
        console.error("Password reset error:", error);
        
        // Show appropriate error message
        if (error.code === 'auth/user-not-found') {
          showMessage('No account exists with this email. Try signing up.', 'error');
        } else {
          showMessage('Error sending reset email. Please try again later.', 'error');
        }
      });
  }
  
  // Main login handler with improved flow
  async function handleLogin(e) {
    e.preventDefault();
    
    // Show loading spinner
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) loadingElement.style.display = 'block';
  
    // Get form values
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const defaultPassword = 'User123@'; // Stronger default password
  
    // Validate email format
    if (!email.endsWith('@pau.edu.ng')) {
      showMessage('Please use your university email address (@pau.edu.ng)', 'error');
      if (loadingElement) loadingElement.style.display = 'none';
      return;
    }
  
    try {
      // Try logging in with provided credentials first
      try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        await handleSuccessfulAuth(userCredential.user, email, loadingElement);
        return;
      } catch (error) {
        console.log("Initial login attempt failed:", error.code);
        
        // If invalid credentials, try with default password
        if (error.code === 'auth/invalid-login-credentials' || 
            error.code === 'auth/wrong-password' || 
            error.code === 'auth/user-not-found') {
          
          try {
            // Try default password
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, defaultPassword);
            await handleSuccessfulAuth(userCredential.user, email, loadingElement);
            return;
          } catch (defaultPasswordError) {
            console.log("Default password login attempt failed:", defaultPasswordError.code);
            
            // If user doesn't exist or wrong default password, create new user
            if (defaultPasswordError.code === 'auth/invalid-login-credentials' || 
                defaultPasswordError.code === 'auth/wrong-password' || 
                defaultPasswordError.code === 'auth/user-not-found') {
              await createNewUserAccount(email, defaultPassword, loadingElement);
              return;
            } else {
              throw defaultPasswordError; // Other errors
            }
          }
        } else {
          throw error; // Other errors
        }
      }
    } catch (error) {
      console.error("Login process failed:", error);
      
      let errorMessage = 'Login failed: ';
      if (error.code === 'auth/too-many-requests') {
        errorMessage += 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage += 'Network error. Please check your connection.';
      } else {
        errorMessage += error.message;
      }
      
      showMessage(errorMessage, 'error');
      if (loadingElement) loadingElement.style.display = 'none';
    }
  }
  
  // Handle successful authentication with robust database check
  async function handleSuccessfulAuth(user, email, loadingElement) {
    try {
      // Check if user data exists in database
      const snapshot = await firebase.database().ref('users/' + user.uid).once('value');
      
      if (snapshot.exists()) {
        // User data exists, store and redirect
        const userData = snapshot.val();
        localStorage.setItem('loggedInUser', JSON.stringify({
          name: userData.name,
          id: userData.id,
          email: email,
          role: userData.role || 'student',
          uid: user.uid
        }));
        
        // Show success message
        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect based on role
        if (userData.role === 'admin') {
          window.location.href = '../adminDashboard/adminDashboard.html';
        } else {
          window.location.href = '../index.html';
        }
      } else {
        // User authenticated but no database entry - create one
        console.log("User authenticated but no database entry - creating one");
        await createUserDataInDB(user.uid, email, loadingElement);
      }
    } catch (error) {
      console.error("Error in handleSuccessfulAuth:", error);
      showMessage('Error loading user profile. Please try again.', 'error');
      if (loadingElement) loadingElement.style.display = 'none';
      
      // Sign out to prevent loops
      await firebase.auth().signOut();
      localStorage.removeItem('loggedInUser');
    }
  }
  
  // Create a new user account with robust error handling
  async function createNewUserAccount(email, password, loadingElement) {
    try {
      // Validate email format
      const nameInfo = extractNameFromEmail(email);
      if (!nameInfo) {
        showMessage('Invalid email format. Please use firstname.lastname@pau.edu.ng', 'error');
        if (loadingElement) loadingElement.style.display = 'none';
        return;
      }
      
      // Create user in Firebase Auth
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      
      // Create user data in database
      await createUserDataInDB(userCredential.user.uid, email, loadingElement);
      
    } catch (error) {
      console.error("Error creating new user account:", error);
      
      if (error.code === 'auth/email-already-in-use') {
        showMessage('Account exists but password is incorrect. Use forgot password to reset.', 'error');
      } else if (error.code === 'auth/weak-password') {
        showMessage('Password is too weak. It must be at least 6 characters.', 'error');
      } else {
        showMessage('Account creation failed: ' + error.message, 'error');
      }
      
      if (loadingElement) loadingElement.style.display = 'none';
    }
  }
  
  // Create user data in database with robust error handling and verification
  async function createUserDataInDB(uid, email, loadingElement = null) {
    try {
      // Generate user data
      const nameInfo = extractNameFromEmail(email);
      const studentId = 'STU' + Math.floor(10000 + Math.random() * 90000);
      const role = isAdminEmail(email) ? 'admin' : 'student';
      
      // Create user data object
      const userData = {
        id: role === 'admin' ? 'ADM' + studentId.substring(3) : studentId,
        name: nameInfo ? nameInfo.fullName : 'PAU Student',
        email: email,
        registrationDate: new Date().toISOString(),
        role: role,
        authState: 'complete' // Flag to track auth state
      };
      
      // Save user data to database with retry mechanism
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;
      
      while (attempts < maxAttempts && !success) {
        try {
          attempts++;
          
          // Write to database
          await firebase.database().ref('users/' + uid).set(userData);
          
          // Verify the write was successful
          const verifySnapshot = await firebase.database().ref('users/' + uid).once('value');
          if (verifySnapshot.exists()) {
            success = true;
            console.log("User data created successfully after", attempts, "attempt(s)");
          } else {
            console.warn("Database write appeared to succeed but verification failed, retrying...");
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
          }
        } catch (dbError) {
          console.error(`Database write attempt ${attempts} failed:`, dbError);
          if (attempts >= maxAttempts) throw dbError;
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
        }
      }
      
      if (!success) {
        throw new Error("Failed to create user data after multiple attempts");
      }
      
      // Store user info in localStorage
      localStorage.setItem('loggedInUser', JSON.stringify({
        name: userData.name,
        id: userData.id,
        email: email,
        role: userData.role,
        uid: uid
      }));
      
      // Show success message
      showMessage('Welcome to PAU Bookit! Redirecting...', 'success');
      
      // Set persistence to LOCAL to keep user logged in
      await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      
      // Redirect to appropriate page
      if (userData.role === 'admin') {
        window.location.href = '../adminDashboard/adminDashboard.html';
      } else {
        window.location.href = '../index.html';
      }
      
    } catch (error) {
      console.error("Error in createUserDataInDB:", error);
      
      // Show error message
      showMessage('Error creating user profile. Please try again.', 'error');
      
      // Handle loading element
      if (loadingElement) loadingElement.style.display = 'none';
      
      // Sign out the user to prevent loops
      await firebase.auth().signOut();
      localStorage.removeItem('loggedInUser');
    }
  }
  
  // Function to detect if email is an admin email
  function isAdminEmail(email) {
    const adminEmails = [
      'elvis.ebenuwah@pau.edu.ng'
    ];
    return adminEmails.includes(email.toLowerCase());
  }
  
  // Helper function to create admin user (call this once manually)
  function createAdminUser() {
    const adminEmail = 'elvis.ebenuwah@pau.edu.ng';
    const adminPassword = 'Admin123@'; // Stronger password
    
    firebase.auth().createUserWithEmailAndPassword(adminEmail, adminPassword)
      .then(userCredential => {
        // Create admin data
        const adminData = {
          id: 'ADM10000',
          name: 'Admin User',
          email: adminEmail,
          registrationDate: new Date().toISOString(),
          role: 'admin',
          authState: 'complete'
        };
        
        // Save admin data
        firebase.database().ref('users/' + userCredential.user.uid).set(adminData)
          .then(() => {
            console.log("Admin user created successfully");
          })
          .catch(error => {
            console.error("Error saving admin data:", error);
          });
      })
      .catch(error => {
        console.error("Error creating admin user:", error);
      });
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

// Initialize Firebase data when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in with Firebase
  firebase.auth().onAuthStateChanged(function(user) {
    try {
      if (!user) {
          window.location.href = './loginPage/login.html';
          return;
      }
      
      // Rest of your auth logic...
      
  } catch (error) {
      console.error('Auth state error:', error);
      window.location.href = './loginPage/login.html';
  }
    
    // Get additional user data from database
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
          
          // Update user information in the header
          document.getElementById('user-name').textContent = userData.name;
          document.getElementById('user-id').textContent = userData.id;
          
          // Initialize the application
          initApp();
        } else {
          // No user data found, redirect to login
          window.location.href = './loginPage/login.html';
        }
      })
      .catch(error => {
        console.error("Error getting user data:", error);
        window.location.href = './loginPage/login.html';
      });
  });
});

function initApp() {
  // Initialize shared storage
  initializeSharedStorage();
  
  // Initialize date and time pickers
  initializeDateTimePickers();
  
  // Setup Firebase listeners
  setupFirebaseListeners();
  
  // Load all available classrooms initially
  getClassroomData(displayAllClassrooms);
  
  // Load user reservations
  loadReservations();
  
  // Set up event listeners
  setupEventListeners();
  
  // Check for reminders on load
  checkRecurrentReminders();
  
  // Check every minute (in a real app, this would be more sophisticated)
  setInterval(checkRecurrentReminders, 60000);
}

function setupFirebaseListeners() {
  // Listen for changes in classroom data
  database.ref('classrooms').on('value', (snapshot) => {
    if (snapshot.exists()) {
      const classroomData = snapshot.val();
      localStorage.setItem('classroomData', JSON.stringify(classroomData));
      displayAllClassrooms();
    }
  });
  
  // Listen for changes in reservations
  database.ref('reservations').on('value', (snapshot) => {
    if (snapshot.exists()) {
      const reservationsData = snapshot.val();
      localStorage.setItem('classroomReservations', JSON.stringify(reservationsData));
      loadReservations();
    }
  });
}

function initializeDateTimePickers() {
  const currentDate = new Date().toISOString().split('T')[0];
  
  flatpickr("#date-picker", {
    minDate: "today",
    dateFormat: "Y-m-d",
    defaultDate: currentDate
  });
  
  flatpickr("#start-time", {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    minTime: "08:00",
    maxTime: "20:00",
    time_24hr: true,
    defaultHour: new Date().getHours()
  });
  
  flatpickr("#end-time", {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    minTime: "08:00",
    maxTime: "20:00",
    time_24hr: true,
    defaultHour: Math.min(new Date().getHours() + 1, 20)
  });
}

function setupEventListeners() {
  // Search availability button
  document.getElementById('search-availability').addEventListener('click', searchAvailability);
  
  // Reservation form submission
  document.getElementById('reservation-form').addEventListener('submit', handleReservationSubmit);
  
  // Close modal button
  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('reservation-modal').style.display = 'none';
    resetReservationForm();
  });
  
  // Close avatar modal button
  document.getElementById('close-avatar-modal').addEventListener('click', () => {
    document.getElementById('avatar-modal').style.display = 'none';
  });
  
  // Change avatar button
  document.getElementById('change-avatar').addEventListener('click', () => {
    document.getElementById('avatar-modal').style.display = 'flex';
  });
  
  // Avatar form submission
  document.getElementById('avatar-form').addEventListener('submit', handleAvatarUpload);
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    const reservationModal = document.getElementById('reservation-modal');
    const avatarModal = document.getElementById('avatar-modal');
    if (e.target === reservationModal) {
      reservationModal.style.display = 'none';
      resetReservationForm();
    }
    if (e.target === avatarModal) {
      avatarModal.style.display = 'none';
    }
  });

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', function() {
    performLogout();
  });
  
  // Location filter change
  document.getElementById('location-filter').addEventListener('change', (e) => {
    const selectedLocation = e.target.value;
    if (selectedLocation === 'ALL') {
      displayAllClassrooms();
    } else {
      displayClassrooms(selectedLocation);
    }
  });
  
}

function displayAllClassrooms(isFiltered = false) {
  getClassroomData((classroomData) => {
    const classroomsContainer = document.getElementById('classrooms-container');
    classroomsContainer.innerHTML = '';

    document.querySelector('.location-title h2').textContent = 'Available Classrooms';
    
    const filterStatus = document.getElementById('filter-status');
    const locationStatus = document.querySelector('.location-status');
    
    if (isFiltered) {
      filterStatus.classList.add('visible');
      locationStatus.innerHTML = '<i class="fas fa-filter"></i> Filtered view';
    } else {
      filterStatus.classList.remove('visible');
      locationStatus.innerHTML = '<i class="fas fa-clock"></i> Showing current availability';
    }
    
    // Create section headers and classroom groups for each location
    const locations = Object.keys(classroomData);
    locations.forEach(location => {
      const locationClassrooms = classroomData[location];
      
      // Skip invalid or empty locations
      if (!locationClassrooms || typeof locationClassrooms !== 'object') return;

      // Convert to array if needed (Firebase objects)
      const classroomsArray = Array.isArray(locationClassrooms) 
        ? locationClassrooms 
        : Object.values(locationClassrooms);

      // Create location header
      const locationHeader = document.createElement('div');
      locationHeader.className = 'location-header';
      locationHeader.style.margin = '1.5rem 0 1rem';
      locationHeader.style.paddingBottom = '0.5rem';
      locationHeader.style.borderBottom = '2px solid #eaeaea';
      locationHeader.style.color = '#333';
      locationHeader.style.fontWeight = '600';
      locationHeader.style.fontSize = '1.25rem';
      locationHeader.textContent = `${location} Building`;
      classroomsContainer.appendChild(locationHeader);
      
      // Create container for classrooms
      const locationClassroomsContainer = document.createElement('div');
      locationClassroomsContainer.className = 'classrooms-grid';
      Object.assign(locationClassroomsContainer.style, {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      });
      
      // Add classrooms
      classroomsArray.forEach(classroom => {
        addClassroomCard(classroom, locationClassroomsContainer);
      });
      
      classroomsContainer.appendChild(locationClassroomsContainer);
    });
  });
}

function displayClassrooms(location, isFiltered = false) {
  getClassroomData((classroomData) => {
    const classroomsContainer = document.getElementById('classrooms-container');
    const filterStatus = document.getElementById('filter-status');
    const locationStatus = document.querySelector('.location-status');
    
    // Update location title
    document.querySelector('.location-title h2').textContent = `${location} Classrooms`;
    
    // Update filter status
    if (isFiltered) {
      filterStatus.classList.add('visible');
      locationStatus.innerHTML = '<i class="fas fa-filter"></i> Filtered view';
    } else {
      filterStatus.classList.remove('visible');
      locationStatus.innerHTML = '<i class="fas fa-clock"></i> Showing current availability';
    }
    
    // Clear previous classrooms
    classroomsContainer.innerHTML = '';
    
    const locationClassrooms = classroomData[location];
    
    // Handle missing location data
    if (!locationClassrooms || typeof locationClassrooms !== 'object') {
      classroomsContainer.innerHTML = '<p>No classrooms found for this location</p>';
      return;
    }

    // Convert to array if needed
    const classroomsArray = Array.isArray(locationClassrooms)
      ? locationClassrooms
      : Object.values(locationClassrooms);

    // Create container
    const locationClassroomsContainer = document.createElement('div');
    locationClassroomsContainer.className = 'classrooms-grid';
    Object.assign(locationClassroomsContainer.style, {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem'
    });

    // Add classrooms
    classroomsArray.forEach(classroom => {
      addClassroomCard(classroom, locationClassroomsContainer);
    });
    
    classroomsContainer.appendChild(locationClassroomsContainer);
  });
}

function addClassroomCard(classroom, container) {

  if (!classroom) return;

  const classroomCard = document.createElement('div');
  classroomCard.className = `classroom-card ${classroom.available ? 'available' : 'unavailable'}`;
  classroomCard.dataset.id = classroom.id;
  classroomCard.dataset.name = classroom.name;
  
  // Set width to allow for proper wrapping
  Object.assign(classroomCard.style, {
    width: '170px',
    margin: '0.5rem 0'
  });
  
  // Add classroom name
  const nameElement = document.createElement('div');
  nameElement.className = 'classroom-name';
  nameElement.textContent = classroom.name;
  classroomCard.appendChild(nameElement);
  
  // Add capacity
  const capacityElement = document.createElement('div');
  capacityElement.className = 'classroom-capacity';
  capacityElement.textContent = `${classroom.capacity} seats`;
  classroomCard.appendChild(capacityElement);
  
  if (classroom.available) {
    classroomCard.addEventListener('click', () => openReservationModal(classroom));
  } else {
    classroomCard.addEventListener('click', () => showUnavailableAlert(classroom));
  }
  
  container.appendChild(classroomCard);
}

function showUnavailableAlert(classroom) {
  // Create an alert for unavailable classroom
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert-popup unavailable-alert';
  alertDiv.style.display = 'block';

  alertDiv.style.backgroundColor = '#dc3545';
  alertDiv.style.color = '#ffffff';
  
  const content = document.createElement('div');
  content.className = 'alert-content';
  
  content.innerHTML = `
    <i class="fas fa-times-circle"></i>
    <div class="alert-message">
      <p><strong>${classroom.name}</strong> is currently unavailable for reservation during the selected time.</p>
      <div class="alert-actions">
        <button class="alert-button dismiss-alert">Dismiss</button>
      </div>
    </div>
  `;
  
  alertDiv.appendChild(content);
  document.body.appendChild(alertDiv);
  
  // Add dismiss handler
  const dismissButton = alertDiv.querySelector('.dismiss-alert');
  dismissButton.addEventListener('click', () => {
    alertDiv.style.animation = 'slideOut 0.5s forwards';
    setTimeout(() => {
      alertDiv.remove();
    }, 500);
  });
  
  // Style the dismiss button with the same color theme
  dismissButton.style.backgroundColor = '#ffffff';
  dismissButton.style.color = '#dc3545';
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    alertDiv.style.animation = 'slideOut 0.5s forwards';
    setTimeout(() => {
      alertDiv.remove();
    }, 500);
  }, 5000);
}

function searchAvailability() {
  const datePicker = document.getElementById('date-picker');
  const startTime = document.getElementById('start-time');
  const endTime = document.getElementById('end-time');
  const locationFilter = document.getElementById('location-filter');
  
  if (!datePicker.value || !startTime.value || !endTime.value) {
    alert('Please select date and time to check availability.');
    return;
  }
  
  // Get current day of week (0 = Sunday, 1 = Monday, etc.)
  const selectedDate = new Date(datePicker.value);
  const dayOfWeek = selectedDate.getDay();
  
  // Get current time slots
  const startTimeValue = startTime.value;
  const endTimeValue = endTime.value;
  
  // In a real application, we would query the database for reservations
  // during the selected time slot
  const searchParams = {
    date: datePicker.value,
    startTime: startTimeValue,
    endTime: endTimeValue,
    location: locationFilter.value
  };
  
  // Create a Firebase query to check availability
  const reservationsRef = database.ref('reservations/approved');
  
  reservationsRef.orderByChild('date').equalTo(datePicker.value).once('value')
    .then((snapshot) => {
      // Get all reservations for this date
      const reservations = snapshot.val() || {};
      
      // Get current classroom data
      getClassroomData((classroomData) => {
        // Create a copy of classroom data to modify
        const updatedClassroomData = JSON.parse(JSON.stringify(classroomData));
        
        // Check each classroom's availability
        for (const location in updatedClassroomData) {
          updatedClassroomData[location].forEach(classroom => {
            // Default to available
            classroom.available = true;
            
            // Check if any reservation conflicts with this classroom
            Object.values(reservations).forEach(reservation => {
              if (reservation.classroom === classroom.name) {
                // Parse reservation time
                const [resStart, resEnd] = reservation.time.split(' - ');
                
                // Simple time overlap check
                if ((startTimeValue >= resStart && startTimeValue < resEnd) || 
                    (endTimeValue > resStart && endTimeValue <= resEnd) ||
                    (startTimeValue <= resStart && endTimeValue >= resEnd)) {
                  classroom.available = false;
                }
              }
            });
          });
        }
        
        // Display updated availability
        localStorage.setItem('classroomData', JSON.stringify(updatedClassroomData));
        
        if (locationFilter.value === 'ALL') {
          displayAllClassrooms(true);
        } else {
          displayClassrooms(locationFilter.value, true);
        }
        
        // Show filter status
        document.getElementById('filter-status').classList.add('visible');
        document.querySelector('.location-status').innerHTML = '<i class="fas fa-filter"></i> Filtered view';
      });
    })
    .catch(error => {
      console.error('Error checking availability:', error);
      alert('An error occurred while checking availability. Please try again.');
    });
}

function openReservationModal(classroom) {
  // Get selected date and time
  const datePicker = document.getElementById('date-picker');
  const startTime = document.getElementById('start-time');
  const endTime = document.getElementById('end-time');
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Set reservation details in the modal
  document.getElementById('classroom-name').value = classroom.name;
  document.getElementById('reservation-date').value = datePicker.value || currentDate;
  
  // If time is selected, use it; otherwise use default "now to +1 hour"
  const currentHour = new Date().getHours();
  const nextHour = Math.min(currentHour + 1, 20);
  
  const startTimeValue = startTime.value || `${currentHour}:00`;
  const endTimeValue = endTime.value || `${nextHour}:00`;
  
  document.getElementById('reservation-time').value = `${startTimeValue} - ${endTimeValue}`;

  // Add capacity information to the modal
  document.getElementById('reservation-attendees').max = classroom.capacity;
  document.getElementById('reservation-attendees').placeholder = `Enter number (max ${classroom.capacity})`;
  
  // Store classroom capacity in a data attribute for validation
  document.getElementById('reservation-form').dataset.capacity = classroom.capacity;
  
  // Display modal
  document.getElementById('reservation-modal').style.display = 'flex';
}

function handleReservationSubmit(e) {
  e.preventDefault();
  
  const purpose = document.getElementById('reservation-purpose').value;
  const attendees = document.getElementById('reservation-attendees').value;
  const capacity = parseInt(this.dataset.capacity);
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

  // Validate inputs
  if (!purpose || !attendees) {
    alert('Please fill in all fields.');
    return;
  }

  if (attendees > capacity) {
    alert(`Attendees (${attendees}) exceeds capacity (${capacity}). Please reduce attendees.`);
    return;
  }

  // Get reservation data
  const recurrentOption = document.querySelector('input[name="recurrent"]:checked').value;
  const reservationData = {
    classroom: document.getElementById('classroom-name').value,
    date: document.getElementById('reservation-date').value,
    time: document.getElementById('reservation-time').value,
    purpose: purpose,
    attendees: parseInt(attendees),
    recurrent: recurrentOption !== 'none' ? recurrentOption : null,
    studentName: loggedInUser.name,
    studentId: loggedInUser.id,
    email: loggedInUser.email,
    status: 'pending',
    createdAt: new Date().toISOString(),
    userId: loggedInUser.uid
  };

  getReservations((reservations) => {
    const editId = this.dataset.editId;
    
    if (editId) {
      // Editing existing reservation
      const reservationKey = Object.keys(reservations.pending).find(
        key => reservations.pending[key].id === editId
      );

      if (reservationKey) {
        // Update reservation data
        const updatedReservation = {
          ...reservations.pending[reservationKey],
          ...reservationData,
          lastUpdated: new Date().getTime()
        };

        database.ref(`reservations/pending/${reservationKey}`).update(updatedReservation)
          .then(() => {
            this.dataset.editId = '';
            document.querySelector('.reserve-btn').textContent = 'Submit Reservation Request';
            document.getElementById('reservation-modal').style.display = 'none';
            
            if (document.getElementById('success-alert')) {
              showSuccessAlert('Reservation updated successfully!');
            }
            
            resetReservationForm();
          })
          .catch(error => {
            console.error('Error updating reservation:', error);
            alert('Error updating reservation. Please try again.');
          });
      } else {
        alert('Reservation not found. It may have been deleted.');
      }
    } else {
      // Create new reservation
      const newReservationKey = database.ref().child('reservations/pending').push().key;
      reservationData.id = newReservationKey;

      database.ref('reservations/pending/' + newReservationKey).set(reservationData)
        .then(() => {
          database.ref('reservations/lastUpdate').set(new Date().getTime());
          document.getElementById('reservation-modal').style.display = 'none';
          
          if (document.getElementById('success-alert')) {
            showSuccessAlert('Reservation submitted successfully!');
          }
          
          resetReservationForm();
        })
        .catch(error => {
          console.error('Error creating reservation:', error);
          alert('Error creating reservation. Please try again.');
        });
    }
  });
}

// Fixed showSuccessAlert function with enhanced null safety
function showSuccessAlert(message) {
  const alertContainer = document.getElementById('alert-container');
  if (!alertContainer) return;

  const alertEl = document.createElement('div');
  alertEl.className = 'alert-popup success-alert';
  alertEl.innerHTML = `
    <div class="alert-content">
      <i class="fas fa-check-circle"></i>
      <div class="alert-message">
        <p>${message}</p>
        <div class="alert-actions">
          <button class="alert-button dismiss-alert">Dismiss</button>
        </div>
      </div>
    </div>
  `;

  // Add dismiss handler
  alertEl.querySelector('.dismiss-alert').addEventListener('click', () => {
    alertEl.remove();
  });

  alertContainer.appendChild(alertEl);

  // Auto-remove after 5 seconds
  setTimeout(() => alertEl.remove(), 5000);
}

// Update performLogout function
function performLogout() {
  firebase.auth().signOut().then(() => {
      localStorage.clear();
      window.location.href = './loginPage/login.html'; // Direct redirect without alert
  }).catch((error) => {
      console.error('Error signing out:', error);
  });
}

// Modified loadReservations
function loadReservations() {
  getReservations((reservationsData) => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')) || {};
    
    const process = (type, containerId) => {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = '';
      const reservations = Object.values(reservationsData[type] || {});
      const filtered = reservations.filter(r => r?.userId === loggedInUser?.uid);

      if (filtered.length === 0) {
        container.innerHTML = `<div class="no-reservations">No ${type} reservations</div>`;
        return;
      }

      filtered.forEach(res => {
        const el = createReservationElement(res, type);
        container.appendChild(el);
      });
    };

    process('pending', 'pending-reservations');
    process('approved', 'approved-reservations');
    process('denied', 'denied-reservations');
  });
}

// Updated createReservationElement
function createReservationElement(reservation, status) {
  const el = document.createElement('div');
  el.className = `reservation-item ${status}`;
  el.innerHTML = `
      <div class="reservation-header">
          <span class="classroom-name">${reservation.classroom}</span>
          <span class="reservation-status ${status}">${status}</span>
      </div>
      <div class="reservation-details">
          <span>${reservation.date}</span> | 
          <span>${reservation.time}</span>
          ${reservation.recurrent ? `<span class="recurrent-badge">${reservation.recurrent}</span>` : ''}
      </div>
      <div class="reservation-purpose">${reservation.purpose}</div>
      ${status === 'denied' && reservation.adminComment ? 
          `<div class="denial-reason">${reservation.adminComment}</div>` : ''}
      ${status === 'pending' ? `
      <div class="reservation-actions">
          <button class="edit-btn"><i class="fas fa-edit"></i></button>
          <button class="delete-btn"><i class="fas fa-trash"></i></button>
      </div>` : ''}
  `;

  if (status === 'pending') {
      el.querySelector('.edit-btn').addEventListener('click', () => editReservation(reservation.id));
      el.querySelector('.delete-btn').addEventListener('click', () => deleteReservation(reservation.id));
  }

  return el;
}

function deleteReservation(id) {
  if (confirm('Are you sure you want to delete this reservation?')) {
    database.ref('reservations/pending').orderByChild('id').equalTo(id).once('value')
      .then((snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            childSnapshot.ref.remove()
              .then(() => {
                showSuccessAlert('Reservation deleted successfully');
              });
          });
        }
      });
  }
}

function resetReservationForm() {
  document.getElementById('reservation-purpose').value = '';
  document.getElementById('reservation-attendees').value = '';
  document.querySelector('input[name="recurrent"][value="none"]').checked = true;
  document.getElementById('reservation-form').dataset.editId = '';
  document.querySelector('.reserve-btn').textContent = 'Submit Reservation Request';
}

function editReservation(id) {
  // Get reservations from Firebase
  database.ref('reservations/pending').orderByChild('id').equalTo(id).once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        let reservation = null;
        snapshot.forEach((childSnapshot) => {
          reservation = childSnapshot.val();
        });
        
        if (reservation) {
          // Pre-fill the reservation form
          document.getElementById('classroom-name').value = reservation.classroom;
          document.getElementById('reservation-date').value = reservation.date;
          document.getElementById('reservation-time').value = reservation.time;
          document.getElementById('reservation-purpose').value = reservation.purpose;
          document.getElementById('reservation-attendees').value = reservation.attendees;
          
          // Set recurrent option if present
          if (reservation.recurrent) {
            document.querySelector(`input[name="recurrent"][value="${reservation.recurrent}"]`).checked = true;
          } else {
            document.querySelector('input[name="recurrent"][value="none"]`').checked = true;
          }
          
          // Store the editing reservation ID
          document.getElementById('reservation-form').dataset.editId = id;
          
          // Show the modal
          document.getElementById('reservation-modal').style.display = 'flex';
          
          // Change the button text
          document.querySelector('.reserve-btn').textContent = 'Update Reservation';
        }
      } else {
        console.error('Reservation not found');
        alert('Reservation not found. It may have been deleted or moved.');
      }
    })
    .catch(error => {
      console.error('Error finding reservation:', error);
      alert('Error loading reservation. Please try again.');
    });
}

function handleAvatarUpload(e) {
  e.preventDefault();
  
  const fileInput = document.getElementById('avatar-upload');
  if (fileInput.files.length === 0) {
    alert('Please select an image file.');
    return;
  }
  
  const file = fileInput.files[0];
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  
  // Create a storage reference
  const storageRef = firebase.storage().ref('user-avatars/' + loggedInUser.uid);
  
  // Upload file
  const uploadTask = storageRef.put(file);
  
  // Listen for upload completion
  uploadTask.on('state_changed', 
    (snapshot) => {
      // Track upload progress if needed
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + progress + '% done');
    }, 
    (error) => {
      // Handle errors
      console.error('Error uploading avatar:', error);
      alert('Error uploading profile picture. Please try again.');
    }, 
    () => {
      // Upload completed successfully
      uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
        // Update user profile with new avatar URL
        firebase.auth().currentUser.updateProfile({
          photoURL: downloadURL
        }).then(() => {
          // Update user avatar in the database
          firebase.database().ref('users/' + loggedInUser.uid).update({
            avatar: downloadURL
          }).then(() => {
            // Update avatar in UI
            document.getElementById('user-avatar').src = downloadURL;
            
            // Close the avatar modal
            document.getElementById('avatar-modal').style.display = 'none';
            
            // Show success alert
            showSuccessAlert('Profile picture updated successfully!');
          });
        }).catch(error => {
          console.error('Error updating user profile:', error);
          alert('Error updating profile. Please try again.');
        });
      });
    }
  );
}

function checkRecurrentReminders() {
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];
  
  // Get current user
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  if (!loggedInUser) return;
  
  // Check approved reservations for reminders
  database.ref('reservations/approved').orderByChild('userId').equalTo(loggedInUser.uid).once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const reservation = childSnapshot.val();
          
          if (reservation.recurrent) {
            // For weekly reservations, check if today is the day of the week
            if (reservation.recurrent === 'weekly') {
              const reservationDate = new Date(reservation.date);
              if (today.getDay() === reservationDate.getDay()) {
                // Check if this reminder has been shown today
                const reminderKey = `reminder_${reservation.id}_${formattedToday}`;
                if (!localStorage.getItem(reminderKey)) {
                  showReminderAlert(reservation);
                  localStorage.setItem(reminderKey, 'shown');
                }
              }
            }
            
            // For monthly reservations, check if today is the same day of month
            else if (reservation.recurrent === 'monthly') {
              const reservationDate = new Date(reservation.date);
              if (today.getDate() === reservationDate.getDate()) {
                // Check if this reminder has been shown today
                const reminderKey = `reminder_${reservation.id}_${formattedToday}`;
                if (!localStorage.getItem(reminderKey)) {
                  showReminderAlert(reservation);
                  localStorage.setItem(reminderKey, 'shown');
                }
              }
            }
          }
        });
      }
    })
    .catch(error => {
      console.error('Error checking reminders:', error);
    });
}
function showReminderAlert(reminder) {
  // Create a reminder alert
  const alertContainer = document.getElementById('alert-container');
  
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert-popup reminder-alert';
  alertDiv.innerHTML = `
    <div class="alert-content">
      <i class="fas fa-bell"></i>
      <div class="alert-message">
        <p><strong>Reminder:</strong> Your recurring reservation for ${reminder.classroom} is coming up on ${reminder.date} at ${reminder.time}</p>
        <div class="alert-actions">
          <button class="alert-button dismiss-reminder">Dismiss</button>
        </div>
      </div>
    </div>
  `;

  // Add dismiss handler
  const dismissButton = alertDiv.querySelector('.dismiss-reminder');
  dismissButton.addEventListener('click', () => {
    alertDiv.remove();
  });

  alertContainer.appendChild(alertDiv);

  // Auto dismiss after 30 seconds
  setTimeout(() => {
    if (document.body.contains(alertDiv)) {
      alertDiv.remove();
    }
  }, 30000);
}
// Update performLogout to handle potential missing elements

function getClassroomData(callback) {
  // Try to get from local storage first for better performance
  const cachedData = localStorage.getItem('classroomData');
  if (cachedData) {
    callback(JSON.parse(cachedData));
    return;
  }
  
  // If not in localStorage, fetch from Firebase
  database.ref('classrooms').once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        const classroomData = snapshot.val();
        localStorage.setItem('classroomData', JSON.stringify(classroomData));
        callback(classroomData);
      } else {
        console.error('No classroom data found');
        callback({});
      }
    })
    .catch(error => {
      console.error('Error fetching classroom data:', error);
      callback({});
    });
}

function getReservations(callback) {
  const reservations = {
    pending: {},
    approved: {},
    denied: {}
  };

  Promise.all([
    database.ref('reservations/pending').once('value'),
    database.ref('reservations/approved').once('value'),
    database.ref('reservations/denied').once('value')
  ])
  .then(([pendingSnapshot, approvedSnapshot, deniedSnapshot]) => {
    reservations.pending = pendingSnapshot.val() || {};
    reservations.approved = approvedSnapshot.val() || {};
    reservations.denied = deniedSnapshot.val() || {};
    callback(reservations);
  })
  .catch(error => {
    console.error('Error fetching reservations:', error);
    callback(reservations);
  });
}

function initializeSharedStorage() {
  // Initialize database connection
  window.database = firebase.database();
  
  // Create empty storage objects if they don't exist
  if (!localStorage.getItem('classroomData')) {
    localStorage.setItem('classroomData', JSON.stringify({}));
  }
  
  if (!localStorage.getItem('classroomReservations')) {
    localStorage.setItem('classroomReservations', JSON.stringify({
      pending: {},
      approved: {},
      denied: {}
    }));
  }
}

// Logout confirmation and execution
function showLogoutConfirmation() {
  const confirmModal = document.createElement('div');
  confirmModal.id = 'logout-confirm-modal';
  confirmModal.className = 'modal';
  confirmModal.style.display = 'flex';
  
  confirmModal.innerHTML = `
    <div class="modal-content logout-modal">
      <h3>Confirm Logout</h3>
      <p>Are you sure you want to logout?</p>
      <div class="modal-actions">
        <button id="confirm-logout" class="btn primary-btn">Yes, Logout</button>
        <button id="cancel-logout" class="btn secondary-btn">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(confirmModal);
  
  // Add event listeners
  document.getElementById('confirm-logout').addEventListener('click', performLogout);
  document.getElementById('cancel-logout').addEventListener('click', closeLogoutModal);
  
  // Close if clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
      closeLogoutModal();
    }
  });
}

function closeLogoutModal() {
  const modal = document.getElementById('logout-confirm-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.remove();
  }
}

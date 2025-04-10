

// Mock user data
const userData = {
  name: "Alex Johnson",
  id: "STU78912"
};

// Mock classroom data with capacity information
const classroomData = {
  SST: [
    { id: 1, name: "CLASSROOM 1", available: true, capacity: 50 },
    { id: 2, name: "CLASSROOM 2", available: false, capacity: 50 },
    { id: 3, name: "CLASSROOM 3", available: true, capacity: 50 },
    { id: 4, name: "CLASSROOM 4", available: true, capacity: 50 },
    { id: 5, name: "CLASSROOM 5", available: false, capacity: 50 },
    { id: 6, name: "SYNDICATE ROOM 1", available: true, capacity: 15 },
    { id: 7, name: "THERMOFLUID LAB", available: false, capacity: 50 },
    { id: 8, name: "EDS", available: true, capacity: 100 }
  ],
  TYD: [
    { id: 9, name: "ASABA", available: true, capacity: 50 },
    { id: 10, name: "ZARIA", available: true, capacity: 35 },
    { id: 11, name: "IBADAN", available: false, capacity: 40 },
    { id: 12, name: "MAIDUGURI", available: false, capacity: 25 },
    { id: 13, name: "ADO EKITI", available: true, capacity: 75 },
    { id: 14, name: "PORT HARCOURT", available: true, capacity: 75 },
    { id: 15, name: "EXECUTIVE CAFETERIA", available: false, capacity: 100 },
    { id: 16, name: "ABUJA", available: true, capacity: 150 }
  ]
};

// Mock reservation data
const mockReservations = {
  pending: [
    { id: 1, classroom: "EDS", date: "2025-04-10", time: "14:00 - 16:00", purpose: "Group Study Session" },
    { id: 2, classroom: "ASABA", date: "2025-04-15", time: "10:00 - 12:00", purpose: "Club Meeting" }
  ],
  approved: [
    { id: 3, classroom: "CLASSROOM 1", date: "2025-04-12", time: "13:00 - 15:00", purpose: "Presentation Practice" }
  ],
  denied: [
    { id: 4, classroom: "ABUJA", date: "2025-04-08", time: "18:00 - 20:00", purpose: "Event Setup", reason: "Outside regular hours" }
  ]
};

// Set user information
// Authentication check - Add at the very beginning of the file
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  if (!loggedInUser) {
      // User is not logged in, redirect to login page
      window.location.href = './loginPage/login.html';
      return;
  }
  
  // Update user information in the header
  document.getElementById('user-name').textContent = loggedInUser.name;
  document.getElementById('user-id').textContent = loggedInUser.id;
  
  // Add logout functionality
  const profilePic = document.querySelector('.profile-pic');
  if (profilePic) {
      // Create a dropdown menu for user profile
      const dropdown = document.createElement('div');
      dropdown.className = 'profile-dropdown';
      dropdown.style.display = 'none';
      dropdown.style.position = 'absolute';
      dropdown.style.top = '100%';
      dropdown.style.right = '0';
      dropdown.style.backgroundColor = 'white';
      dropdown.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      dropdown.style.borderRadius = '4px';
      dropdown.style.padding = '0.5rem 0';
      dropdown.style.zIndex = '200';
      dropdown.style.minWidth = '150px';
      
      // Add logout option
      const logoutOption = document.createElement('div');
      logoutOption.textContent = 'Logout';
      logoutOption.style.padding = '0.5rem 1rem';
      logoutOption.style.cursor = 'pointer';
      logoutOption.style.transition = 'background-color 0.2s';
      
      logoutOption.addEventListener('mouseenter', () => {
          logoutOption.style.backgroundColor = '#f5f5f5';
      });
      
      logoutOption.addEventListener('mouseleave', () => {
          logoutOption.style.backgroundColor = 'transparent';
      });
      
      logoutOption.addEventListener('click', () => {
          // Clear logged in user
          localStorage.removeItem('loggedInUser');
          // Redirect to login page
          window.location.href = './loginPage/login.html';
      });
      
      dropdown.appendChild(logoutOption);
      
      // Add dropdown to profile container
      const profileContainer = document.querySelector('.profile-container');
      profileContainer.appendChild(dropdown);
      
      // Toggle dropdown on profile click
      profilePic.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      });
      
      // Close dropdown when clicking elsewhere
      document.addEventListener('click', () => {
          dropdown.style.display = 'none';
      });
  }
  
  // Initialize date and time pickers
  initializeDateTimePickers();
  
  // Load all available classrooms initially
  displayAllClassrooms();
  
  // Load user reservations
  loadReservations();
  
  // Set up event listeners
  setupEventListeners();
  
  // Initialize notification count
  updateNotificationCount();
  
  // Check for reminders on load
  checkRecurrentReminders();
  
  // Check every minute (in a real app, this would be more sophisticated)
  setInterval(checkRecurrentReminders, 60000);
});

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
    }
    if (e.target === avatarModal) {
      avatarModal.style.display = 'none';
    }
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
  const classroomsContainer = document.getElementById('classrooms-container');
  classroomsContainer.innerHTML = '';
  
  // Display location title
  document.querySelector('.location-title h2').textContent = 'Available Classrooms';
  
  // Update filter status
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
    
    // Create container for this location's classrooms (row layout with wrapping)
    const locationClassrooms = document.createElement('div');
    locationClassrooms.className = 'classrooms-grid';
    Object.assign(locationClassrooms.style, {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      marginBottom: '2rem'
    });
    
    // Add classrooms for this location
    classroomData[location].forEach(classroom => {
      addClassroomCard(classroom, locationClassrooms);
    });
    
    classroomsContainer.appendChild(locationClassrooms);
  });
}

function displayClassrooms(location, isFiltered = false) {
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
  
  // Add classrooms for selected location with wrapping
  const locationClassrooms = document.createElement('div');
  locationClassrooms.className = 'classrooms-grid';
  Object.assign(locationClassrooms.style, {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem'
  });

  classroomData[location].forEach(classroom => {
    addClassroomCard(classroom, locationClassrooms);
  });
  
  classroomsContainer.appendChild(locationClassrooms);
}

function addClassroomCard(classroom, container) {
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
  }
  
  container.appendChild(classroomCard);
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
  
  // For demo purposes, we'll simulate changing availability based on random values
  // In a real application, this would come from the server based on the selected date/time
  
  // Update classroom availability randomly for demo
  for (const location in classroomData) {
    classroomData[location].forEach(classroom => {
      classroom.available = Math.random() < 0.7;
    });
  }
  
  // Display filtered results
  if (locationFilter.value === 'ALL') {
    displayAllClassrooms(true);
  } else {
    displayClassrooms(locationFilter.value, true);
  }
  
  // Show filter status
  document.getElementById('filter-status').classList.add('visible');
  document.querySelector('.location-status').innerHTML = '<i class="fas fa-filter"></i> Filtered view';
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
  
  // Display modal
  document.getElementById('reservation-modal').style.display = 'flex';
}

function handleReservationSubmit(e) {
  e.preventDefault();
  
  const purpose = document.getElementById('reservation-purpose').value;
  const attendees = document.getElementById('reservation-attendees').value;
  
  if (!purpose || !attendees) {
    alert('Please fill in all fields.');
    return;
  }
  
  // Get recurrent selection
  const recurrentOption = document.querySelector('input[name="recurrent"]:checked').value;
  
  // Check if we're editing or creating new
  const editId = this.dataset.editId;
  
  if (editId) {
    // Update existing reservation
    const index = mockReservations.pending.findIndex(res => res.id === parseInt(editId));
    if (index !== -1) {
      mockReservations.pending[index] = {
        ...mockReservations.pending[index],
        classroom: document.getElementById('classroom-name').value,
        date: document.getElementById('reservation-date').value,
        time: document.getElementById('reservation-time').value,
        purpose: purpose,
        recurrent: recurrentOption !== 'none' ? recurrentOption : null
      };
      
      // Reset edit mode
      this.dataset.editId = '';
      document.querySelector('.reserve-btn').textContent = 'Submit Reservation Request';
    }
  } else {
    // Add new reservation
    const newReservation = {
      id: Date.now(),
      classroom: document.getElementById('classroom-name').value,
      date: document.getElementById('reservation-date').value,
      time: document.getElementById('reservation-time').value,
      purpose: purpose,
      recurrent: recurrentOption !== 'none' ? recurrentOption : null
    };
    
    mockReservations.pending.push(newReservation);
    
    // Update notification count
    updateNotificationCount();
  }
  
  // Hide modal
  document.getElementById('reservation-modal').style.display = 'none';
  
  // Show success alert
  showSuccessAlert();
  
  // Refresh reservations
  loadReservations();
  
  // Reset form
  document.getElementById('reservation-purpose').value = '';
  document.getElementById('reservation-attendees').value = '';
  document.querySelector('input[name="recurrent"][value="none"]').checked = true;
}

function updateNotificationCount() {
  const notificationCount = document.getElementById('notification-count');
  const count = mockReservations.pending.length + mockReservations.approved.length;
  
  notificationCount.textContent = count;
  
  // Hide badge if no notifications
  if (count === 0) {
    notificationCount.style.display = 'none';
  } else {
    notificationCount.style.display = 'flex';
  }
}

// Call this in DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
  // ...existing code...
  
  // Initialize notification count
  updateNotificationCount();
});

function showSuccessAlert() {
  const successAlert = document.getElementById('success-alert');
  successAlert.style.display = 'block';
  
  // Auto-dismiss after 1 minute (60 seconds)
  setTimeout(() => {
    successAlert.style.animation = 'slideOut 0.5s forwards';
    setTimeout(() => {
      successAlert.style.display = 'none';
      successAlert.style.animation = 'slideIn 0.5s';
    }, 500);
  }, 20000);
}

// Add this to setupEventListeners function
document.getElementById('close-alert').addEventListener('click', () => {
  const successAlert = document.getElementById('success-alert');
  successAlert.style.animation = 'slideOut 0.5s forwards';
  setTimeout(() => {
    successAlert.style.display = 'none';
    successAlert.style.animation = 'slideIn 0.5s';
  }, 500);
});

function loadReservations() {
  // Load pending reservations
  const pendingContainer = document.getElementById('pending-reservations');
  pendingContainer.innerHTML = '';
  
  if (mockReservations.pending.length === 0) {
    pendingContainer.innerHTML = '<p>No pending reservations</p>';
  } else {
    mockReservations.pending.forEach(reservation => {
      const reservationElement = createReservationElement(reservation, 'pending');
      pendingContainer.appendChild(reservationElement);
    });
  }
  
  // Load approved reservations
  const approvedContainer = document.getElementById('approved-reservations');
  approvedContainer.innerHTML = '';
  
  if (mockReservations.approved.length === 0) {
    approvedContainer.innerHTML = '<p>No approved reservations</p>';
  } else {
    mockReservations.approved.forEach(reservation => {
      const reservationElement = createReservationElement(reservation, 'approved');
      approvedContainer.appendChild(reservationElement);
    });
  }
  
  // Load denied reservations
  const deniedContainer = document.getElementById('denied-reservations');
  deniedContainer.innerHTML = '';
  
  if (mockReservations.denied.length === 0) {
    deniedContainer.innerHTML = '<p>No denied reservations</p>';
  } else {
    mockReservations.denied.forEach(reservation => {
      const reservationElement = createReservationElement(reservation, 'denied');
      deniedContainer.appendChild(reservationElement);
    });
  }

  // Load reminders
  const reminderContainer = document.getElementById('reminder-notifications');
  reminderContainer.innerHTML = '';
  
  if (!mockReservations.reminders || mockReservations.reminders.length === 0) {
    reminderContainer.innerHTML = '<p>No upcoming reminders</p>';
  } else {
    mockReservations.reminders.forEach(reminder => {
      const reminderElement = document.createElement('div');
      reminderElement.className = 'reservation-notification reminder';
      
      reminderElement.innerHTML = `
        <div class="reservation-content">
          <div class="reservation-title">${reminder.classroom}</div>
          <div class="reservation-details">${reminder.date} | ${reminder.time}</div>
          <div class="reservation-purpose">${reminder.purpose}</div>
        </div>
      `;
      
      reminderContainer.appendChild(reminderElement);
    });
  }
  
  // Update notification count to include all types
  updateNotificationCount();
}

function createReservationElement(reservation, status) {
  const reservationElement = document.createElement('div');
  reservationElement.className = `reservation-notification ${status}`;
  
  // Create reservation content
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'reservation-content';
  
  const titleElement = document.createElement('div');
  titleElement.className = 'reservation-title';
  titleElement.textContent = reservation.classroom;
  
  const detailsElement = document.createElement('div');
  detailsElement.className = 'reservation-details';
  detailsElement.textContent = `${reservation.date} | ${reservation.time}`;
  
  const purposeElement = document.createElement('div');
  purposeElement.className = 'reservation-purpose';
  purposeElement.textContent = reservation.purpose;
  
  contentWrapper.appendChild(titleElement);
  contentWrapper.appendChild(detailsElement);
  contentWrapper.appendChild(purposeElement);
  
  reservationElement.appendChild(contentWrapper);
  
  // Add action buttons for pending reservations
  if (status === 'pending') {
    const actionButtons = document.createElement('div');
    actionButtons.className = 'reservation-actions';
    
    const editButton = document.createElement('button');
    editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
    editButton.className = 'action-btn edit-btn';
    editButton.title = 'Edit reservation';
    editButton.addEventListener('click', (e) => {
      e.stopPropagation();
      // Call function to edit reservation
      editReservation(reservation.id);
    });
    
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.className = 'action-btn delete-btn';
    deleteButton.title = 'Delete reservation';
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      // Call function to delete reservation
      deleteReservation(reservation.id);
    });
    
    actionButtons.appendChild(editButton);
    actionButtons.appendChild(deleteButton);
    reservationElement.appendChild(actionButtons);
  }
  
  if (status === 'denied' && reservation.reason) {
    const reasonElement = document.createElement('div');
    reasonElement.className = 'reservation-reason';
    reasonElement.textContent = `Reason: ${reservation.reason}`;
    contentWrapper.appendChild(reasonElement);
  }
  
  // Add recurrent label if applicable
  if (reservation.recurrent) {
    const recurrentBadge = document.createElement('span');
    recurrentBadge.className = 'recurrent-badge';
    recurrentBadge.textContent = `${reservation.recurrent.charAt(0).toUpperCase() + reservation.recurrent.slice(1)}`;
    detailsElement.appendChild(document.createTextNode(' | '));
    detailsElement.appendChild(recurrentBadge);
  }
  
  return reservationElement;

}

function editReservation(id) {
  // Find the reservation in pending list
  const reservation = mockReservations.pending.find(res => res.id === id);
  if (!reservation) return;
  
  // Pre-fill the reservation form
  document.getElementById('classroom-name').value = reservation.classroom;
  document.getElementById('reservation-date').value = reservation.date;
  document.getElementById('reservation-time').value = reservation.time;
  document.getElementById('reservation-purpose').value = reservation.purpose;
  
  // Store the editing reservation ID
  document.getElementById('reservation-form').dataset.editId = id;
  
  // Show the modal
  document.getElementById('reservation-modal').style.display = 'flex';
  
  // Change the button text
  document.querySelector('.reserve-btn').textContent = 'Update Reservation';
}

function deleteReservation(id) {
  if (confirm('Are you sure you want to delete this reservation?')) {
      // Remove the reservation from pending list
      mockReservations.pending = mockReservations.pending.filter(res => res.id !== id);
      
      // Refresh the reservations display
      loadReservations();
      
      // Show notification
      alert('Reservation deleted successfully');
  }
}

function handleAvatarUpload(e) {
  e.preventDefault();
  
  const fileInput = document.getElementById('avatar-upload');
  if (fileInput.files.length === 0) {
    alert('Please select an image file.');
    return;
  }
  
  const file = fileInput.files[0];
  
  // In a real application, this would upload the file to a server
  // For this demo, we'll just display the selected image
  const reader = new FileReader();
  reader.onload = function(event) {
    document.getElementById('user-avatar').src = event.target.result;
  };
  reader.readAsDataURL(file);
  
  // Close the avatar modal
  document.getElementById('avatar-modal').style.display = 'none';
  
  // Reset the file input
  fileInput.value = '';
  
  // Show success message
  alert('Profile picture updated successfully!');
}

// Add this to index.js
function checkRecurrentReminders() {
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];
  
  // Check approved recurrent reservations
  mockReservations.approved.forEach(reservation => {
    if (reservation.recurrent) {
      // For demo purposes, we'll create a reminder for any recurrent reservation
      // In a real app, you'd calculate the next occurrence based on the recurrence pattern
      
      const reminderNotification = {
        id: Date.now(),
        type: 'reminder',
        classroom: reservation.classroom,
        date: reservation.date,
        time: reservation.time,
        purpose: reservation.purpose,
        recurrent: reservation.recurrent
      };
      
      // Add to a new reminders section (we'll create this)
      if (!mockReservations.reminders) {
        mockReservations.reminders = [];
      }
      
      // Only add if not already there
      if (!mockReservations.reminders.some(r => r.classroom === reservation.classroom && 
                                           r.date === reservation.date && 
                                           r.time === reservation.time)) {
        mockReservations.reminders.push(reminderNotification);
        
        // Update notification count
        updateNotificationCount();
        
        // Show reminder alert
        showReminderAlert(reminderNotification);
      }
    }
  });
}

function showReminderAlert(reminder) {
  // Create a reminder alert
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert-popup reminder-alert';
  alertDiv.style.display = 'block';
  
  const content = document.createElement('div');
  content.className = 'alert-content';
  
  content.innerHTML = `
    <i class="fas fa-bell"></i>
    <div class="alert-message">
      <p><strong>Reminder:</strong> Your recurring reservation for ${reminder.classroom} is coming up on ${reminder.date} at ${reminder.time}</p>
      <div class="alert-actions">
        <button class="alert-button dismiss-reminder">Dismiss</button>
      </div>
    </div>
  `;
  
  alertDiv.appendChild(content);
  document.body.appendChild(alertDiv);
  
  // Position it above the success alert if that's visible
  const successAlert = document.getElementById('success-alert');
  if (successAlert.style.display === 'block') {
    alertDiv.style.bottom = '120px';
  }
  
  // Add dismiss handler
  alertDiv.querySelector('.dismiss-reminder').addEventListener('click', () => {
    alertDiv.style.animation = 'slideOut 0.5s forwards';
    setTimeout(() => {
      alertDiv.remove();
    }, 500);
  });
  
  // Auto dismiss after 30 seconds
  setTimeout(() => {
    alertDiv.style.animation = 'slideOut 0.5s forwards';
    setTimeout(() => {
      alertDiv.remove();
    }, 500);
  }, 30000);
}

// Call this function on page load and periodically
document.addEventListener('DOMContentLoaded', () => {
  // ...existing code...
  
  // Check for reminders on load
  checkRecurrentReminders();
  
  // Check every minute (in a real app, this would be more sophisticated)
  setInterval(checkRecurrentReminders, 60000);
});
// Mock user data
const userData = {
  name: "Alex Johnson",
  id: "STU78912"
};

// Mock classroom data with capacity information
const classroomData = {
  SST: [
    { id: 1, name: "SST 101", available: true, capacity: 40 },
    { id: 2, name: "SST 102", available: false, capacity: 35 },
    { id: 3, name: "SST 103", available: true, capacity: 25 },
    { id: 4, name: "SST 104", available: true, capacity: 30 },
    { id: 5, name: "SST 105", available: false, capacity: 45 },
    { id: 6, name: "SST 201", available: true, capacity: 60 },
    { id: 7, name: "SST 202", available: false, capacity: 55 },
    { id: 8, name: "SST 203", available: true, capacity: 30 }
  ],
  TYD: [
    { id: 9, name: "TYD 101", available: true, capacity: 50 },
    { id: 10, name: "TYD 102", available: true, capacity: 35 },
    { id: 11, name: "TYD 103", available: false, capacity: 40 },
    { id: 12, name: "TYD 104", available: false, capacity: 25 },
    { id: 13, name: "TYD 201", available: true, capacity: 75 },
    { id: 14, name: "TYD 202", available: true, capacity: 30 },
    { id: 15, name: "TYD 203", available: false, capacity: 65 },
    { id: 16, name: "TYD Hall A", available: true, capacity: 120 }
  ]
};

// Mock reservation data
const mockReservations = {
  pending: [
    { id: 1, classroom: "SST 103", date: "2025-04-10", time: "14:00 - 16:00", purpose: "Group Study Session" },
    { id: 2, classroom: "TYD 201", date: "2025-04-15", time: "10:00 - 12:00", purpose: "Club Meeting" }
  ],
  approved: [
    { id: 3, classroom: "SST 201", date: "2025-04-12", time: "13:00 - 15:00", purpose: "Presentation Practice" }
  ],
  denied: [
    { id: 4, classroom: "TYD Hall A", date: "2025-04-08", time: "18:00 - 20:00", purpose: "Event Setup", reason: "Outside regular hours" }
  ]
};

// Set user information
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('user-name').textContent = userData.name;
  document.getElementById('user-id').textContent = userData.id;
  
  // Initialize date and time pickers
  initializeDateTimePickers();
  
  // Load all available classrooms initially
  displayAllClassrooms();
  
  // Load user reservations
  loadReservations();
  
  // Set up event listeners
  setupEventListeners();
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
    
    // Create container for this location's classrooms
    const locationClassrooms = document.createElement('div');
    locationClassrooms.className = 'classrooms-grid';
    locationClassrooms.style.marginBottom = '2rem';
    
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
  
  // Add classrooms for selected location
  const locationClassrooms = document.createElement('div');
  locationClassrooms.className = 'classrooms-grid';
  
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
  
  // Hide modal
  document.getElementById('reservation-modal').style.display = 'none';
  
  // Show success alert
  showSuccessAlert();
  
  // Add to pending reservations (in a real app, this would be sent to the server)
  const newReservation = {
    id: Date.now(),
    classroom: document.getElementById('classroom-name').value,
    date: document.getElementById('reservation-date').value,
    time: document.getElementById('reservation-time').value,
    purpose: purpose
  };
  
  mockReservations.pending.push(newReservation);
  loadReservations(); // Refresh the reservations display
  
  // Reset form
  document.getElementById('reservation-purpose').value = '';
  document.getElementById('reservation-attendees').value = '';
}

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
}

function createReservationElement(reservation, status) {
  const reservationElement = document.createElement('div');
  reservationElement.className = `reservation-notification ${status}`;
  
  const titleElement = document.createElement('div');
  titleElement.className = 'reservation-title';
  titleElement.textContent = reservation.classroom;
  
  const detailsElement = document.createElement('div');
  detailsElement.className = 'reservation-details';
  detailsElement.textContent = `${reservation.date} | ${reservation.time}`;
  
  const purposeElement = document.createElement('div');
  purposeElement.className = 'reservation-purpose';
  purposeElement.textContent = reservation.purpose;
  
  reservationElement.appendChild(titleElement);
  reservationElement.appendChild(detailsElement);
  reservationElement.appendChild(purposeElement);
  
  if (status === 'denied' && reservation.reason) {
    const reasonElement = document.createElement('div');
    reasonElement.className = 'reservation-reason';
    reasonElement.textContent = `Reason: ${reservation.reason}`;
    reservationElement.appendChild(reasonElement);
  }
  
  return reservationElement;
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
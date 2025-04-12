document.addEventListener('DOMContentLoaded', function() {
    // Make sure shared storage is initialized
    initializeSharedStorage();
    
    // Initialize date pickers
    initializeDatePickers();

    // Initialize EmailJS
    initializeEmailJS();
    
    // Fetch and display reservations based on default filters
    loadReservations();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update stats
    updateStats();
    
    // Set up storage event listener to detect changes from user page
    window.addEventListener('storage', function(e) {
        if (e.key === 'classroomReservations') {
            console.log('Reservation data was updated in another tab');
            // Check for new pending reservations
            const newData = JSON.parse(e.newValue);
            const oldData = e.oldValue ? JSON.parse(e.oldValue) : {pending: []};
            
            if (newData.pending.length > oldData.pending.length) {
                // New reservation has been added
                // Show notification
                showNewReservationAlert();
                
                // Reload reservations
                loadReservations();
                updateStats();
            }
        }
    });
});

// Add this function to initialize shared storage
function initializeSharedStorage() {
    // Check if reservations storage exists
    if (!localStorage.getItem('classroomReservations')) {
        // Create initial structure with sample data
        const initialReservations = {
            pending: reservationsData.filter(r => r.status === 'pending'),
            approved: reservationsData.filter(r => r.status === 'approved'),
            denied: reservationsData.filter(r => r.status === 'denied'),
            lastUpdate: new Date().getTime()
        };
        localStorage.setItem('classroomReservations', JSON.stringify(initialReservations));
    }
}

// Initialize EmailJS
function initializeEmailJS() {
    // Replace with your actual EmailJS user ID
    emailjs.init("O3K5dfZJQv5YP6W9V");
}

// Sample reservation data (in a real app, this would come from a database)

// Initialize flatpickr date pickers
function initializeDatePickers() {
    flatpickr("#date-filter", {
        dateFormat: "Y-m-d",
        allowInput: true,
        altInput: true,
        altFormat: "F j, Y",
        onChange: function() {
            document.getElementById('apply-filters').click();
        }
    });
    
    flatpickr("#booking-date", {
        dateFormat: "Y-m-d",
        minDate: "today",
        allowInput: true,
        altInput: true,
        altFormat: "F j, Y"
    });
    
    flatpickr("#review-date", {
        dateFormat: "Y-m-d",
        allowInput: true,
        altInput: true,
        altFormat: "F j, Y"
    });
}

// Set up event listeners
function setupEventListeners() {
    // Filter button click
    document.getElementById('apply-filters').addEventListener('click', loadReservations);
    
    // Refresh button click
    document.getElementById('refresh-btn').addEventListener('click', loadReservations);
    
    // Export button click
    document.getElementById('export-btn').addEventListener('click', exportReservations);
    
    // Stat cards click
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', function() {
            const status = this.classList.contains('pending') ? 'pending' : 
                          this.classList.contains('approved') ? 'approved' : 
                          this.classList.contains('denied') ? 'denied' : 'all';
            
            if (status === 'all') {
                document.getElementById('status-filter').value = 'all';
            } else {
                document.getElementById('status-filter').value = status;
            }
            
            loadReservations();
        });
    });
    
    // Create reservation button click
    document.getElementById('create-reservation-btn').addEventListener('click', function() {
        document.getElementById('booking-modal').style.display = 'flex';
    });
    
    // Close booking modal
    document.getElementById('close-booking-modal').addEventListener('click', function() {
        document.getElementById('booking-modal').style.display = 'none';
    });
    
    // Cancel booking button
    document.getElementById('cancel-booking-btn').addEventListener('click', function() {
        document.getElementById('booking-modal').style.display = 'none';
    });
    
    // Confirm booking button
    document.getElementById('booking-form').addEventListener('submit', function(e) {
        e.preventDefault();
        createAdminReservation();
    });
    
    // Close review modal
    document.getElementById('close-review-modal').addEventListener('click', function() {
        document.getElementById('review-modal').style.display = 'none';
    });
    
    // Approve button click
    document.getElementById('approve-btn').addEventListener('click', function() {
        updateReservationStatus('approved');
    });
    
    // Deny button click
    document.getElementById('deny-btn').addEventListener('click', function() {
        updateReservationStatus('denied');
    });
}

// Load reservations based on filters
// Replace loadReservations function to use localStorage
function loadReservations() {
    const statusFilter = document.getElementById('status-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    const locationFilter = document.getElementById('location-filter').value;
    
    // Update the current view title
    updateViewTitle(statusFilter);
    
    // Get reservations from localStorage
    const reservationsStorage = JSON.parse(localStorage.getItem('classroomReservations'));
    
    // Create a flat array of all reservations with their status
    let allReservations = [];
    
    // Add pending reservations
    reservationsStorage.pending.forEach(res => {
        allReservations.push({...res, status: 'pending'});
    });
    
    // Add approved reservations
    reservationsStorage.approved.forEach(res => {
        allReservations.push({...res, status: 'approved'});
    });
    
    // Add denied reservations
    reservationsStorage.denied.forEach(res => {
        allReservations.push({...res, status: 'denied'});
    });
    
    // Filter reservations
    let filteredReservations = allReservations.filter(reservation => {
        // Status filter
        if (statusFilter !== 'all' && reservation.status !== statusFilter) {
            return false;
        }
        
        // Date filter
        if (dateFilter && reservation.date !== dateFilter) {
            return false;
        }
        
        // Location filter
        if (locationFilter !== 'ALL') {
            const building = reservation.classroom.split(' ')[0];
            if (building !== locationFilter) {
                return false;
            }
        }
        
        return true;
    });
    
    // Sort by date (most recent first)
    filteredReservations.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Clear existing rows
    const tableBody = document.getElementById('reservations-list');
    tableBody.innerHTML = '';
    
    // Add filtered reservations to table
    if (filteredReservations.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem;">
                    No reservations match your filters
                </td>
            </tr>
        `;
    } else {
        filteredReservations.forEach(reservation => {
            addReservationToTable(reservation);
        });
    }
}

// Function to send email notification when a reservation is approved
function sendApprovalEmail(reservation) {
    // Get admin information
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')) || {
        name: 'Admin User',
        email: 'elvis.ebenuwah@pau.edu.ng'
    };
    
    // Sanitize and validate inputs
    const safeReservation = {
        email: reservation.email || 'student@pau.edu.ng',
        studentName: reservation.studentName || 'Student',
        id: reservation.id || `RES${Date.now()}`,
        classroom: reservation.classroom || 'Requested Classroom',
        date: reservation.date || '',
        time: reservation.time || 'Scheduled Time',
        purpose: (reservation.purpose || 'Academic Activity').substring(0, 100), // Truncate long text
        adminComment: reservation.adminComment ? reservation.adminComment.substring(0, 200) : ''
    };
    
    // Prepare email template parameters
    const templateParams = {
        to_email: safeReservation.email,
        to_name: safeReservation.studentName,
        reservation_id: safeReservation.id,
        classroom: safeReservation.classroom,
        date: formatDate(safeReservation.date),
        time: safeReservation.time,
        purpose: safeReservation.purpose,
        admin_name: loggedInUser.name || 'Administrator',
        admin_comment: safeReservation.adminComment,
        cc_security: 'osagie.osazuwa@pau.edu.ng',
        cc_facility: 'muizah.apampa@pau.edu.ng',
        cc_admin: loggedInUser.email || 'elvis.ebenuwah@pau.edu.ng'
    };
    
    // Log for debugging (remove in production)
    console.log('Email template parameters:', templateParams);
    
    // Send the email using EmailJS
    emailjs.send('service_y4hrfnh', 'template_mkka46n', templateParams)
        .then(function(response) {
            console.log('Email sent successfully:', response);
            showAlert('Approval notification email sent successfully');
        }, function(error) {
            console.error('Email sending failed:', error);
            console.error('Template parameters:', templateParams);
            showAlert('Failed to send email notification');
        });
}
// Update the view title based on selected filter
function updateViewTitle(statusFilter) {
    const titleElement = document.getElementById('current-view-title');
    switch(statusFilter) {
        case 'pending':
            titleElement.textContent = 'Pending Reservations';
            break;
        case 'approved':
            titleElement.textContent = 'Approved Reservations';
            break;
        case 'denied':
            titleElement.textContent = 'Denied Reservations';
            break;
        default:
            titleElement.textContent = 'All Reservations';
    }
}

// Add a reservation to the table
function addReservationToTable(reservation) {
    const tableBody = document.getElementById('reservations-list');
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${reservation.id}</td>
        <td>${reservation.studentName}</td>
        <td>${reservation.classroom}</td>
        <td>${formatDate(reservation.date)}</td>
        <td>${reservation.time}</td>
        <td>${truncateText(reservation.purpose, 30)}</td>
        <td>
            <span class="status-badge ${reservation.status}">
                ${capitalizeFirstLetter(reservation.status)}
            </span>
        </td>
        <td>
            <div class="table-actions">
                <button class="table-action-btn view-btn" data-id="${reservation.id}" title="View details">
                    <i class="fas fa-eye"></i>
                </button>
                ${reservation.status === 'pending' ? `
                    <button class="table-action-btn approve-table-btn" data-id="${reservation.id}" title="Approve">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="table-action-btn deny-table-btn" data-id="${reservation.id}" title="Deny">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        </td>
    `;
    
    tableBody.appendChild(row);
    
    // Add event listeners to the buttons
    const viewBtn = row.querySelector('.view-btn');
    viewBtn.addEventListener('click', function() {
        openReviewModal(this.getAttribute('data-id'));
    });
    
    const approveBtn = row.querySelector('.approve-table-btn');
    if (approveBtn) {
        approveBtn.addEventListener('click', function() {
            openReviewModal(this.getAttribute('data-id'), 'approve');
        });
    }
    
    const denyBtn = row.querySelector('.deny-table-btn');
    if (denyBtn) {
        denyBtn.addEventListener('click', function() {
            openReviewModal(this.getAttribute('data-id'), 'deny');
        });
    }
}

// Open the review modal for a reservation
// Update the openReviewModal function to match the new data structure
function openReviewModal(reservationId, action) {
    // Get reservations from localStorage
    const reservationsStorage = JSON.parse(localStorage.getItem('classroomReservations'));
    
    // Look for the reservation in all statuses
    let reservation = reservationsStorage.pending.find(r => r.id === reservationId);
    
    if (!reservation) {
        reservation = reservationsStorage.approved.find(r => r.id === reservationId);
    }
    
    if (!reservation) {
        reservation = reservationsStorage.denied.find(r => r.id === reservationId);
    }
    
    if (!reservation) return;
    
    // Populate modal fields
    document.getElementById('reservation-id').value = reservation.id;
    document.getElementById('student-name').textContent = reservation.studentName;
    document.getElementById('student-id').textContent = reservation.studentId;
    document.getElementById('review-classroom').value = reservation.classroom;
    document.getElementById('review-date').value = reservation.date;
    document.getElementById('review-time').value = reservation.time;
    document.getElementById('review-purpose').value = reservation.purpose;
    document.getElementById('review-attendees').value = reservation.attendees;
    document.getElementById('admin-comment').value = reservation.adminComment || '';
    
    // Show the modal
    document.getElementById('review-modal').style.display = 'flex';
    
    // If action is provided, focus on the appropriate button
    if (action === 'approve') {
        document.getElementById('approve-btn').focus();
    } else if (action === 'deny') {
        document.getElementById('deny-btn').focus();
    }
}

// Update reservation status (approve/deny)
// Update the updateReservationStatus function to use localStorage
// Update the updateReservationStatus function to include email sending
function updateReservationStatus(status) {
    const reservationId = document.getElementById('reservation-id').value;
    const adminComment = document.getElementById('admin-comment').value;
    
    // Get the reservations from localStorage
    const reservationsStorage = JSON.parse(localStorage.getItem('classroomReservations'));
    
    // Find the reservation in pending
    const reservationIndex = reservationsStorage.pending.findIndex(r => r.id === reservationId);
    
    if (reservationIndex !== -1) {
        // Get the reservation object
        const reservation = reservationsStorage.pending[reservationIndex];
        
        // Update status and admin comment
        reservation.status = status;
        reservation.adminComment = adminComment;
        reservation.processedAt = new Date().toISOString();
        
        // Remove from pending
        reservationsStorage.pending.splice(reservationIndex, 1);
        
        // Add to appropriate array
        if (status === 'approved') {
            reservationsStorage.approved.push(reservation);
            
            // Send approval email notification
            sendApprovalEmail(reservation);
        } else {
            reservationsStorage.denied.push(reservation);
        }
        
        // Update timestamp
        reservationsStorage.lastUpdate = new Date().getTime();
        
        // Save back to localStorage
        localStorage.setItem('classroomReservations', JSON.stringify(reservationsStorage));
        
        // Close the modal
        document.getElementById('review-modal').style.display = 'none';
        
        // Show success alert
        showAlert(`Reservation ${reservationId} has been ${status}.`);
        
        // Reload reservations and update stats
        loadReservations();
        updateStats();
    }
}

// Create admin reservation
// Update the createAdminReservation function to use localStorage
function createAdminReservation() {
    const classroom = document.getElementById('booking-classroom').value;
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;
    const purpose = document.getElementById('booking-purpose').value;
    const attendees = document.getElementById('booking-attendees').value;
    
    // Generate a new reservation ID
    const newId = 'RES' + Date.now();
    
    // Get current admin user
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    
    // Create new reservation object
    const newReservation = {
        id: newId,
        studentName: loggedInUser.name || 'Admin User',
        studentId: loggedInUser.id || 'ADMIN01',
        email: loggedInUser.email || 'admin@pau.edu.ng',
        classroom,
        date,
        time,
        purpose,
        status: 'admin',
        attendees: parseInt(attendees),
        createdAt: new Date().toISOString()
    };
    
    // Get reservations from localStorage
    const reservationsStorage = JSON.parse(localStorage.getItem('classroomReservations'));
    
    // Add to approved reservations
    reservationsStorage.approved.push({...newReservation, status: 'approved'});
    
    // Update timestamp
    reservationsStorage.lastUpdate = new Date().getTime();
    
    // Save back to localStorage
    localStorage.setItem('classroomReservations', JSON.stringify(reservationsStorage));
    
    // Close the modal and reset form
    document.getElementById('booking-modal').style.display = 'none';
    document.getElementById('booking-form').reset();
    
    // Show success alert
    showAlert(`Admin reservation ${newId} has been created successfully.`);
    
    // Reload reservations and update stats
    loadReservations();
    updateStats();
}
// Export reservations to CSV
// Update exportReservations function to use localStorage
function exportReservations() {
    const statusFilter = document.getElementById('status-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    const locationFilter = document.getElementById('location-filter').value;
    
    // Get reservations from localStorage
    const reservationsStorage = JSON.parse(localStorage.getItem('classroomReservations'));
    
    // Create a flat array of all reservations
    let allReservations = [];
    
    // Add pending reservations
    reservationsStorage.pending.forEach(res => {
        allReservations.push({...res, status: 'pending'});
    });
    
    // Add approved reservations
    reservationsStorage.approved.forEach(res => {
        allReservations.push({...res, status: 'approved'});
    });
    
    // Add denied reservations
    reservationsStorage.denied.forEach(res => {
        allReservations.push({...res, status: 'denied'});
    });
    
    // Filter reservations the same way as displayed
    let filteredReservations = allReservations.filter(reservation => {
        // Status filter
        if (statusFilter !== 'all' && reservation.status !== statusFilter) {
            return false;
        }
        
        // Date filter
        if (dateFilter && reservation.date !== dateFilter) {
            return false;
        }
        
        // Location filter
        if (locationFilter !== 'ALL') {
            const building = reservation.classroom.split(' ')[0];
            if (building !== locationFilter) {
                return false;
            }
        }
        
        return true;
    });
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Requestor,Student ID,Classroom,Date,Time,Purpose,Status,Attendees,Admin Comment\n";
    
    filteredReservations.forEach(reservation => {
        csvContent += `${reservation.id},${reservation.studentName},${reservation.studentId},${reservation.classroom},${reservation.date},${reservation.time},"${reservation.purpose}",${reservation.status},${reservation.attendees},"${reservation.adminComment || ''}"\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reservations_export_${formatDateForFilename(new Date())}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
}


// Update statistics counters
// Update the updateStats function to use localStorage
function updateStats() {
    const reservationsStorage = JSON.parse(localStorage.getItem('classroomReservations'));
    
    const pendingCount = reservationsStorage.pending.length;
    const approvedCount = reservationsStorage.approved.length;
    const deniedCount = reservationsStorage.denied.length;
    const totalCount = pendingCount + approvedCount + deniedCount;
    
    document.getElementById('pending-count').textContent = pendingCount;
    document.getElementById('approved-count').textContent = approvedCount;
    document.getElementById('denied-count').textContent = deniedCount;
    document.getElementById('total-count').textContent = totalCount;
    
    // Update notification badge
    document.getElementById('notification-count').textContent = pendingCount;
}

// Add a function to show notification for new reservation
function showNewReservationAlert() {
    const alertElement = document.getElementById('success-alert');
    const messageElement = document.getElementById('alert-message');
    
    messageElement.textContent = 'New reservation has been submitted for approval!';
    alertElement.classList.add('show');
    
    // Play notification sound (optional)
    const audio = new Audio('../sounds/notification.mp3');
    audio.play().catch(e => console.log('Audio playback error:', e));
    
    // Hide after 3 seconds
    setTimeout(() => {
        alertElement.classList.remove('show');
    }, 3000);
}

// Show alert popup
function showAlert(message) {
    const alertElement = document.getElementById('success-alert');
    const messageElement = document.getElementById('alert-message');
    
    messageElement.textContent = message;
    alertElement.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        alertElement.classList.remove('show');
    }, 3000);
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Helper function to format date
function formatDate(dateString) {
    // Check if dateString exists and is valid
    if (!dateString) {
        return 'Unspecified date';
    }
    
    try {
        const date = new Date(dateString);
        
        // Check for invalid date
        if (isNaN(date.getTime())) {
            return 'Pending date confirmation';
        }
        
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    } catch (error) {
        console.error(`Error formatting date: "${dateString}"`, error);
        return 'Pending date confirmation';
    }
}

// Helper function to format date for filename
function formatDateForFilename(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
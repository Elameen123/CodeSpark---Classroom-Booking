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

// Confirmation modal variables
let confirmAction = null;
let confirmData = null;

// Initialize flatpickr date pickers
function initializeDatePickers() {
    flatpickr("#date-filter", {
        dateFormat: "Y-m-d",
        allowInput: true,
        altInput: true,
        altFormat: "F j, Y",
        onChange: function() {
            // Don't auto-apply filter when date is selected
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
    // Filter buttons click
    document.getElementById('apply-filters').addEventListener('click', loadReservations);
    document.getElementById('clear-filters').addEventListener('click', clearFilters);
    
    // Refresh button click
    document.getElementById('refresh-btn').addEventListener('click', refreshData);
    
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
        showConfirmModal('approve');
    });
    
    // Deny button click
    document.getElementById('deny-btn').addEventListener('click', function() {
        showConfirmModal('deny');
    });

    document.getElementById('logout-btn').addEventListener('click', function() {
        performLogout();
    });
    
    // Confirmation modal event listeners
    document.getElementById('close-confirm-modal').addEventListener('click', closeConfirmModal);
    document.getElementById('confirm-cancel').addEventListener('click', closeConfirmModal);
    document.getElementById('confirm-proceed').addEventListener('click', proceedWithConfirmedAction);
}

// Refresh data
function refreshData() {
    // In a real app, this would fetch fresh data from the server
    // For now, we'll just reload the current view
    showAlert('Data refreshed successfully');
    loadReservations();
    updateStats();
}

// Clear all filters and reset to defaults
function clearFilters() {
    document.getElementById('status-filter').value = 'pending';
    document.getElementById('date-filter').value = '';
    document.getElementById('location-filter').value = 'ALL';
    
    // Clear the flatpickr date input
    const dateInput = document.getElementById('date-filter')._flatpickr;
    if (dateInput) {
        dateInput.clear();
    }
    
    // Reload with cleared filters
    loadReservations();
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
// Show confirmation modal
function showConfirmModal(action) {
    confirmAction = action;
    confirmData = {
        reservationId: document.getElementById('reservation-id').value,
        adminComment: document.getElementById('admin-comment').value
    };
    
    const confirmModal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmButton = document.getElementById('confirm-proceed');
    
    if (action === 'approve') {
        confirmMessage.textContent = `Are you sure you want to approve reservation ${confirmData.reservationId}?`;
        confirmButton.textContent = 'Approve';
        confirmButton.className = 'confirm-proceed-btn approve';
    } else if (action === 'deny') {
        confirmMessage.textContent = `Are you sure you want to deny reservation ${confirmData.reservationId}?`;
        confirmButton.textContent = 'Deny';
        confirmButton.className = 'confirm-proceed-btn deny';
    }
    
    confirmModal.style.display = 'flex';
}

// Close confirmation modal
function closeConfirmModal() {
    document.getElementById('confirm-modal').style.display = 'none';
}

// Proceed with confirmed action
function proceedWithConfirmedAction() {
    closeConfirmModal();
    
    if (confirmAction === 'approve' || confirmAction === 'deny') {

        console.log(confirmAction);
        updateReservationStatus(confirmAction);
    }
    
    // Reset confirmation variables
    confirmAction = null;
    confirmData = null;
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

// Add this function to record new activity
function recordActivity(reservation, action) {
    // Get existing activities from localStorage or create empty array
    const activities = JSON.parse(localStorage.getItem('recentActivities')) || [];
    
    // Create new activity record
    const newActivity = {
        id: reservation.id,
        action: action, // 'created', 'approved', 'denied', etc.
        reservationId: reservation.id,
        studentName: reservation.studentName,
        classroom: reservation.classroom,
        timestamp: new Date().toISOString()
    };
    
    // Add to beginning of array
    activities.unshift(newActivity);
    
    // Keep only the most recent 20 activities
    const trimmedActivities = activities.slice(0, 20);
    
    // Save back to localStorage
    localStorage.setItem('recentActivities', JSON.stringify(trimmedActivities));
}

// Update the updateReservationStatus function to record activity
function updateReservationStatus(status) {
    const reservationId = document.getElementById('reservation-id').value;
    const adminComment = document.getElementById('admin-comment').value;
    
    // Convert "approve" to "approved" for consistency
    const finalStatus = status === 'approve' ? 'approved' : status;
    
    // Get the reservations from localStorage
    const reservationsStorage = JSON.parse(localStorage.getItem('classroomReservations'));
    
    // Find the reservation in pending
    const reservationIndex = reservationsStorage.pending.findIndex(r => r.id === reservationId);
    
    if (reservationIndex !== -1) {
        // Get the reservation object
        const reservation = reservationsStorage.pending[reservationIndex];
        
        // Update status and admin comment
        reservation.status = finalStatus;
        reservation.adminComment = adminComment;
        reservation.processedAt = new Date().toISOString();
        
        // Remove from pending
        reservationsStorage.pending.splice(reservationIndex, 1);
        
        // Add to appropriate array
        if (finalStatus === 'approved') {
            reservationsStorage.approved.push(reservation);
            
            // Record this activity
            recordActivity(reservation, 'approved');
            
            // Send approval email notification
            sendApprovalEmail(reservation);
        } else {
            reservationsStorage.denied.push(reservation);
            
            // Record this activity
            recordActivity(reservation, 'denied');
        }
        
        // Update timestamp
        reservationsStorage.lastUpdate = new Date().getTime();
        
        // Save back to localStorage
        localStorage.setItem('classroomReservations', JSON.stringify(reservationsStorage));
        
        // Close the modal
        document.getElementById('review-modal').style.display = 'none';
        
        // Show success alert - use original status for verb form in message
        showAlert(`Reservation ${reservationId} has been ${status}${status === 'approve' ? 'd' : 'd'}.`);
        
        // Reload reservations and update stats
        loadReservations();
        updateStats();
        updateRecentActivity();
    }
}
// Create admin reservation
// Update the createAdminReservation function to use localStorage

function createAdminReservation() {
    const classroom = document.getElementById('booking-classroom').value;
    const date = document.getElementById('booking-date').value;
    const startTime = document.getElementById('booking-start-time').value;
    const endTime = document.getElementById('booking-end-time').value;
    const time = startTime + " - " + endTime;
    const purpose = document.getElementById('booking-purpose').value;
    const attendees = document.getElementById('booking-attendees').value;
    

    // Generate a new reservation ID
    const newId = 'RES' + Date.now();
    
    // Get current admin user
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    
    // Create the reservation object
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

     // Record this activity after creating reservation
     recordActivity(newReservation, 'created');
    
    // Close the modal
    document.getElementById('booking-modal').style.display = 'none';
    
    // Show success alert
    showAlert(`Admin reservation ${newId} has been created.`);
    
    // Clear the form
    document.getElementById('booking-form').reset();
    
    // Reload reservations and update stats
    loadReservations();
    updateStats();
    updateRecentActivity();
}
// Export reservations to CSV
// Update exportReservations function to use localStorage
function exportReservations() {
    // Get the current filtered reservations
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
    
    // Add headers
    csvContent += "ID,Student Name,Student ID,Classroom,Date,Time,Purpose,Status,Attendees,Created At\n";
    
    // Add rows
    filteredReservations.forEach(reservation => {
        const row = [
            reservation.id,
            reservation.studentName,
            reservation.studentId,
            reservation.classroom,
            reservation.date,
            reservation.time,
            `"${reservation.purpose.replace(/"/g, '""')}"`,
            reservation.status,
            reservation.attendees,
            reservation.createdAt
        ].join(',');
        
        csvContent += row + "\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reservations_export_${formatDateForFileName(new Date())}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Remove link
    document.body.removeChild(link);
    
    // Show success alert
    showAlert('Reservations exported to CSV successfully');
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
    // document.getElementById('notification-count').textContent = pendingCount;
}

// Add initial activities during initialization if none exist
function initializeActivities() {
    // Only initialize if no activities exist yet
    if (!localStorage.getItem('recentActivities')) {
        const reservationsStorage = JSON.parse(localStorage.getItem('classroomReservations'));
        const activities = [];
        
        // Create an initial activity for each existing reservation
        [...reservationsStorage.approved, ...reservationsStorage.denied].forEach(res => {
            activities.push({
                id: res.id,
                action: res.status,
                reservationId: res.id,
                studentName: res.studentName,
                classroom: res.classroom,
                timestamp: res.processedAt || res.createdAt || new Date().toISOString()
            });
        });
        
        // Sort by timestamp (newest first)
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Keep only the 20 most recent
        const trimmedActivities = activities.slice(0, 20);
        
        // Save to localStorage
        localStorage.setItem('recentActivities', JSON.stringify(trimmedActivities));
    }
}

// Call this during the page initialization
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    initializeActivities();
    // ... rest of initialization ...
});

function recordActivity(reservation, action) {
    // Get existing activities from localStorage or create empty array
    const activities = JSON.parse(localStorage.getItem('recentActivities')) || [];
    
    // Create new activity record
    const newActivity = {
        id: reservation.id,
        action: action, // 'created', 'approved', 'denied', etc.
        reservationId: reservation.id,
        studentName: reservation.studentName,
        classroom: reservation.classroom,
        timestamp: new Date().toISOString()
    };
    
    // Add to beginning of array
    activities.unshift(newActivity);
    
    // Keep only the most recent 20 activities
    const trimmedActivities = activities.slice(0, 20);
    
    // Save back to localStorage
    localStorage.setItem('recentActivities', JSON.stringify(trimmedActivities));
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
    const alertMessage = document.getElementById('alert-message');
    
    alertMessage.textContent = message;
    alertElement.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertElement.classList.remove('show');
    }, 5000);
}


// Truncate text and add ellipsis if needed
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Capitalize first letter
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

// Show logout confirmation modal
function showLogoutConfirmation() {
    const modal = document.getElementById('logout-confirm-modal');
    modal.style.display = 'flex';
}

// Close logout modal
function closeLogoutModal() {
    const modal = document.getElementById('logout-confirm-modal');
    modal.style.display = 'none';
}

// Perform logout - redirect to login page
function performLogout() {
    // You can add any logout logic here, such as clearing session storage
    localStorage.removeItem('user');
    sessionStorage.removeItem('userToken');
    
    // Show a brief message
    showAlert('Logging out...');
    
    // Redirect to login page after a short delay
    setTimeout(() => {
        window.location.href = '/loginPage/login.html'; 
    }, 1000);
}

// Show alert message (reusing the existing alert functionality)
function showAlert(message) {
    const alertElement = document.getElementById('success-alert');
    const alertMessage = document.getElementById('alert-message');
    
    if (alertElement && alertMessage) {
        alertMessage.textContent = message;
        alertElement.classList.add('show');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            alertElement.classList.remove('show');
        }, 3000);
    }
}

// Add this function to update the recent activity section
// Update updateRecentActivity to use the stored activities
function updateRecentActivity() {
    // Get the activity list container
    const activityList = document.querySelector('.activity-list');
    
    // Clear existing content
    activityList.innerHTML = '';
    
    // Get activities from localStorage
    const activities = JSON.parse(localStorage.getItem('recentActivities')) || [];
    
    // Take the 5 most recent activities
    const recentActivities = activities.slice(0, 5);
    
    if (recentActivities.length === 0) {
        // No activities yet
        activityList.innerHTML = '<div class="no-activities">No recent activity to display</div>';
        return;
    }
    
    // Add each activity to the list
    recentActivities.forEach(activity => {
        let iconClass, actionText;
        
        // Determine icon and text based on action
        if (activity.action === 'approved') {
            iconClass = 'approved';
            actionText = `Reservation #${activity.id.substring(3)} approved`;
        } else if (activity.action === 'denied') {
            iconClass = 'denied';
            actionText = `Reservation #${activity.id.substring(3)} denied`;
        } else if (activity.action === 'created') {
            iconClass = 'created';
            actionText = `Admin reservation #${activity.id.substring(3)} created`;
        } else if (activity.action === 'pending') {
            iconClass = '';
            actionText = `New reservation #${activity.id.substring(3)} pending`;
        }
        
        // Calculate time ago
        const timeAgo = getTimeAgo(new Date(activity.timestamp));
        
        // Create activity item
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon ${iconClass}">
                <i class="fas ${getIconByAction(activity.action)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">${actionText}</div>
                <div class="activity-time">${timeAgo}</div>
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}

// Helper function for activity icons
function getIconByAction(action) {
    switch(action) {
        case 'approved': return 'fa-check';
        case 'denied': return 'fa-times';
        case 'created': return 'fa-calendar-check';
        case 'pending': return 'fa-clock';
        default: return 'fa-user';
    }
}

// Helper function to get appropriate icon by status
function getIconByStatus(status) {
    switch(status) {
        case 'approved': return 'fa-check';
        case 'denied': return 'fa-times';
        case 'pending': return 'fa-clock';
        case 'admin': return 'fa-calendar-check';
        default: return 'fa-user';
    }
}

// Helper function to format relative time
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffMin < 1) {
        return 'Just now';
    } else if (diffMin < 60) {
        return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    } else {
        return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    }
}

// Add this to your initial document.addEventListener('DOMContentLoaded', function() {...}
// Right after calling updateStats();
function initializePage() {
    // Initialize date pickers
    initializeDatePickers();
    
    // Fetch and display reservations based on default filters
    loadReservations();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update stats
    updateStats();
    
    // Update recent activity
    updateRecentActivity();
}

// Call updateRecentActivity whenever refreshData is called
function refreshData() {
    // In a real app, this would fetch fresh data from the server
    // For now, we'll just reload the current view
    showAlert('Data refreshed successfully');
    loadReservations();
    updateStats();
    updateRecentActivity();
}
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date pickers
    initializeDatePickers();
    
    // Fetch and display reservations based on default filters
    loadReservations();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update stats
    updateStats();
});

// Sample reservation data (in a real app, this would come from a database)
const reservationsData = [
    {
        id: 'RES3456',
        studentName: 'Alex Johnson', 
        studentId: 'STU78912',
        classroom: 'SST 104',
        date: '2025-04-12',
        time: '10:00 - 12:00',
        purpose: 'Chemistry study group session',
        status: 'pending',
        attendees: 12,
        createdAt: '2025-04-09T15:30:00'
    },
    {
        id: 'RES3457',
        studentName: 'Maria Garcia', 
        studentId: 'STU78913',
        classroom: 'SST 110',
        date: '2025-04-13',
        time: '14:00 - 16:00',
        purpose: 'Physics lab preparation',
        status: 'pending',
        attendees: 8,
        createdAt: '2025-04-09T16:15:00'
    },
    {
        id: 'RES3452',
        studentName: 'James Wilson', 
        studentId: 'STU78905',
        classroom: 'TYD 201',
        date: '2025-04-11',
        time: '08:00 - 10:00',
        purpose: 'Computer Science project meeting',
        status: 'denied',
        attendees: 5,
        adminComment: 'Room already booked for maintenance',
        createdAt: '2025-04-08T09:45:00'
    },
    {
        id: 'RES3450',
        studentName: 'Sarah Lee', 
        studentId: 'STU78900',
        classroom: 'SST 220',
        date: '2025-04-10',
        time: '16:00 - 18:00',
        purpose: 'Biology study group',
        status: 'approved',
        attendees: 15,
        adminComment: 'Approved. Please ensure the room is clean after use.',
        createdAt: '2025-04-08T08:30:00'
    },
    {
        id: 'RES3445',
        studentName: 'David Chen', 
        studentId: 'STU78890',
        classroom: 'TYD 305',
        date: '2025-04-14',
        time: '12:00 - 14:00',
        purpose: 'Mathematics tutoring session',
        status: 'approved',
        attendees: 6,
        adminComment: 'Approved. Room has whiteboard as requested.',
        createdAt: '2025-04-07T14:20:00'
    },
    {
        id: 'RES3458',
        studentName: 'Admin User', 
        studentId: 'ADMIN01',
        classroom: 'SST 104',
        date: '2025-04-15',
        time: '08:00 - 10:00',
        purpose: 'Department meeting',
        status: 'admin',
        attendees: 10,
        createdAt: '2025-04-09T17:00:00'
    }
];

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
function loadReservations() {
    const statusFilter = document.getElementById('status-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    const locationFilter = document.getElementById('location-filter').value;
    
    // Update the current view title
    updateViewTitle(statusFilter);
    
    // Filter reservations
    let filteredReservations = reservationsData.filter(reservation => {
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
function openReviewModal(reservationId, action) {
    const reservation = reservationsData.find(r => r.id === reservationId);
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
function updateReservationStatus(status) {
    const reservationId = document.getElementById('reservation-id').value;
    const adminComment = document.getElementById('admin-comment').value;
    
    // Find the reservation and update its status
    const reservationIndex = reservationsData.findIndex(r => r.id === reservationId);
    if (reservationIndex !== -1) {
        reservationsData[reservationIndex].status = status;
        reservationsData[reservationIndex].adminComment = adminComment;
        
        // Close the modal
        document.getElementById('review-modal').style.display = 'none';
        
        // Show success alert
        showAlert(`Reservation ${reservationId} has been ${status}d.`);
        
        // Reload reservations and update stats
        loadReservations();
        updateStats();
    }
}

// Create a new admin reservation
function createAdminReservation() {
    const classroom = document.getElementById('booking-classroom').value;
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;
    const purpose = document.getElementById('booking-purpose').value;
    const attendees = document.getElementById('booking-attendees').value;
    
    // Generate a new ID
    const newId = 'RES' + (3458 + Math.floor(Math.random() * 10));
    
    // Create the reservation object
    const newReservation = {
        id: newId,
        studentName: 'Admin User',
        studentId: 'ADMIN01',
        classroom: classroom,
        date: date,
        time: time,
        purpose: purpose,
        status: 'admin',
        attendees: parseInt(attendees),
        createdAt: new Date().toISOString()
    };
    
    // Add to the reservations data
    reservationsData.push(newReservation);
    
    // Close the modal
    document.getElementById('booking-modal').style.display = 'none';
    
    // Show success alert
    showAlert(`Admin reservation ${newId} has been created.`);
    
    // Clear the form
    document.getElementById('booking-form').reset();
    
    // Reload reservations and update stats
    loadReservations();
    updateStats();
}

// Export reservations to CSV
function exportReservations() {
    // Get the current filtered reservations
    const statusFilter = document.getElementById('status-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    const locationFilter = document.getElementById('location-filter').value;
    
    // Filter reservations
    let filteredReservations = reservationsData.filter(reservation => {
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

// Format date for file names
function formatDateForFileName(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Update stats
function updateStats() {
    const pendingCount = reservationsData.filter(r => r.status === 'pending').length;
    const approvedCount = reservationsData.filter(r => r.status === 'approved').length;
    const deniedCount = reservationsData.filter(r => r.status === 'denied').length;
    const totalCount = reservationsData.length;
    
    document.getElementById('pending-count').textContent = pendingCount;
    document.getElementById('approved-count').textContent = approvedCount;
    document.getElementById('denied-count').textContent = deniedCount;
    document.getElementById('total-count').textContent = totalCount;
    document.getElementById('notification-count').textContent = pendingCount;
}

// Show alert
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

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
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
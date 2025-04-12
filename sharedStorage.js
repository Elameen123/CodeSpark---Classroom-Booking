// Shared storage functions for classroom reservation system

// Initialize shared storage structure
function initializeSharedStorage() {
  // Check if reservations storage exists
  if (!localStorage.getItem('classroomReservations')) {
    // Create initial structure
    const initialReservations = {
      pending: [],
      approved: [],
      denied: [],
      lastUpdate: new Date().getTime()
    };
    localStorage.setItem('classroomReservations', JSON.stringify(initialReservations));
  }
  
  // Check if classrooms data exists
  if (!localStorage.getItem('classroomData')) {
    // Use the mock classroom data to initialize
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
    localStorage.setItem('classroomData', JSON.stringify(classroomData));
  }
}

// Helper function to get reservations from localStorage
function getReservations() {
  return JSON.parse(localStorage.getItem('classroomReservations'));
}

// Helper function to format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}
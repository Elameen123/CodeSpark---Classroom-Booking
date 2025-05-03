// Shared storage functions for classroom reservation system

// Initialize shared storage structure
function initializeSharedStorage() {
  // Check if classrooms data exists in Firebase
  const classroomsRef = database.ref('classrooms');
  classroomsRef.once('value').then((snapshot) => {
    if (!snapshot.exists()) {
      // Create initial classroom data structure
      const initialClassrooms = {
        "SST": [
          { id: 1, name: "CLASSROOM 1", available: true, capacity: 50 },
          { id: 2, name: "CLASSROOM 2", available: false, capacity: 50 },
          { id: 3, name: "CLASSROOM 3", available: true, capacity: 50 },
          { id: 4, name: "CLASSROOM 4", available: true, capacity: 50 },
          { id: 5, name: "CLASSROOM 5", available: false, capacity: 50 },
          { id: 6, name: "SYNDICATE ROOM 1", available: true, capacity: 15 },
          { id: 7, name: "THERMOFLUID LAB", available: false, capacity: 50 },
          { id: 8, name: "EDS", available: true, capacity: 100 }
        ],
        "TYD": [
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
      
      // Push initial classroom data to Firebase
      classroomsRef.set(initialClassrooms);

      // Also store in localStorage for offline access
      localStorage.setItem('classroomData', JSON.stringify(initialClassrooms));
    } else {
      // Update local storage with Firebase data
      localStorage.setItem('classroomData', JSON.stringify(snapshot.val()));
    }
  }).catch(error => {
    console.error("Firebase data initialization error:", error);
    // Use localStorage as fallback if Firebase fails
    if (!localStorage.getItem('classroomData')) {
      const fallbackData = {
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
      localStorage.setItem('classroomData', JSON.stringify(fallbackData));
    }
  });

  // Initialize reservations structure if not exists
  initializeReservations();
}

// Initialize reservations structure
function initializeReservations() {
  const reservationsRef = database.ref('reservations');
  reservationsRef.once('value').then((snapshot) => {
    if (!snapshot.exists()) {
      // Create initial reservations structure
      const initialReservations = {
        pending: [],
        approved: [],
        denied: [],
        lastUpdate: Date.now()
      };
      
      // Push initial reservations to Firebase
      reservationsRef.set(initialReservations);

      // Also store in localStorage for offline access
      localStorage.setItem('classroomReservations', JSON.stringify(initialReservations));
    } else {
      // Update localStorage with Firebase data
      localStorage.setItem('classroomReservations', JSON.stringify(snapshot.val()));
    }
  }).catch(error => {
    console.error("Firebase reservations initialization error:", error);
    // Use localStorage as fallback if Firebase fails
    if (!localStorage.getItem('classroomReservations')) {
      const fallbackReservations = {
        pending: [],
        approved: [],
        denied: [],
        lastUpdate: Date.now()
      };
      localStorage.setItem('classroomReservations', JSON.stringify(fallbackReservations));
    }
  });
}

// Get reservations from Firebase
function getReservations(callback) {
  const reservationsRef = database.ref('reservations');
  reservationsRef.once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        const reservations = snapshot.val();
        // Also update localStorage for offline access
        localStorage.setItem('classroomReservations', JSON.stringify(reservations));
        if (callback) callback(reservations);
        return reservations;
      } else {
        // If no data in Firebase, check localStorage
        const localReservations = JSON.parse(localStorage.getItem('classroomReservations')) || {
          pending: [],
          approved: [],
          denied: [],
          lastUpdate: Date.now()
        };
        if (callback) callback(localReservations);
        return localReservations;
      }
    })
    .catch(error => {
      console.error("Error getting reservations:", error);
      // Use localStorage as fallback
      const localReservations = JSON.parse(localStorage.getItem('classroomReservations')) || {
        pending: [],
        approved: [],
        denied: [],
        lastUpdate: Date.now()
      };
      if (callback) callback(localReservations);
      return localReservations;
    });
}

// Get classroom data from Firebase
function getClassroomData(callback) {
  const classroomsRef = database.ref('classrooms');
  classroomsRef.once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        const classrooms = snapshot.val();
        // Also update localStorage for offline access
        localStorage.setItem('classroomData', JSON.stringify(classrooms));
        if (callback) callback(classrooms);
        return classrooms;
      } else {
        // If no data in Firebase, check localStorage
        const localClassrooms = JSON.parse(localStorage.getItem('classroomData'));
        if (callback) callback(localClassrooms);
        return localClassrooms;
      }
    })
    .catch(error => {
      console.error("Error getting classroom data:", error);
      // Use localStorage as fallback
      const localClassrooms = JSON.parse(localStorage.getItem('classroomData'));
      if (callback) callback(localClassrooms);
      return localClassrooms;
    });
}

// Update reservations in Firebase
function updateReservations(reservations) {
  return database.ref('reservations').set(reservations)
    .then(() => {
      // Update localStorage for offline access
      localStorage.setItem('classroomReservations', JSON.stringify(reservations));
      return true;
    })
    .catch(error => {
      console.error("Error updating reservations:", error);
      return false;
    });
}

// Update classroom data in Firebase
function updateClassroomData(classrooms) {
  return database.ref('classrooms').set(classrooms)
    .then(() => {
      // Update localStorage for offline access
      localStorage.setItem('classroomData', JSON.stringify(classrooms));
      return true;
    })
    .catch(error => {
      console.error("Error updating classroom data:", error);
      return false;
    });
}

// Helper function to format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

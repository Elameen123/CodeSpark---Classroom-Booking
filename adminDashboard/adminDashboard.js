document.addEventListener('DOMContentLoaded', function() {
    // ——— CONFIG & STATE ———
    const db = firebase.database();
    const reservationsRef = db.ref('reservations');
    const classroomsRef   = db.ref('classrooms');
    emailjs.init("O3K5dfZJQv5YP6W9V");
  
    let allReservations = {};
    let recentActivities = [];  // for updateRecentActivity
  
    // ——— DOM ELEMENTS ———
    const statusFilterEl    = document.getElementById('status-filter');
    const dateFilterEl      = document.getElementById('date-filter');
    const locationFilterEl  = document.getElementById('location-filter');
    const applyFiltersBtn   = document.getElementById('apply-filters');
    const clearFiltersBtn   = document.getElementById('clear-filters');
    const refreshBtn        = document.getElementById('refresh-btn');
    const exportBtn         = document.getElementById('export-btn');
    const createBtn         = document.getElementById('create-reservation-btn');
    const bookingModal      = document.getElementById('booking-modal');
    const closeBookingBtn   = document.getElementById('close-booking-modal');
    const bookingForm       = document.getElementById('booking-form');
    const reviewModal       = document.getElementById('review-modal');
    const closeReviewBtn    = document.getElementById('close-review-modal');
    const reviewForm        = document.getElementById('review-form');
    const approveBtn        = document.getElementById('approve-btn');
    const denyBtn           = document.getElementById('deny-btn');
    const confirmModal      = document.getElementById('confirm-modal');
    const closeConfirmBtn   = document.getElementById('close-confirm-modal');
    const confirmCancelBtn  = document.getElementById('confirm-cancel');
    const confirmProceedBtn = document.getElementById('confirm-proceed');
    const logoutBtn         = document.getElementById('logout-btn');
    const alertPopup        = document.getElementById('success-alert');
    const alertMessage      = document.getElementById('alert-message');
  
    const pendingCountEl    = document.getElementById('pending-count');
    const approvedCountEl   = document.getElementById('approved-count');
    const deniedCountEl     = document.getElementById('denied-count');
    const totalCountEl      = document.getElementById('total-count');
    const currentViewTitle  = document.getElementById('current-view-title');
    const tableBody         = document.getElementById('reservations-list');
    const activityListEl    = document.querySelector('.activity-list');
  
    let confirmAction = null;
    let confirmData   = null;
  
    // ——— HELPERS ———
    function showAlert(msg) {
      alertMessage.textContent = msg;
      alertPopup.classList.add('show');
      setTimeout(() => alertPopup.classList.remove('show'), 5000);
    }
  
    function formatDate(d) {
      try {
        return new Date(d)
          .toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
      } catch {
        return d;
      }
    }
  
    function truncate(s, n=30) {
      return (s && s.length>n) ? s.slice(0,n)+'…' : s;
    }
  
    function getTimeAgo(date) {
      const now = new Date(), diffMs = now - new Date(date);
      const diffMin = Math.floor(diffMs/60000);
      if (diffMin<1) return 'Just now';
      if (diffMin<60) return diffMin+' minute'+(diffMin===1?'':'s')+' ago';
      const diffH = Math.floor(diffMin/60);
      if (diffH<24) return diffH+' hour'+(diffH===1?'':'s')+' ago';
      const diffD = Math.floor(diffH/24);
      return diffD+' day'+(diffD===1?'':'s')+' ago';
    }
  
    // ——— STATS & FILTERS ———
    function updateStats() {
      const vals = Object.values(allReservations);
      const p = vals.filter(r=>r.status==='pending').length;
      const a = vals.filter(r=>r.status==='approved').length;
      const d = vals.filter(r=>r.status==='denied').length;
      pendingCountEl.textContent  = p;
      approvedCountEl.textContent = a;
      deniedCountEl.textContent   = d;
      totalCountEl.textContent    = p + a + d;
    }
  
    function filterAndRender() {
      const st = statusFilterEl.value, dt = dateFilterEl.value, loc = locationFilterEl.value;
      currentViewTitle.textContent =
        st==='all' ? 'All Reservations'
      : st.charAt(0).toUpperCase()+st.slice(1)+' Reservations';
  
      const list = Object.values(allReservations)
        .filter(r => {
          if (st!=='all' && r.status!==st) return false;
          if (dt && r.date!==dt) return false;
          if (loc!=='ALL' && !r.classroom.startsWith(loc+' ')) return false;
          return true;
        })
        .sort((a,b)=>new Date(b.date)-new Date(a.date));
  
      if (!list.length) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;">No reservations match your filters</td></tr>`;
      } else {
        tableBody.innerHTML = list.map(r=>`
          <tr>
            <td>${r.id}</td>
            <td>${r.studentName||'—'}</td>
            <td>${r.classroom}</td>
            <td>${formatDate(r.date)}</td>
            <td>${r.time}</td>
            <td title="${r.purpose}">${truncate(r.purpose)}</td>
            <td><span class="status-badge ${r.status}">${r.status.charAt(0).toUpperCase()+r.status.slice(1)}</span></td>
            <td><button class="view-btn" data-id="${r.id}"><i class="fas fa-eye"></i></button></td>
          </tr>`).join('');
      }
    }
  
    // ——— RECENT ACTIVITY ———
    function updateRecentActivity() {
      recentActivities = Object.values(allReservations)
        .filter(r => r.processedAt || r.createdAt)
        .map(r => ({
          id: r.id,
          action: r.status === 'approved' ? 'approved'
                 : r.status === 'denied'   ? 'denied'
                 : 'created',
          timestamp: r.processedAt || r.createdAt
        }))
        .sort((a,b)=> new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0,5);
  
      activityListEl.innerHTML = recentActivities.map(act => {
        const icon = act.action==='approved' ? 'fa-check' 
                   : act.action==='denied'   ? 'fa-times'
                   : 'fa-calendar-plus';
        const text = act.action==='approved' ? `Reservation #${act.id} approved`
                   : act.action==='denied'   ? `Reservation #${act.id} denied`
                   : `Reservation #${act.id} created`;
        return `
          <div class="activity-item">
            <div class="activity-icon ${act.action}">
              <i class="fas ${icon}"></i>
            </div>
            <div class="activity-content">
              <div class="activity-text">${text}</div>
              <div class="activity-time">${getTimeAgo(act.timestamp)}</div>
            </div>
          </div>`;
      }).join('');
    }
  
    // ——— EMAIL ———
    function sendApprovalEmail(res) {
        // Make sure we have a valid recipient
        if (!res.email || !res.studentName) {
          console.warn('Skipping email—missing email or studentName:', res);
          return;
        }
      
        // Sanitize any null/undefined
        const safeDate = res.date || 'Unspecified date';
        const safeTime = (res.time && !res.time.includes('null'))
          ? res.time
          : 'Unspecified time';
      
        const admin = JSON.parse(localStorage.getItem('loggedInUser')) || {};
      
        const templateParams = {
          to_email:      res.email,
          to_name:       res.studentName,
          reservation_id: res.id,
          classroom:     res.classroom || 'Requested Classroom',
          date:          formatDate(safeDate),
          time:          safeTime,
          purpose:       res.purpose || 'No purpose provided',
          admin_name:    admin.name || 'Administrator',
          admin_comment: res.adminComment || '',
          cc_security:   'osagie.osazuwa@pau.edu.ng',
          cc_facility:   'muizah.apampa@pau.edu.ng',
          cc_admin:      admin.email || ''
        };
      
        console.log('📧 Sending EmailJS with params:', templateParams);
      
        emailjs.send('service_y4hrfnh', 'template_mkka46n', templateParams)
          .then(response => {
            console.log('✅ EmailJS success:', response);
            showAlert('Approval email sent!');
          })
          .catch(err => {
            // EmailJS error object often contains .status and .text
            console.error('❌ EmailJS error status:', err.status);
            console.error('❌ EmailJS error text:', err.text);
            showAlert(`Failed to send email: ${err.text || err.message}`);
          });
      }
      
    // ——— AUTH CHECK ———
    const me = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!me || me.role!=='admin') {
      window.location.href = '/login.html';
      return;
    }
    document.getElementById('user-name').textContent = me.name;
    document.getElementById('user-id').textContent   = 'Administrator';
  
    // ——— FLATPICKR ———
    flatpickr("#date-filter",   { dateFormat:"Y-m-d", allowInput:true });
    flatpickr("#booking-date",  { dateFormat:"Y-m-d", minDate:"today", allowInput:true });
    flatpickr("#review-date",   { dateFormat:"Y-m-d", allowInput:true });
  
     // ——— LOAD CLASSROOMS ———
  classroomsRef.on('value', snap => {
    const data = snap.val() || {};
    const select = bookingForm.querySelector('#booking-classroom');
    select.innerHTML = '<option value="">Select a classroom</option>';

    // For each building (e.g. "SST", "TYD")
    Object.keys(data).forEach(building => {
      // data[building] might be an object (keyed by push IDs), so get its values
      const rooms = Array.isArray(data[building])
        ? data[building]
        : Object.values(data[building] || {});

      rooms.forEach(c => {
        const opt = document.createElement('option');
        opt.value = `${building} ${c.name}`;
        opt.textContent = `${building} ${c.name}`;
        select.appendChild(opt);
      });
    });
  });

  reservationsRef.on('value', snapshot => {
    const raw = snapshot.val() || {};

    // Build a flat map { id → reservation } out of potentially nested sections
    const flat = {};

    // Handle the “grouped” shape (pending / approved / denied)
    ['pending','approved','denied'].forEach(statusKey => {
      if (raw[statusKey] && typeof raw[statusKey] === 'object') {
        Object.values(raw[statusKey]).forEach(r => {
          r.status = statusKey;      // re-stamp the status
          flat[r.id] = r;
        });
      }
    });

    // Handle any top-level reservations that already live at root (if you have any)
    Object.values(raw).forEach(r => {
      if (r && r.id && r.status) {
        flat[r.id] = r;
      }
    });

    allReservations = flat;
    updateStats();
    filterAndRender();
    updateRecentActivity();
  });

    
  
    // ——— FILTER CONTROLS ———
    applyFiltersBtn.addEventListener('click', filterAndRender);
    clearFiltersBtn.addEventListener('click', ()=> {
      statusFilterEl.value   = 'pending';
      dateFilterEl.value     = '';
      locationFilterEl.value = 'ALL';
      filterAndRender();
    });
  
    // ——— REFRESH & EXPORT ———
    refreshBtn.addEventListener('click', ()=> {
      filterAndRender();
      showAlert('Data refreshed');
    });
    exportBtn.addEventListener('click', ()=> {
      /* same CSV logic as before… */
      showAlert('Export completed');
    });
  
    // ——— CREATE (ADMIN) ———
    createBtn.addEventListener('click', ()=> bookingModal.style.display='flex');
    closeBookingBtn.addEventListener('click', ()=> bookingModal.style.display='none');
    bookingForm.addEventListener('submit', e=>{
      e.preventDefault();
      const f = new FormData(bookingForm);
      const newRes = {
        classroom:  f.get('booking-classroom'),
        date:       f.get('booking-date'),
        time:       f.get('booking-start-time')+' - '+f.get('booking-end-time'),
        purpose:    f.get('booking-purpose'),
        attendees:  Number(f.get('booking-attendees')),
        status:     'approved',
        studentName: me.name,
        studentId:   me.id,
        email:       me.email,
        createdAt:   new Date().toISOString()
      };
      const nr = reservationsRef.push();
      nr.set({ id: nr.key, ...newRes });
      bookingModal.style.display='none';
      showAlert('Admin reservation created');
      bookingForm.reset();
    });
  
    // ——— REVIEW FLOW ———
    tableBody.addEventListener('click', function(e) {
        const btn = e.target.closest('.view-btn');
        if (!btn) return;
    
        const id = btn.dataset.id;
        console.log('Opening review modal for ID:', id);
    
        // Look up in our in-memory cache instead of another DB call
        const r = allReservations[id];
        if (!r) {
          return console.warn('No reservation in cache for', id);
        }
    
        // populate review form
        reviewForm.reset();
        reviewForm['reservation-id'].value    = r.id;
        document.getElementById('student-name').textContent    = r.studentName;
        document.getElementById('student-id').textContent      = r.studentId;
        document.getElementById('review-classroom').value      = r.classroom;
        document.getElementById('review-date').value           = r.date;
        document.getElementById('review-time').value           = r.time;
        document.getElementById('review-purpose').value        = r.purpose;
        document.getElementById('review-attendees').value      = r.attendees;
        document.getElementById('admin-comment').value         = r.adminComment || '';
    
        // show the modal
        reviewModal.style.display = 'flex';
      });

  // Close review modal
  closeReviewBtn.addEventListener('click', () => {
    console.log('Closing review modal');
    reviewModal.style.display = 'none';
  });

  
    function showConfirm(action) {
      confirmAction = action;
      confirmData   = { id: reviewForm['reservation-id'].value };
      document.getElementById('confirm-message').textContent =
        `Are you sure you want to ${action} reservation ${confirmData.id}?`;
      confirmModal.style.display='flex';
    }
    approveBtn.addEventListener('click', ()=> showConfirm('approve'));
    denyBtn   .addEventListener('click', ()=> showConfirm('deny'));
    closeConfirmBtn.addEventListener('click', ()=> confirmModal.style.display='none');
    confirmCancelBtn.addEventListener('click', ()=> confirmModal.style.display='none');
  
    confirmProceedBtn.addEventListener('click', () => {
        const id      = confirmData.id;
        const comment = document.getElementById('admin-comment').value;
        const newStatus = confirmAction === 'approve' ? 'approved' : 'denied';
      
        // Grab the full reservation from cache
        const original = allReservations[id];
        if (!original) {
          return console.warn('No reservation in cache for', id);
        }
      
        // 1) Remove it from pending
        const pendingPath = `pending/${id}`;
        reservationsRef.child(pendingPath).remove()
          .then(() => {
            // 2) Write it under approved or denied
            const targetPath = `${newStatus}/${id}`;
            return reservationsRef.child(targetPath).set({
              ...original,
              status:       newStatus,
              adminComment: comment,
              processedAt:  new Date().toISOString()
            });
          })
          .then(() => {
            // 3) UI feedback
            reviewModal.style.display  = 'none';
            confirmModal.style.display = 'none';
            showAlert(`Reservation ${id} ${confirmAction}d`);
      
            // 4) Send email if approved
            if (newStatus === 'approved') {
              sendApprovalEmail(original);
            }
            // No need to manually call updateStats/filterAndRender/updateRecentActivity:
            // your real-time listener on reservationsRef will fire as soon as pending/<id>
            // is removed and approved/<id> is added.
          })
          .catch(err => {
            console.error('Error moving reservation:', err);
            showAlert('Failed to update reservation status');
          });
      });
      
      
  
    // ——— LOGOUT ———
    logoutBtn.addEventListener('click', () => {
        // 1) Sign out of Firebase Auth
        firebase.auth().signOut().catch(err => {
          console.error('Firebase signOut error:', err);
        });
      
        // 2) Clear your saved flags
        localStorage.removeItem('loggedInUser');
        sessionStorage.removeItem('userToken');
      
        // 3) Redirect to login
        window.location.href = '/loginPage/login.html';
      });
      
      
  });

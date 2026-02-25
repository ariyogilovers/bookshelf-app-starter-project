document.addEventListener('DOMContentLoaded', () => {
  const AUTH_API = '/.netlify/functions/auth';
  const BOOKS_API = '/.netlify/functions/books';
  const FILMS_API = '/.netlify/functions/films';

  // ============================================
  // Auth State
  // ============================================
  let authToken = localStorage.getItem('authToken');
  let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  // ============================================
  // Auth DOM
  // ============================================
  const authContainer = document.getElementById('authContainer');
  const appWrapper = document.getElementById('appWrapper');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');
  const userNameEl = document.getElementById('userName');
  const logoutBtn = document.getElementById('logoutBtn');

  // ============================================
  // DOM Elements — Books
  // ============================================
  const bookForm = document.getElementById('bookForm');
  const bookTitleInput = document.getElementById('bookFormTitle');
  const bookAuthorInput = document.getElementById('bookFormAuthor');
  const bookYearInput = document.getElementById('bookFormYear');
  const bookGenreInput = document.getElementById('bookFormGenre');
  const bookFranchiseInput = document.getElementById('bookFormFranchise');
  const bookIsCompleteInput = document.getElementById('bookFormIsComplete');

  const editBookForm = document.getElementById('editBookForm');
  const editBookTitleInput = document.getElementById('editBookFormTitle');
  const editBookAuthorInput = document.getElementById('editBookFormAuthor');
  const editBookYearInput = document.getElementById('editBookFormYear');
  const editBookGenreInput = document.getElementById('editBookFormGenre');
  const editBookFranchiseInput = document.getElementById('editBookFormFranchise');
  const editBookIsCompleteInput = document.getElementById('editBookFormIsComplete');
  const editBookCancelBtn = document.getElementById('editBookFormCancel');

  const searchBookForm = document.getElementById('searchBook');
  const searchBookTitleInput = document.getElementById('searchBookTitle');

  const incompleteBookList = document.getElementById('incompleteBookList');
  const completeBookList = document.getElementById('completeBookList');
  const searchBookResults = document.getElementById('searchBookResults');

  // ============================================
  // DOM Elements — Films
  // ============================================
  const filmForm = document.getElementById('filmForm');
  const filmTitleInput = document.getElementById('filmFormTitle');
  const filmDirectorInput = document.getElementById('filmFormDirector');
  const filmYearInput = document.getElementById('filmFormYear');
  const filmGenreInput = document.getElementById('filmFormGenre');
  const filmFranchiseInput = document.getElementById('filmFormFranchise');
  const filmIsCompleteInput = document.getElementById('filmFormIsComplete');

  const editFilmForm = document.getElementById('editFilmForm');
  const editFilmTitleInput = document.getElementById('editFilmFormTitle');
  const editFilmDirectorInput = document.getElementById('editFilmFormDirector');
  const editFilmYearInput = document.getElementById('editFilmFormYear');
  const editFilmGenreInput = document.getElementById('editFilmFormGenre');
  const editFilmFranchiseInput = document.getElementById('editFilmFormFranchise');
  const editFilmIsCompleteInput = document.getElementById('editFilmFormIsComplete');
  const editFilmCancelBtn = document.getElementById('editFilmFormCancel');

  const searchFilmForm = document.getElementById('searchFilm');
  const searchFilmTitleInput = document.getElementById('searchFilmTitle');

  const incompleteFilmList = document.getElementById('incompleteFilmList');
  const completeFilmList = document.getElementById('completeFilmList');
  const searchFilmResults = document.getElementById('searchFilmResults');

  // ============================================
  // Sidebar & Navigation
  // ============================================
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelectorAll('.nav-link');
  const pageSections = document.querySelectorAll('.page-section');

  let editingBookId = null;
  let editingFilmId = null;

  // ============================================
  // Auth Logic
  // ============================================
  function showApp() {
    authContainer.style.display = 'none';
    appWrapper.style.display = 'flex';
    if (currentUser) userNameEl.textContent = currentUser.name;
    renderAll();
  }

  // ============================================
  // Slider Logic
  // ============================================
  function setupSliders() {
    const sliderConfigs = [
      { grid: 'recentBooks', prev: 'recentBooksPrev', next: 'recentBooksNext' },
      { grid: 'recentFilms', prev: 'recentFilmsPrev', next: 'recentFilmsNext' },
      { grid: 'sharedBooksList', prev: 'sharedBooksPrev', next: 'sharedBooksNext' },
      { grid: 'sharedFilmsList', prev: 'sharedFilmsPrev', next: 'sharedFilmsNext' },
      { grid: 'incompleteBookList', prev: 'incompleteBookPrev', next: 'incompleteBookNext' },
      { grid: 'completeBookList', prev: 'completeBookPrev', next: 'completeBookNext' },
      { grid: 'searchBookResults', prev: 'searchBookPrev', next: 'searchBookNext' },
      { grid: 'incompleteFilmList', prev: 'incompleteFilmPrev', next: 'incompleteFilmNext' },
      { grid: 'completeFilmList', prev: 'completeFilmPrev', next: 'completeFilmNext' },
      { grid: 'searchFilmResults', prev: 'searchFilmPrev', next: 'searchFilmNext' }
    ];

    sliderConfigs.forEach(config => {
      const grid = document.getElementById(config.grid);
      const prev = document.getElementById(config.prev);
      const next = document.getElementById(config.next);

      if (grid && prev && next) {
        prev.onclick = () => {
          grid.scrollBy({ left: -340, behavior: 'smooth' });
        };
        next.onclick = () => {
          grid.scrollBy({ left: 340, behavior: 'smooth' });
        };

        // Auto-run / Auto-slide effect ("berjalan")
        let autoScroll = setInterval(() => {
          if (grid.scrollLeft + grid.offsetWidth >= grid.scrollWidth) {
            grid.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            grid.scrollBy({ left: 340, behavior: 'smooth' });
          }
        }, 8000); // Every 8 seconds

        // Pause on hover
        grid.addEventListener('mouseenter', () => clearInterval(autoScroll));
        grid.addEventListener('mouseleave', () => {
          autoScroll = setInterval(() => {
            if (grid.scrollLeft + grid.offsetWidth >= grid.scrollWidth) {
              grid.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
              grid.scrollBy({ left: 340, behavior: 'smooth' });
            }
          }, 8000);
        });
      }
    });
  }

  function showAuth() {
    authContainer.style.display = 'flex';
    appWrapper.style.display = 'none';
  }

  function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showAuth();
  }

  // Check if already logged in
  if (authToken && currentUser) {
    showApp();
  } else {
    showAuth();
  }

  showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    loginError.textContent = '';
  });

  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    registerError.textContent = '';
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        loginError.textContent = data.error || 'Login gagal';
        return;
      }
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      loginForm.reset();
      showApp();
    } catch (err) {
      loginError.textContent = 'Koneksi gagal, coba lagi';
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerError.textContent = '';
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (password.length < 6) {
      registerError.textContent = 'Password minimal 6 karakter';
      return;
    }

    try {
      const res = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        registerError.textContent = data.error || 'Registrasi gagal';
        return;
      }
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      registerForm.reset();
      showApp();
    } catch (err) {
      registerError.textContent = 'Koneksi gagal, coba lagi';
    }
  });

  logoutBtn.addEventListener('click', logout);

  // ============================================
  // Sidebar Toggle
  // ============================================
  hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.dataset.section;
      if (!sectionId) return;
      navigateTo(sectionId);
      sidebar.classList.remove('open');

      // Load shared dashboard data when navigating to it
      if (sectionId === 'sharedDashboardSection') renderSharedDashboard();
    });
  });

  function navigateTo(sectionId) {
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === sectionId));
    pageSections.forEach(section => section.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
  }

  // ============================================
  // Generic API Helpers (with auth)
  // ============================================
  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };
  }

  async function fetchItems(apiUrl, searchQuery = '', shared = false) {
    try {
      let url = apiUrl;
      const params = [];
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (shared) params.push('shared=true');
      if (params.length) url += '?' + params.join('&');

      const response = await fetch(url, { headers: authHeaders() });
      if (response.status === 401) { logout(); return []; }
      if (!response.ok) throw new Error('Fetch failed');
      return await response.json();
    } catch (err) {
      console.error('Fetch error:', err);
      return [];
    }
  }

  async function addItem(apiUrl, item) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(item),
      });
      if (response.status === 401) { logout(); return null; }
      if (!response.ok) throw new Error('Add failed');
      return await response.json();
    } catch (err) {
      console.error('Add error:', err);
      return null;
    }
  }

  // Call slider setup once
  setupSliders();

  async function updateItem(apiUrl, id, data) {
    try {
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ id, ...data }),
      });
      if (response.status === 401) { logout(); return null; }
      if (!response.ok) throw new Error('Update failed');
      return await response.json();
    } catch (err) {
      console.error('Update error:', err);
      return null;
    }
  }

  // Toggle completion for any item (family-wide, uses PATCH)
  async function toggleSharedItem(apiUrl, id, isComplete) {
    try {
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ id, isComplete }),
      });
      if (response.status === 401) { logout(); return null; }
      if (!response.ok) throw new Error('Toggle failed');
      return await response.json();
    } catch (err) {
      console.error('Toggle error:', err);
      return null;
    }
  }

  async function deleteItem(apiUrl, id) {
    try {
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ id }),
      });
      if (response.status === 401) { logout(); return false; }
      if (!response.ok) throw new Error('Delete failed');
      return true;
    } catch (err) {
      console.error('Delete error:', err);
      return false;
    }
  }

  // ============================================
  // DOM Rendering
  // ============================================
  function createBookElement(book, showOwner = false) {
    const div = document.createElement('div');
    div.classList.add('book-card', 'glass-card');
    const statusBadge = book.isComplete
      ? '<span class="status-badge complete"><i class="bx bxs-check-circle"></i> Selesai</span>'
      : '<span class="status-badge incomplete"><i class="bx bxs-time"></i> Belum</span>';
    const ownerBadge = showOwner && book.ownerName
      ? `<span class="owner-badge"><i class='bx bxs-user'></i> ${book.ownerName}</span>` : '';

    const names = (book.completedBy || '').split(',').map(n => n.trim()).filter(Boolean);
    const isUserComplete = currentUser && names.includes(currentUser.name);

    div.innerHTML = `
    <div class="book-info">
      <h3 class="book-title">${book.title}</h3>
      <p class="book-meta"><i class='bx bxs-user'></i> ${book.author}</p>
      <p class="book-meta"><i class='bx bxs-calendar'></i> ${book.year}</p>
      ${book.genre ? `<p class="book-meta"><i class='bx bxs-category'></i> ${book.genre}</p>` : ''}
      ${book.franchise ? `<p class="book-meta"><i class='bx bxs-star'></i> ${book.franchise}</p>` : ''}
      <div class="book-badges">${statusBadge}${ownerBadge}</div>
      ${book.isComplete && book.completedBy ? `<p class="completed-by"><i class='bx bxs-check-shield'></i> Dibaca oleh: <strong>${book.completedBy}</strong></p>` : ''}
    </div>
    <div class="book-actions">
      <button class="btn-icon toggle ${isUserComplete ? 'me' : ''}" title="${isUserComplete ? 'Tandai belum' : 'Tandai selesai'}">
        <i class='bx ${isUserComplete ? 'bxs-book-reader' : 'bxs-book-bookmark'}'></i>
      </button>
      ${!showOwner ? `
        <button class="btn-icon edit" title="Edit"><i class='bx bxs-edit'></i></button>
        <button class="btn-icon delete" title="Hapus"><i class='bx bxs-trash'></i></button>
      ` : ''}
    </div>
  `;

    // Toggle is always available (own items use PUT, shared items use PATCH)
    div.querySelector('.toggle').addEventListener('click', async () => {
      if (showOwner) {
        await toggleSharedItem(BOOKS_API, book.id, !isUserComplete);
        renderSharedDashboard();
      } else {
        await updateItem(BOOKS_API, book.id, {
          title: book.title, author: book.author, year: book.year,
          genre: book.genre, franchise: book.franchise, isComplete: !isUserComplete,
        });
      }
      renderAll();
    });

    if (!showOwner) {
      div.querySelector('.edit').addEventListener('click', () => {
        editingBookId = book.id;
        editBookTitleInput.value = book.title;
        editBookAuthorInput.value = book.author;
        editBookYearInput.value = book.year;
        editBookGenreInput.value = book.genre || '';
        editBookFranchiseInput.value = book.franchise || '';
        editBookIsCompleteInput.checked = book.isComplete;
        navigateTo('editBookSection');
      });
      div.querySelector('.delete').addEventListener('click', async () => {
        if (confirm(`Hapus "${book.title}"?`)) {
          await deleteItem(BOOKS_API, book.id);
          renderAll();
        }
      });
    }

    return div;
  }

  function createFilmElement(film, showOwner = false) {
    const div = document.createElement('div');
    div.classList.add('book-card', 'glass-card');
    const statusBadge = film.isComplete
      ? '<span class="status-badge complete"><i class="bx bxs-check-circle"></i> Ditonton</span>'
      : '<span class="status-badge incomplete"><i class="bx bxs-time"></i> Belum</span>';
    const ownerBadge = showOwner && film.ownerName
      ? `<span class="owner-badge"><i class='bx bxs-user'></i> ${film.ownerName}</span>` : '';

    const names = (film.completedBy || '').split(',').map(n => n.trim()).filter(Boolean);
    const isUserComplete = currentUser && names.includes(currentUser.name);

    div.innerHTML = `
    <div class="book-info">
      <h3 class="book-title">${film.title}</h3>
      <p class="book-meta"><i class='bx bxs-user'></i> ${film.director}</p>
      <p class="book-meta"><i class='bx bxs-calendar'></i> ${film.year}</p>
      ${film.genre ? `<p class="book-meta"><i class='bx bxs-category'></i> ${film.genre}</p>` : ''}
      ${film.franchise ? `<p class="book-meta"><i class='bx bxs-star'></i> ${film.franchise}</p>` : ''}
      <div class="book-badges">${statusBadge}${ownerBadge}</div>
      ${film.isComplete && film.completedBy ? `<p class="completed-by"><i class='bx bxs-check-shield'></i> Ditonton oleh: <strong>${film.completedBy}</strong></p>` : ''}
    </div>
    <div class="book-actions">
      <button class="btn-icon toggle ${isUserComplete ? 'me' : ''}" title="${isUserComplete ? 'Tandai belum' : 'Tandai ditonton'}">
        <i class='bx ${isUserComplete ? 'bxs-video-off' : 'bxs-video'}'></i>
      </button>
      ${!showOwner ? `
        <button class="btn-icon edit" title="Edit"><i class='bx bxs-edit'></i></button>
        <button class="btn-icon delete" title="Hapus"><i class='bx bxs-trash'></i></button>
      ` : ''}
    </div>
  `;

    // Toggle is always available (own items use PUT, shared items use PATCH)
    div.querySelector('.toggle').addEventListener('click', async () => {
      if (showOwner) {
        await toggleSharedItem(FILMS_API, film.id, !isUserComplete);
        renderSharedDashboard();
      } else {
        await updateItem(FILMS_API, film.id, {
          title: film.title, director: film.director, year: film.year,
          genre: film.genre, franchise: film.franchise, isComplete: !isUserComplete,
        });
      }
      renderAll();
    });

    if (!showOwner) {
      div.querySelector('.edit').addEventListener('click', () => {
        editingFilmId = film.id;
        editFilmTitleInput.value = film.title;
        editFilmDirectorInput.value = film.director;
        editFilmYearInput.value = film.year;
        editFilmGenreInput.value = film.genre || '';
        editFilmFranchiseInput.value = film.franchise || '';
        editFilmIsCompleteInput.checked = film.isComplete;
        navigateTo('editFilmSection');
      });
      div.querySelector('.delete').addEventListener('click', async () => {
        if (confirm(`Hapus "${film.title}"?`)) {
          await deleteItem(FILMS_API, film.id);
          renderAll();
        }
      });
    }

    return div;
  }

  // ============================================
  // Render All (Personal)
  // ============================================
  async function renderAll() {
    const books = await fetchItems(BOOKS_API);
    const films = await fetchItems(FILMS_API);

    // Personal Stats
    const incBooks = books.filter(b => !b.isComplete);
    const comBooks = books.filter(b => b.isComplete);
    document.getElementById('totalBooks').textContent = books.length;
    document.getElementById('incompleteBookCount').textContent = incBooks.length;
    document.getElementById('completeBookCount').textContent = comBooks.length;

    const incFilms = films.filter(f => !f.isComplete);
    const comFilms = films.filter(f => f.isComplete);
    document.getElementById('totalFilms').textContent = films.length;
    document.getElementById('incompleteFilmCount').textContent = incFilms.length;
    document.getElementById('completeFilmCount').textContent = comFilms.length;

    // Recent
    const recentBooks = document.getElementById('recentBooks');
    const recentFilms = document.getElementById('recentFilms');
    recentBooks.innerHTML = '';
    recentFilms.innerHTML = '';
    books.slice(0, 3).forEach(b => recentBooks.appendChild(createBookElement(b)));
    films.slice(0, 3).forEach(f => recentFilms.appendChild(createFilmElement(f)));

    // Lists
    incompleteBookList.innerHTML = '';
    completeBookList.innerHTML = '';
    incBooks.forEach(b => incompleteBookList.appendChild(createBookElement(b)));
    comBooks.forEach(b => completeBookList.appendChild(createBookElement(b)));

    incompleteFilmList.innerHTML = '';
    completeFilmList.innerHTML = '';
    incFilms.forEach(f => incompleteFilmList.appendChild(createFilmElement(f)));
    comFilms.forEach(f => completeFilmList.appendChild(createFilmElement(f)));

    // Empty states
    if (!incBooks.length) incompleteBookList.innerHTML = '<p class="empty-state"><i class="bx bxs-happy-heart-eyes"></i> Semua buku sudah selesai dibaca!</p>';
    if (!comBooks.length) completeBookList.innerHTML = '<p class="empty-state"><i class="bx bxs-book-reader"></i> Belum ada buku yang selesai dibaca.</p>';
    if (!incFilms.length) incompleteFilmList.innerHTML = '<p class="empty-state"><i class="bx bxs-happy-heart-eyes"></i> Semua film sudah ditonton!</p>';
    if (!comFilms.length) completeFilmList.innerHTML = '<p class="empty-state"><i class="bx bxs-video"></i> Belum ada film yang selesai ditonton.</p>';
  }

  // ============================================
  // Render Shared (Family) Dashboard
  // ============================================
  async function renderSharedDashboard() {
    const books = await fetchItems(BOOKS_API, '', true);
    const films = await fetchItems(FILMS_API, '', true);

    const incBooks = books.filter(b => !b.isComplete);
    const comBooks = books.filter(b => b.isComplete);
    document.getElementById('sharedTotalBooks').textContent = books.length;
    document.getElementById('sharedIncBooks').textContent = incBooks.length;
    document.getElementById('sharedComBooks').textContent = comBooks.length;

    const incFilms = films.filter(f => !f.isComplete);
    const comFilms = films.filter(f => f.isComplete);
    document.getElementById('sharedTotalFilms').textContent = films.length;
    document.getElementById('sharedIncFilms').textContent = incFilms.length;
    document.getElementById('sharedComFilms').textContent = comFilms.length;

    const sharedBooksList = document.getElementById('sharedBooksList');
    const sharedFilmsList = document.getElementById('sharedFilmsList');
    sharedBooksList.innerHTML = '';
    sharedFilmsList.innerHTML = '';

    if (!books.length) sharedBooksList.innerHTML = '<p class="empty-state">Belum ada buku dari anggota keluarga.</p>';
    else books.forEach(b => sharedBooksList.appendChild(createBookElement(b, true)));

    if (!films.length) sharedFilmsList.innerHTML = '<p class="empty-state">Belum ada film dari anggota keluarga.</p>';
    else films.forEach(f => sharedFilmsList.appendChild(createFilmElement(f, true)));
  }

  // ============================================
  // Book Forms
  // ============================================
  bookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const book = {
      id: +new Date(),
      title: bookTitleInput.value,
      author: bookAuthorInput.value,
      year: Number(bookYearInput.value),
      genre: bookGenreInput.value,
      franchise: bookFranchiseInput.value,
      isComplete: bookIsCompleteInput.checked,
    };
    await addItem(BOOKS_API, book);
    bookForm.reset();
    await renderAll();
    navigateTo(book.isComplete ? 'completeBookSection' : 'incompleteBookSection');
  });

  editBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editingBookId) return;
    await updateItem(BOOKS_API, editingBookId, {
      title: editBookTitleInput.value,
      author: editBookAuthorInput.value,
      year: Number(editBookYearInput.value),
      genre: editBookGenreInput.value,
      franchise: editBookFranchiseInput.value,
      isComplete: editBookIsCompleteInput.checked,
    });
    editingBookId = null;
    editBookForm.reset();
    await renderAll();
    navigateTo('incompleteBookSection');
  });

  editBookCancelBtn.addEventListener('click', () => {
    editingBookId = null;
    editBookForm.reset();
    navigateTo('incompleteBookSection');
  });

  searchBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchBookTitleInput.value.trim();
    const results = await fetchItems(BOOKS_API, query);
    searchBookResults.innerHTML = '';
    if (!results.length) {
      searchBookResults.innerHTML = '<p class="empty-state">Tidak ditemukan.</p>';
    } else {
      results.forEach(b => searchBookResults.appendChild(createBookElement(b)));
    }
  });

  // ============================================
  // Film Forms
  // ============================================
  filmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const film = {
      id: +new Date(),
      title: filmTitleInput.value,
      director: filmDirectorInput.value,
      year: Number(filmYearInput.value),
      genre: filmGenreInput.value,
      franchise: filmFranchiseInput.value,
      isComplete: filmIsCompleteInput.checked,
    };
    await addItem(FILMS_API, film);
    filmForm.reset();
    await renderAll();
    navigateTo(film.isComplete ? 'completeFilmSection' : 'incompleteFilmSection');
  });

  editFilmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editingFilmId) return;
    await updateItem(FILMS_API, editingFilmId, {
      title: editFilmTitleInput.value,
      director: editFilmDirectorInput.value,
      year: Number(editFilmYearInput.value),
      genre: editFilmGenreInput.value,
      franchise: editFilmFranchiseInput.value,
      isComplete: editFilmIsCompleteInput.checked,
    });
    editingFilmId = null;
    editFilmForm.reset();
    await renderAll();
    navigateTo('incompleteFilmSection');
  });

  editFilmCancelBtn.addEventListener('click', () => {
    editingFilmId = null;
    editFilmForm.reset();
    navigateTo('incompleteFilmSection');
  });

  searchFilmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchFilmTitleInput.value.trim();
    const results = await fetchItems(FILMS_API, query);
    searchFilmResults.innerHTML = '';
    if (!results.length) {
      searchFilmResults.innerHTML = '<p class="empty-state">Tidak ditemukan.</p>';
    } else {
      results.forEach(f => searchFilmResults.appendChild(createFilmElement(f)));
    }
  });
});

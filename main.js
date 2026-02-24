document.addEventListener('DOMContentLoaded', () => {
  const BOOKS_API = '/api/books';
  const FILMS_API = '/api/films';

  // ============================================
  // DOM Elements — Books
  // ============================================
  const bookForm = document.getElementById('bookForm');
  const bookTitleInput = document.getElementById('bookFormTitle');
  const bookAuthorInput = document.getElementById('bookFormAuthor');
  const bookYearInput = document.getElementById('bookFormYear');
  const bookIsCompleteInput = document.getElementById('bookFormIsComplete');

  const editBookForm = document.getElementById('editBookForm');
  const editBookTitleInput = document.getElementById('editBookFormTitle');
  const editBookAuthorInput = document.getElementById('editBookFormAuthor');
  const editBookYearInput = document.getElementById('editBookFormYear');
  const editBookIsCompleteInput = document.getElementById('editBookFormIsComplete');
  const editBookFormCancel = document.getElementById('editBookFormCancel');

  const incompleteBookList = document.getElementById('incompleteBookList');
  const completeBookList = document.getElementById('completeBookList');
  const recentBooks = document.getElementById('recentBooks');
  const searchBookResults = document.getElementById('searchBookResults');

  const searchBookForm = document.getElementById('searchBook');
  const searchBookTitleInput = document.getElementById('searchBookTitle');

  // ============================================
  // DOM Elements — Films
  // ============================================
  const filmForm = document.getElementById('filmForm');
  const filmTitleInput = document.getElementById('filmFormTitle');
  const filmDirectorInput = document.getElementById('filmFormDirector');
  const filmYearInput = document.getElementById('filmFormYear');
  const filmIsCompleteInput = document.getElementById('filmFormIsComplete');

  const editFilmForm = document.getElementById('editFilmForm');
  const editFilmTitleInput = document.getElementById('editFilmFormTitle');
  const editFilmDirectorInput = document.getElementById('editFilmFormDirector');
  const editFilmYearInput = document.getElementById('editFilmFormYear');
  const editFilmIsCompleteInput = document.getElementById('editFilmFormIsComplete');
  const editFilmFormCancel = document.getElementById('editFilmFormCancel');

  const incompleteFilmList = document.getElementById('incompleteFilmList');
  const completeFilmList = document.getElementById('completeFilmList');
  const recentFilms = document.getElementById('recentFilms');
  const searchFilmResults = document.getElementById('searchFilmResults');

  const searchFilmForm = document.getElementById('searchFilm');
  const searchFilmTitleInput = document.getElementById('searchFilmTitle');

  // ============================================
  // Dashboard Stats
  // ============================================
  const totalBooksEl = document.getElementById('totalBooks');
  const incompleteBookCountEl = document.getElementById('incompleteBookCount');
  const completeBookCountEl = document.getElementById('completeBookCount');
  const totalFilmsEl = document.getElementById('totalFilms');
  const incompleteFilmCountEl = document.getElementById('incompleteFilmCount');
  const completeFilmCountEl = document.getElementById('completeFilmCount');

  // ============================================
  // Sidebar
  // ============================================
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelectorAll('.nav-link');
  const pageSections = document.querySelectorAll('.page-section');

  let editingBookId = null;
  let editingFilmId = null;

  // ============================================
  // Sidebar Navigation
  // ============================================
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSection = link.dataset.section;
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      pageSections.forEach(section => section.classList.remove('active'));
      const target = document.getElementById(targetSection);
      if (target) target.classList.add('active');
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        removeOverlay();
      }
    });
  });

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (sidebar.classList.contains('open')) addOverlay();
    else removeOverlay();
  });

  function addOverlay() {
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay active';
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        removeOverlay();
      });
      document.body.appendChild(overlay);
    } else {
      overlay.classList.add('active');
    }
  }

  function removeOverlay() {
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  function navigateTo(sectionId) {
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === sectionId));
    pageSections.forEach(section => section.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
  }

  // ============================================
  // Generic API Helpers
  // ============================================
  async function fetchItems(apiUrl, searchQuery = '') {
    try {
      const url = searchQuery ? `${apiUrl}?search=${encodeURIComponent(searchQuery)}` : apiUrl;
      const response = await fetch(url);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Add failed');
      return await response.json();
    } catch (err) {
      console.error('Add error:', err);
      return null;
    }
  }

  async function updateItem(apiUrl, id, data) {
    try {
      const response = await fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Update failed');
      return await response.json();
    } catch (err) {
      console.error('Update error:', err);
      return null;
    }
  }

  async function deleteItem(apiUrl, id) {
    try {
      const response = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
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

  function createEmptyState(message) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<i class='bx bxs-ghost'></i><p>${message}</p>`;
    return empty;
  }

  // --- Book Element ---
  function createBookElement(book) {
    const item = document.createElement('div');
    item.className = 'book-item';
    item.dataset.bookid = book.id;
    item.dataset.testid = 'bookItem';

    const title = document.createElement('h3');
    title.dataset.testid = 'bookItemTitle';
    title.textContent = book.title;

    const author = document.createElement('p');
    author.dataset.testid = 'bookItemAuthor';
    author.innerHTML = `<i class='bx bxs-user' style="color:var(--neon-cyan);margin-right:6px"></i>Penulis: ${book.author}`;

    const year = document.createElement('p');
    year.dataset.testid = 'bookItemYear';
    year.innerHTML = `<i class='bx bxs-calendar' style="color:var(--neon-magenta);margin-right:6px"></i>Tahun: ${book.year}`;

    const actions = document.createElement('div');
    actions.className = 'book-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.dataset.testid = 'bookItemIsCompleteButton';
    toggleBtn.className = book.isComplete ? 'btn btn-warning' : 'btn btn-success';
    toggleBtn.innerHTML = book.isComplete
      ? `<i class='bx bxs-book-reader'></i> Belum selesai`
      : `<i class='bx bxs-check-circle'></i> Selesai`;
    toggleBtn.addEventListener('click', async () => {
      await updateItem(BOOKS_API, book.id, { ...book, isComplete: !book.isComplete });
      await renderAll();
    });

    const editBtn = document.createElement('button');
    editBtn.dataset.testid = 'bookItemEditButton';
    editBtn.className = 'btn btn-edit';
    editBtn.innerHTML = `<i class='bx bxs-edit'></i> Edit`;
    editBtn.addEventListener('click', () => {
      editBookTitleInput.value = book.title;
      editBookAuthorInput.value = book.author;
      editBookYearInput.value = book.year;
      editBookIsCompleteInput.checked = book.isComplete;
      editingBookId = book.id;
      navigateTo('editBookSection');
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.dataset.testid = 'bookItemDeleteButton';
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.innerHTML = `<i class='bx bxs-trash'></i> Hapus`;
    deleteBtn.addEventListener('click', async () => {
      await deleteItem(BOOKS_API, book.id);
      await renderAll();
    });

    actions.append(toggleBtn, editBtn, deleteBtn);
    item.append(title, author, year, actions);
    return item;
  }

  // --- Film Element ---
  function createFilmElement(film) {
    const item = document.createElement('div');
    item.className = 'book-item';
    item.dataset.filmid = film.id;

    const title = document.createElement('h3');
    title.textContent = film.title;

    const director = document.createElement('p');
    director.innerHTML = `<i class='bx bxs-camera-movie' style="color:var(--neon-cyan);margin-right:6px"></i>Sutradara: ${film.director}`;

    const year = document.createElement('p');
    year.innerHTML = `<i class='bx bxs-calendar' style="color:var(--neon-magenta);margin-right:6px"></i>Tahun: ${film.year}`;

    const actions = document.createElement('div');
    actions.className = 'book-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = film.isComplete ? 'btn btn-warning' : 'btn btn-success';
    toggleBtn.innerHTML = film.isComplete
      ? `<i class='bx bxs-video-off'></i> Belum ditonton`
      : `<i class='bx bxs-check-circle'></i> Ditonton`;
    toggleBtn.addEventListener('click', async () => {
      await updateItem(FILMS_API, film.id, { ...film, isComplete: !film.isComplete });
      await renderAll();
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-edit';
    editBtn.innerHTML = `<i class='bx bxs-edit'></i> Edit`;
    editBtn.addEventListener('click', () => {
      editFilmTitleInput.value = film.title;
      editFilmDirectorInput.value = film.director;
      editFilmYearInput.value = film.year;
      editFilmIsCompleteInput.checked = film.isComplete;
      editingFilmId = film.id;
      navigateTo('editFilmSection');
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.innerHTML = `<i class='bx bxs-trash'></i> Hapus`;
    deleteBtn.addEventListener('click', async () => {
      await deleteItem(FILMS_API, film.id);
      await renderAll();
    });

    actions.append(toggleBtn, editBtn, deleteBtn);
    item.append(title, director, year, actions);
    return item;
  }

  // ============================================
  // Render All
  // ============================================
  async function renderAll() {
    const books = await fetchItems(BOOKS_API);
    const films = await fetchItems(FILMS_API);

    const incBooks = books.filter(b => !b.isComplete);
    const comBooks = books.filter(b => b.isComplete);
    const incFilms = films.filter(f => !f.isComplete);
    const comFilms = films.filter(f => f.isComplete);

    // Dashboard stats
    totalBooksEl.textContent = books.length;
    incompleteBookCountEl.textContent = incBooks.length;
    completeBookCountEl.textContent = comBooks.length;
    totalFilmsEl.textContent = films.length;
    incompleteFilmCountEl.textContent = incFilms.length;
    completeFilmCountEl.textContent = comFilms.length;

    // Books
    incompleteBookList.innerHTML = '';
    completeBookList.innerHTML = '';
    recentBooks.innerHTML = '';

    if (incBooks.length === 0) incompleteBookList.appendChild(createEmptyState('Belum ada buku di rak ini.'));
    else incBooks.forEach(b => incompleteBookList.appendChild(createBookElement(b)));

    if (comBooks.length === 0) completeBookList.appendChild(createEmptyState('Belum ada buku yang selesai dibaca.'));
    else comBooks.forEach(b => completeBookList.appendChild(createBookElement(b)));

    const recentBookList = books.slice(0, 4);
    if (recentBookList.length === 0) recentBooks.appendChild(createEmptyState('Belum ada buku.'));
    else recentBookList.forEach(b => recentBooks.appendChild(createBookElement(b)));

    // Films
    incompleteFilmList.innerHTML = '';
    completeFilmList.innerHTML = '';
    recentFilms.innerHTML = '';

    if (incFilms.length === 0) incompleteFilmList.appendChild(createEmptyState('Belum ada film di rak ini.'));
    else incFilms.forEach(f => incompleteFilmList.appendChild(createFilmElement(f)));

    if (comFilms.length === 0) completeFilmList.appendChild(createEmptyState('Belum ada film yang sudah ditonton.'));
    else comFilms.forEach(f => completeFilmList.appendChild(createFilmElement(f)));

    const recentFilmList = films.slice(0, 4);
    if (recentFilmList.length === 0) recentFilms.appendChild(createEmptyState('Belum ada film.'));
    else recentFilmList.forEach(f => recentFilms.appendChild(createFilmElement(f)));
  }

  // ============================================
  // Event Handlers — Books
  // ============================================
  bookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newBook = {
      id: +new Date(),
      title: bookTitleInput.value,
      author: bookAuthorInput.value,
      year: Number(bookYearInput.value),
      isComplete: bookIsCompleteInput.checked,
    };
    const result = await addItem(BOOKS_API, newBook);
    if (result) {
      await renderAll();
      bookForm.reset();
      navigateTo(result.isComplete ? 'completeBookSection' : 'incompleteBookSection');
    }
  });

  editBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (editingBookId !== null) {
      const data = {
        title: editBookTitleInput.value,
        author: editBookAuthorInput.value,
        year: Number(editBookYearInput.value),
        isComplete: editBookIsCompleteInput.checked,
      };
      const result = await updateItem(BOOKS_API, editingBookId, data);
      if (result) {
        await renderAll();
        editBookForm.reset();
        editingBookId = null;
        navigateTo('dashboardSection');
      }
    }
  });

  editBookFormCancel.addEventListener('click', () => {
    editBookForm.reset();
    editingBookId = null;
    navigateTo('dashboardSection');
  });

  searchBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const books = await fetchItems(BOOKS_API, searchBookTitleInput.value);
    searchBookResults.innerHTML = '';
    if (books.length === 0) searchBookResults.appendChild(createEmptyState('Buku tidak ditemukan.'));
    else books.forEach(b => searchBookResults.appendChild(createBookElement(b)));
  });

  // ============================================
  // Event Handlers — Films
  // ============================================
  filmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newFilm = {
      id: +new Date(),
      title: filmTitleInput.value,
      director: filmDirectorInput.value,
      year: Number(filmYearInput.value),
      isComplete: filmIsCompleteInput.checked,
    };
    const result = await addItem(FILMS_API, newFilm);
    if (result) {
      await renderAll();
      filmForm.reset();
      navigateTo(result.isComplete ? 'completeFilmSection' : 'incompleteFilmSection');
    }
  });

  editFilmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (editingFilmId !== null) {
      const data = {
        title: editFilmTitleInput.value,
        director: editFilmDirectorInput.value,
        year: Number(editFilmYearInput.value),
        isComplete: editFilmIsCompleteInput.checked,
      };
      const result = await updateItem(FILMS_API, editingFilmId, data);
      if (result) {
        await renderAll();
        editFilmForm.reset();
        editingFilmId = null;
        navigateTo('dashboardSection');
      }
    }
  });

  editFilmFormCancel.addEventListener('click', () => {
    editFilmForm.reset();
    editingFilmId = null;
    navigateTo('dashboardSection');
  });

  searchFilmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const films = await fetchItems(FILMS_API, searchFilmTitleInput.value);
    searchFilmResults.innerHTML = '';
    if (films.length === 0) searchFilmResults.appendChild(createEmptyState('Film tidak ditemukan.'));
    else films.forEach(f => searchFilmResults.appendChild(createFilmElement(f)));
  });

  // ============================================
  // Initial Render
  // ============================================
  renderAll();
});

document.addEventListener('DOMContentLoaded', () => {
  // Semua manipulasi DOM ditempatkan di sini

  // Mendapatkan elemen-elemen form untuk menambah buku
  const bookForm = document.getElementById('bookForm');
  const bookTitleInput = document.getElementById('bookFormTitle');
  const bookAuthorInput = document.getElementById('bookFormAuthor');
  const bookYearInput = document.getElementById('bookFormYear');
  const bookIsCompleteInput = document.getElementById('bookFormIsComplete');

  // Mendapatkan elemen-elemen form untuk mengedit buku
  const editBookForm = document.getElementById('editBookForm');
  const editBookTitleInput = document.getElementById('editBookFormTitle');
  const editBookAuthorInput = document.getElementById('editBookFormAuthor');
  const editBookYearInput = document.getElementById('editBookFormYear');
  const editBookIsCompleteInput = document.getElementById('editBookFormIsComplete');
  const editBookFormCancel = document.getElementById('editBookFormCancel');

  // Mendapatkan elemen untuk daftar buku yang belum selesai dibaca dan yang selesai dibaca
  const incompleteBookList = document.getElementById('incompleteBookList');
  const completeBookList = document.getElementById('completeBookList');

  // Mendapatkan elemen-elemen form untuk pencarian buku
  const searchBookForm = document.getElementById('searchBook');
  const searchBookTitleInput = document.getElementById('searchBookTitle');

  // Mendefinisikan kunci untuk menyimpan data buku di localStorage
  const BOOKS_KEY = 'books';
  let editingBookId = null; // ID buku yang sedang diedit

  // Fungsi untuk mengambil data buku dari localStorage
  function getBooks() {
    // Mengambil data dari localStorage menggunakan kunci BOOKS_KEY
    // Jika tidak ada data yang ditemukan, mengembalikan array kosong
    return JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  }

  // Fungsi untuk menyimpan data buku ke dalam localStorage
  function saveBooks(books) {
    // Mengubah objek buku menjadi string JSON dan menyimpannya ke localStorage
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  }

  // Fungsi untuk membuat elemen buku baru di DOM
  function createBookElement(book) {
    // Membuat elemen div untuk item buku
    const bookItem = document.createElement('div');
    bookItem.dataset.bookid = book.id;
    bookItem.dataset.testid = 'bookItem';

    // Membuat elemen h3 untuk judul buku
    const bookTitle = document.createElement('h3');
    bookTitle.dataset.testid = 'bookItemTitle';
    bookTitle.textContent = book.title;

    // Membuat elemen p untuk penulis buku
    const bookAuthor = document.createElement('p');
    bookAuthor.dataset.testid = 'bookItemAuthor';
    bookAuthor.textContent = `Penulis: ${book.author}`;

    // Membuat elemen p untuk tahun buku
    const bookYear = document.createElement('p');
    bookYear.dataset.testid = 'bookItemYear';
    bookYear.textContent = `Tahun: ${book.year}`;
    console.log(`Tahun: ${book.year}, Tipe Data: ${typeof book.year}`); // Menampilkan tipe data tahun

    // Membuat container untuk tombol-tombol tindakan
    const buttonContainer = document.createElement('div');

    // Membuat tombol untuk mengubah status buku (selesai/belum selesai dibaca)
    const isCompleteButton = document.createElement('button');
    isCompleteButton.dataset.testid = 'bookItemIsCompleteButton';
    isCompleteButton.textContent = book.isComplete ? 'Belum selesai dibaca' : 'Selesai dibaca';
    isCompleteButton.addEventListener('click', () => toggleBookComplete(book.id));

    // Membuat tombol untuk menghapus buku
    const deleteButton = document.createElement('button');
    deleteButton.dataset.testid = 'bookItemDeleteButton';
    deleteButton.textContent = 'Hapus Buku';
    deleteButton.addEventListener('click', () => deleteBook(book.id));

    // Membuat tombol untuk mengedit buku
    const editButton = document.createElement('button');
    editButton.dataset.testid = 'bookItemEditButton';
    editButton.textContent = 'Edit Buku';
    editButton.addEventListener('click', () => loadBookForEdit(book.id));

    // Menambahkan tombol-tombol ke dalam container tombol
    buttonContainer.appendChild(isCompleteButton);
    buttonContainer.appendChild(deleteButton);
    buttonContainer.appendChild(editButton);

    // Menambahkan elemen-elemen buku ke dalam elemen div item buku
    bookItem.appendChild(bookTitle);
    bookItem.appendChild(bookAuthor);
    bookItem.appendChild(bookYear);
    bookItem.appendChild(buttonContainer);

    // Mengembalikan elemen div item buku yang telah dibuat
    return bookItem;
  }

  // Fungsi untuk merender buku-buku dalam DOM
  function renderBooks() {
    // Mengosongkan daftar buku yang belum selesai dibaca dan yang selesai dibaca
    incompleteBookList.innerHTML = '';
    completeBookList.innerHTML = '';

    // Mengambil data buku dari localStorage
    const books = getBooks();
    books.forEach(book => {
      const bookElement = createBookElement(book);
      // Menambahkan buku ke daftar yang sesuai berdasarkan status
      if (book.isComplete) {
        completeBookList.appendChild(bookElement);
      } else {
        incompleteBookList.appendChild(bookElement);
      }
    });
  }

  // Fungsi untuk menambah buku baru
  function addBook(event) {
    event.preventDefault(); // Mencegah form dari pengiriman default

    const books = getBooks();
    const newBook = {
      id: +new Date(), // Menggunakan timestamp sebagai ID unik
      title: bookTitleInput.value,
      author: bookAuthorInput.value,
      year: Number(bookYearInput.value), // Ubah tahun menjadi number
      isComplete: bookIsCompleteInput.checked,
    };
    books.push(newBook); // Menambahkan buku baru ke array buku
    saveBooks(books); // Menyimpan buku ke localStorage
    renderBooks(); // Merender ulang buku-buku
    bookForm.reset(); // Mereset form input
  }

  // Fungsi untuk mengedit buku yang ada
  function editBook(event) {
    event.preventDefault(); // Mencegah form dari pengiriman default

    if (editingBookId !== null) {
      const books = getBooks();
      const bookIndex = books.findIndex(book => book.id === editingBookId);
      if (bookIndex !== -1) {
        // Memperbarui detail buku
        books[bookIndex].title = editBookTitleInput.value;
        books[bookIndex].author = editBookAuthorInput.value;
        books[bookIndex].year = Number(editBookYearInput.value); // Ubah tahun menjadi number
        books[bookIndex].isComplete = editBookIsCompleteInput.checked;
        saveBooks(books); // Menyimpan perubahan buku ke localStorage
        renderBooks(); // Merender ulang buku-buku
        editBookForm.reset(); // Mereset form edit
        editingBookId = null; // Mengatur ID buku yang sedang diedit ke null
        editBookForm.style.display = 'none'; // Menyembunyikan form edit
      }
    }
  }

  // Fungsi untuk mengubah status buku (selesai/belum selesai dibaca)
  function toggleBookComplete(bookId) {
    const books = getBooks();
    const bookIndex = books.findIndex(book => book.id === bookId);
    if (bookIndex !== -1) {
      // Mengubah status buku
      books[bookIndex].isComplete = !books[bookIndex].isComplete;
      saveBooks(books); // Menyimpan perubahan ke localStorage
      renderBooks(); // Merender ulang buku-buku
    }
  }

  // Fungsi untuk menghapus buku
  function deleteBook(bookId) {
    const books = getBooks();
    const filteredBooks = books.filter(book => book.id !== bookId); // Menghapus buku dari array
    saveBooks(filteredBooks); // Menyimpan perubahan ke localStorage
    renderBooks(); // Merender ulang buku-buku
  }

  // Fungsi untuk memuat data buku ke dalam form edit
  function loadBookForEdit(bookId) {
    const books = getBooks();
    const book = books.find(book => book.id === bookId);
    if (book) {
      // Mengisi form edit dengan data buku
      editBookTitleInput.value = book.title;
      editBookAuthorInput.value = book.author;
      editBookYearInput.value = book.year;
      editBookIsCompleteInput.checked = book.isComplete;
      editingBookId = bookId; // Menyimpan ID buku yang sedang diedit
      editBookForm.style.display = 'block'; // Menampilkan form edit
    }
  }

  // Fungsi untuk merender buku berdasarkan pencarian
  function renderBooks(books = getBooks()) {
    incompleteBookList.innerHTML = '';
    completeBookList.innerHTML = '';

    books.forEach(book => {
      const bookElement = createBookElement(book);
      if (book.isComplete) {
        completeBookList.appendChild(bookElement);
      } else {
        incompleteBookList.appendChild(bookElement);
      }
    });
  }

  // Debugging: Cek apakah elemen ditemukan
  if (!searchBookForm || !searchBookTitleInput) {
    console.error('Elemen form pencarian tidak ditemukan.');
    return;
  }

  // Fungsi untuk menangani pencarian buku
  function searchBooks(event) {
    event.preventDefault(); // Mencegah form dari pengiriman default

    const searchQuery = searchBookTitleInput.value.toLowerCase();
    const books = getBooks();
    const filteredBooks = books.filter(book => book.title.toLowerCase().includes(searchQuery));

    renderBooks(filteredBooks); // Merender buku yang sesuai dengan pencarian
  }

  // Menambahkan event listener untuk form tambah buku
  bookForm.addEventListener('submit', addBook);
  // Menambahkan event listener untuk form edit buku
  editBookForm.addEventListener('submit', editBook);
  // Menambahkan event listener untuk tombol batal edit buku
  editBookFormCancel.addEventListener('click', () => {
    editBookForm.reset(); // Mereset form edit
    editBookForm.style.display = 'none'; // Menyembunyikan form edit
    editingBookId = null; // Mengatur ID buku yang sedang diedit ke null
  });


    // Menambahkan event listener untuk form pencarian
    searchBookForm.addEventListener('submit', searchBooks);

  // Merender buku-buku yang ada saat halaman dimuat
  renderBooks();
});

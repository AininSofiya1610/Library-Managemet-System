export type BookStatus = 'available' | 'borrowed' | 'reserved';
export type BookCategory = 'Fiction' | 'Non-Fiction' | 'Science' | 'History' | 'Technology' | 'Arts' | 'Biography' | 'Other';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  year: number;
  copies: number;
  availableCopies: number;
  status: BookStatus;
  cover?: string;
  description?: string;
  addedAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  borrowedBooks: string[];
  totalBorrowed: number;
  status: 'active' | 'suspended';
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  memberId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: 'active' | 'returned' | 'overdue';
}

const SEED_BOOKS: Book[] = [
  { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0-7432-7356-5', category: 'Fiction', year: 1925, copies: 3, availableCopies: 2, status: 'available', description: 'A story of the mysteriously wealthy Jay Gatsby and his love for Daisy Buchanan.', addedAt: new Date().toISOString() },
  { id: '2', title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '978-0-06-231609-7', category: 'History', year: 2011, copies: 2, availableCopies: 0, status: 'borrowed', description: 'A brief history of humankind from the Stone Age to the present.', addedAt: new Date().toISOString() },
  { id: '3', title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0-13-235088-4', category: 'Technology', year: 2008, copies: 4, availableCopies: 3, status: 'available', description: 'A handbook of agile software craftsmanship.', addedAt: new Date().toISOString() },
  { id: '4', title: '1984', author: 'George Orwell', isbn: '978-0-45-228285-3', category: 'Fiction', year: 1949, copies: 5, availableCopies: 4, status: 'available', description: 'A dystopian social science fiction novel.', addedAt: new Date().toISOString() },
  { id: '5', title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-0-55-305505-5', category: 'Science', year: 1988, copies: 2, availableCopies: 1, status: 'available', description: 'From the Big Bang to Black Holes.', addedAt: new Date().toISOString() },
];

const SEED_MEMBERS: Member[] = [
  { id: '1', name: 'Ahmad Razali', email: 'ahmad@email.com', phone: '012-3456789', joinedAt: new Date().toISOString(), borrowedBooks: ['2'], totalBorrowed: 5, status: 'active' },
  { id: '2', name: 'Siti Nurhaliza', email: 'siti@email.com', phone: '011-9876543', joinedAt: new Date().toISOString(), borrowedBooks: [], totalBorrowed: 3, status: 'active' },
];

const SEED_RECORDS: BorrowRecord[] = [
  { id: '1', bookId: '2', memberId: '1', borrowedAt: new Date(Date.now() - 7 * 86400000).toISOString(), dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), status: 'active' },
];

function getStorage<T>(key: string, seed: T[]): T[] {
  if (typeof window === 'undefined') return seed;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  } catch { return seed; }
}

function setStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

export const db = {
  getBooks: () => getStorage<Book>('lms_books', SEED_BOOKS),
  setBooks: (books: Book[]) => setStorage('lms_books', books),
  getMembers: () => getStorage<Member>('lms_members', SEED_MEMBERS),
  setMembers: (members: Member[]) => setStorage('lms_members', members),
  getRecords: () => getStorage<BorrowRecord>('lms_records', SEED_RECORDS),
  setRecords: (records: BorrowRecord[]) => setStorage('lms_records', records),

  addBook: (book: Omit<Book, 'id' | 'addedAt' | 'status' | 'availableCopies'>) => {
    const books = db.getBooks();
    const newBook: Book = { ...book, id: Date.now().toString(), addedAt: new Date().toISOString(), availableCopies: book.copies, status: 'available' };
    db.setBooks([...books, newBook]);
    return newBook;
  },

  deleteBook: (id: string) => {
    db.setBooks(db.getBooks().filter(b => b.id !== id));
  },

  addMember: (member: Omit<Member, 'id' | 'joinedAt' | 'borrowedBooks' | 'totalBorrowed'>) => {
    const members = db.getMembers();
    const newMember: Member = { ...member, id: Date.now().toString(), joinedAt: new Date().toISOString(), borrowedBooks: [], totalBorrowed: 0 };
    db.setMembers([...members, newMember]);
    return newMember;
  },

  deleteMember: (id: string) => {
    db.setMembers(db.getMembers().filter(m => m.id !== id));
  },

  borrowBook: (bookId: string, memberId: string) => {
    const books = db.getBooks();
    const members = db.getMembers();
    const book = books.find(b => b.id === bookId);
    const member = members.find(m => m.id === memberId);
    if (!book || !member || book.availableCopies === 0) return false;

    book.availableCopies--;
    book.status = book.availableCopies === 0 ? 'borrowed' : 'available';
    member.borrowedBooks.push(bookId);
    member.totalBorrowed++;

    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString();
    const record: BorrowRecord = { id: Date.now().toString(), bookId, memberId, borrowedAt: new Date().toISOString(), dueDate, status: 'active' };
    db.setBooks(books);
    db.setMembers(members);
    db.setRecords([...db.getRecords(), record]);
    return true;
  },

  returnBook: (recordId: string) => {
    const records = db.getRecords();
    const record = records.find(r => r.id === recordId);
    if (!record || record.status === 'returned') return false;

    record.status = 'returned';
    record.returnedAt = new Date().toISOString();

    const books = db.getBooks();
    const book = books.find(b => b.id === record.bookId);
    if (book) { book.availableCopies++; book.status = 'available'; }

    const members = db.getMembers();
    const member = members.find(m => m.id === record.memberId);
    if (member) member.borrowedBooks = member.borrowedBooks.filter(id => id !== record.bookId);

    db.setRecords(records);
    db.setBooks(books);
    db.setMembers(members);
    return true;
  },

  getStats: () => {
    const books = db.getBooks();
    const members = db.getMembers();
    const records = db.getRecords();
    const now = new Date();
    return {
      totalBooks: books.reduce((s, b) => s + b.copies, 0),
      availableBooks: books.reduce((s, b) => s + b.availableCopies, 0),
      totalMembers: members.length,
      activeMembers: members.filter(m => m.status === 'active').length,
      activeBorrows: records.filter(r => r.status === 'active').length,
      overdueBooks: records.filter(r => r.status === 'active' && new Date(r.dueDate) < now).length,
    };
  },
};

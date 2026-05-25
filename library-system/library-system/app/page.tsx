'use client';
import { useState, useEffect, useCallback } from 'react';
import { db, Book, Member, BorrowRecord, BookCategory } from '@/lib/store';

type View = 'dashboard' | 'books' | 'members' | 'borrows';

const CATEGORIES: BookCategory[] = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Technology', 'Arts', 'Biography', 'Other'];

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: color, borderRadius: '12px 0 0 12px' }} />
      <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 38, fontWeight: 700, fontFamily: 'Playfair Display, serif', color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>&#x2715;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' };
const btnPrimary: React.CSSProperties = { background: 'var(--accent)', color: '#0f0e0b', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'DM Sans, sans-serif' };
const btnDanger: React.CSSProperties = { background: 'transparent', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif' };

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [stats, setStats] = useState({ totalBooks: 0, availableBooks: 0, totalMembers: 0, activeMembers: 0, activeBorrows: 0, overdueBooks: 0 });
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'addBook' | 'addMember' | 'borrow' | 'bookDetail' | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: 'Fiction' as BookCategory, year: new Date().getFullYear(), copies: 1, description: '' });
  const [memberForm, setMemberForm] = useState({ name: '', email: '', phone: '', status: 'active' as const });
  const [borrowForm, setBorrowForm] = useState({ bookId: '', memberId: '' });

  const refresh = useCallback(() => {
    setBooks(db.getBooks());
    setMembers(db.getMembers());
    setRecords(db.getRecords());
    setStats(db.getStats());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.isbn.includes(search)
  );

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeRecords = records.filter(r => r.status === 'active');

  const handleAddBook = () => {
    if (!bookForm.title || !bookForm.author || !bookForm.isbn) return showToast('Fill all required fields', 'error');
    db.addBook(bookForm);
    refresh();
    setModal(null);
    setBookForm({ title: '', author: '', isbn: '', category: 'Fiction', year: new Date().getFullYear(), copies: 1, description: '' });
    showToast('Book added successfully');
  };

  const handleAddMember = () => {
    if (!memberForm.name || !memberForm.email) return showToast('Fill all required fields', 'error');
    db.addMember(memberForm);
    refresh();
    setModal(null);
    setMemberForm({ name: '', email: '', phone: '', status: 'active' });
    showToast('Member added successfully');
  };

  const handleBorrow = () => {
    if (!borrowForm.bookId || !borrowForm.memberId) return showToast('Select book and member', 'error');
    const ok = db.borrowBook(borrowForm.bookId, borrowForm.memberId);
    if (ok) { refresh(); setModal(null); setBorrowForm({ bookId: '', memberId: '' }); showToast('Book borrowed successfully'); }
    else showToast('Failed — no available copies', 'error');
  };

  const handleReturn = (recordId: string) => {
    db.returnBook(recordId);
    refresh();
    showToast('Book returned');
  };

  const navItems: { key: View; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '◈' },
    { key: 'books', label: 'Books', icon: '◫' },
    { key: 'members', label: 'Members', icon: '◎' },
    { key: 'borrows', label: 'Borrows', icon: '◷' },
  ];

  const borrowsFilter = view === 'borrows' ? search : '';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '32px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 24px 32px' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: 'var(--accent)', letterSpacing: '-0.02em' }}>Librarium</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.08em' }}>MANAGEMENT SYSTEM</div>
        </div>
        {navItems.map(n => (
          <button key={n.key} onClick={() => { setView(n.key); setSearch(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', background: view === n.key ? 'var(--surface2)' : 'none', border: 'none', borderLeft: view === n.key ? '2px solid var(--accent)' : '2px solid transparent', color: view === n.key ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 14, fontWeight: view === n.key ? 600 : 400, textAlign: 'left', fontFamily: 'DM Sans, sans-serif' }}>
            <span style={{ fontSize: 16 }}>{n.icon}</span>{n.label}
          </button>
        ))}
        <div style={{ marginTop: 'auto', padding: '0 24px' }}>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, fontSize: 11, color: 'var(--text-muted)' }}>
            <div>{books.length} book titles</div>
            <div>{members.length} members</div>
          </div>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 600 }}>
            {navItems.find(n => n.key === view)?.label}
          </h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {(view === 'books' || view === 'members') && (
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${view}...`}
                style={{ ...inputStyle, width: 220, padding: '8px 14px' }} />
            )}
            {view === 'books' && <button onClick={() => setModal('addBook')} style={btnPrimary}>+ Add Book</button>}
            {view === 'members' && <button onClick={() => setModal('addMember')} style={btnPrimary}>+ Add Member</button>}
            {view === 'borrows' && <button onClick={() => setModal('borrow')} style={btnPrimary}>+ New Borrow</button>}
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
          {view === 'dashboard' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                <StatCard label="Total Books" value={stats.totalBooks} sub={`${stats.availableBooks} available`} color="var(--accent)" />
                <StatCard label="Members" value={stats.totalMembers} sub={`${stats.activeMembers} active`} color="var(--blue)" />
                <StatCard label="Active Borrows" value={stats.activeBorrows} color="var(--green)" />
                <StatCard label="Overdue" value={stats.overdueBooks} sub={stats.overdueBooks > 0 ? 'Needs attention' : 'All on time'} color="var(--red)" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: 16, fontSize: 18 }}>Active Borrows</h3>
                  {activeRecords.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No active borrows</div>
                  ) : activeRecords.slice(0, 5).map(r => {
                    const book = books.find(b => b.id === r.bookId);
                    const member = members.find(m => m.id === r.memberId);
                    const overdue = new Date(r.dueDate) < new Date();
                    return (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{book?.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member?.name}</div>
                        </div>
                        <div style={{ fontSize: 12, color: overdue ? 'var(--red)' : 'var(--text-muted)', textAlign: 'right' }}>
                          {overdue ? 'Overdue' : `Due ${new Date(r.dueDate).toLocaleDateString()}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: 16, fontSize: 18 }}>Books by Category</h3>
                  {CATEGORIES.map(cat => {
                    const count = books.filter(b => b.category === cat).length;
                    if (!count) return null;
                    const pct = Math.round((count / Math.max(books.length, 1)) * 100);
                    return (
                      <div key={cat} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span>{cat}</span><span style={{ color: 'var(--text-muted)' }}>{count}</span>
                        </div>
                        <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 4 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {view === 'books' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {filteredBooks.map(book => (
                  <div key={book.id}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    onClick={() => { setSelectedBook(book); setModal('bookDetail'); }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ fontSize: 11, background: 'var(--surface2)', padding: '3px 8px', borderRadius: 20, color: 'var(--text-muted)' }}>{book.category}</div>
                      <div style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: book.availableCopies > 0 ? 'rgba(76,156,106,0.15)' : 'rgba(201,76,76,0.15)', color: book.availableCopies > 0 ? 'var(--green)' : 'var(--red)' }}>
                        {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Borrowed'}
                      </div>
                    </div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, marginBottom: 4, lineHeight: 1.3 }}>{book.title}</h3>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{book.author} &middot; {book.year}</div>
                    {book.description && <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.description}</div>}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ISBN: {book.isbn} &middot; {book.copies} {book.copies === 1 ? 'copy' : 'copies'}</div>
                  </div>
                ))}
                {filteredBooks.length === 0 && <div style={{ color: 'var(--text-muted)', padding: 24 }}>No books found</div>}
              </div>
            </div>
          )}

          {view === 'members' && (
            <div className="fade-in" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Name', 'Email', 'Phone', 'Joined', 'Total Borrowed', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '14px 16px', fontWeight: 500 }}>{m.name}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 14 }}>{m.email}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 14 }}>{m.phone || '—'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 13 }}>{new Date(m.joinedAt).toLocaleDateString()}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14 }}>{m.totalBorrowed}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: m.status === 'active' ? 'rgba(76,156,106,0.15)' : 'rgba(201,76,76,0.15)', color: m.status === 'active' ? 'var(--green)' : 'var(--red)' }}>{m.status}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button onClick={() => { if (window.confirm('Delete this member?')) { db.deleteMember(m.id); refresh(); showToast('Member deleted'); } }} style={btnDanger}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMembers.length === 0 && <div style={{ color: 'var(--text-muted)', padding: 24 }}>No members found</div>}
            </div>
          )}

          {view === 'borrows' && (
            <div className="fade-in">
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                {(['active', 'returned'] as const).map(s => (
                  <button key={s} onClick={() => setSearch(s)} style={{ padding: '8px 18px', borderRadius: 20, border: '1px solid var(--border)', background: search === s ? 'var(--accent)' : 'var(--surface)', color: search === s ? '#0f0e0b' : 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif', fontWeight: search === s ? 600 : 400 }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
                <button onClick={() => setSearch('')} style={{ padding: '8px 18px', borderRadius: 20, border: '1px solid var(--border)', background: !search ? 'var(--accent)' : 'var(--surface)', color: !search ? '#0f0e0b' : 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif', fontWeight: !search ? 600 : 400 }}>All</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Book', 'Member', 'Borrowed', 'Due Date', 'Status', 'Action'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.filter(r => !borrowsFilter || r.status === borrowsFilter).map(r => {
                      const book = books.find(b => b.id === r.bookId);
                      const member = members.find(m => m.id === r.memberId);
                      const overdue = r.status === 'active' && new Date(r.dueDate) < new Date();
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '14px 16px', fontWeight: 500 }}>{book?.title || 'Unknown'}</td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{member?.name || 'Unknown'}</td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{new Date(r.borrowedAt).toLocaleDateString()}</td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: overdue ? 'var(--red)' : 'var(--text-muted)' }}>
                            {overdue ? '⚠ ' : ''}{new Date(r.dueDate).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: r.status === 'returned' ? 'rgba(76,156,106,0.15)' : overdue ? 'rgba(201,76,76,0.15)' : 'rgba(201,168,76,0.15)', color: r.status === 'returned' ? 'var(--green)' : overdue ? 'var(--red)' : 'var(--accent)' }}>
                              {r.status === 'returned' ? 'returned' : overdue ? 'overdue' : 'active'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {r.status === 'active' && (
                              <button onClick={() => handleReturn(r.id)} style={{ ...btnPrimary, padding: '6px 14px', fontSize: 13 }}>Return</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.type === 'success' ? 'var(--green)' : 'var(--red)', color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}

      {modal === 'addBook' && (
        <Modal title="Add New Book" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(['title', 'author', 'isbn', 'description'] as const).map(k => (
              <div key={k}>
                <label style={labelStyle}>{k === 'isbn' ? 'ISBN *' : k === 'description' ? 'Description' : k.charAt(0).toUpperCase() + k.slice(1) + ' *'}</label>
                <input type="text" value={bookForm[k]} onChange={e => setBookForm(f => ({ ...f, [k]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={bookForm.category} onChange={e => setBookForm(f => ({ ...f, category: e.target.value as BookCategory }))} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Year</label>
                <input type="number" value={bookForm.year} onChange={e => setBookForm(f => ({ ...f, year: +e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Copies</label>
                <input type="number" min={1} value={bookForm.copies} onChange={e => setBookForm(f => ({ ...f, copies: +e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <button onClick={handleAddBook} style={{ ...btnPrimary, marginTop: 8 }}>Add Book</button>
          </div>
        </Modal>
      )}

      {modal === 'addMember' && (
        <Modal title="Add New Member" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(['name', 'email', 'phone'] as const).map(k => (
              <div key={k}>
                <label style={labelStyle}>{k.charAt(0).toUpperCase() + k.slice(1)}{k !== 'phone' ? ' *' : ''}</label>
                <input type={k === 'email' ? 'email' : 'text'} value={memberForm[k]} onChange={e => setMemberForm(f => ({ ...f, [k]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            <button onClick={handleAddMember} style={{ ...btnPrimary, marginTop: 8 }}>Add Member</button>
          </div>
        </Modal>
      )}

      {modal === 'borrow' && (
        <Modal title="Borrow a Book" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Select Book</label>
              <select value={borrowForm.bookId} onChange={e => setBorrowForm(f => ({ ...f, bookId: e.target.value }))} style={inputStyle}>
                <option value="">— Choose book —</option>
                {books.filter(b => b.availableCopies > 0).map(b => (
                  <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} available)</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Select Member</label>
              <select value={borrowForm.memberId} onChange={e => setBorrowForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
                <option value="">— Choose member —</option>
                {members.filter(m => m.status === 'active').map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--text-muted)' }}>
              Due date will be set to <strong style={{ color: 'var(--text)' }}>14 days</strong> from today
            </div>
            <button onClick={handleBorrow} style={{ ...btnPrimary, marginTop: 8 }}>Confirm Borrow</button>
          </div>
        </Modal>
      )}

      {modal === 'bookDetail' && selectedBook && (
        <Modal title={selectedBook.title} onClose={() => { setModal(null); setSelectedBook(null); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 12, background: 'var(--surface2)', padding: '3px 10px', borderRadius: 20, color: 'var(--text-muted)' }}>{selectedBook.category}</span>
              <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: selectedBook.availableCopies > 0 ? 'rgba(76,156,106,0.15)' : 'rgba(201,76,76,0.15)', color: selectedBook.availableCopies > 0 ? 'var(--green)' : 'var(--red)' }}>
                {selectedBook.availableCopies > 0 ? `${selectedBook.availableCopies} available` : 'All borrowed'}
              </span>
            </div>
            <div style={{ fontSize: 16, color: 'var(--text-muted)' }}>by {selectedBook.author}</div>
            {selectedBook.description && <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{selectedBook.description}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              {[['ISBN', selectedBook.isbn], ['Year', String(selectedBook.year)], ['Total Copies', String(selectedBook.copies)], ['Available', String(selectedBook.availableCopies)]].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {selectedBook.availableCopies > 0 && (
                <button onClick={() => { setModal('borrow'); setBorrowForm(f => ({ ...f, bookId: selectedBook.id })); }} style={btnPrimary}>Borrow This Book</button>
              )}
              <button onClick={() => { if (window.confirm('Delete this book?')) { db.deleteBook(selectedBook.id); refresh(); setModal(null); showToast('Book deleted'); } }} style={btnDanger}>Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

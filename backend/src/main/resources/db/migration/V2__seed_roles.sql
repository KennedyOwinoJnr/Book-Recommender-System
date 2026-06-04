-- Seed roles
INSERT INTO roles (name) VALUES ('ROLE_SUPER_ADMIN');
INSERT INTO roles (name) VALUES ('ROLE_ADMIN');
INSERT INTO roles (name) VALUES ('ROLE_LIBRARIAN');
INSERT INTO roles (name) VALUES ('ROLE_MEMBER');

-- Create indexes for performance optimization
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_ratings_user ON book_ratings(user_id);
CREATE INDEX idx_ratings_book ON book_ratings(book_id);
CREATE INDEX idx_borrowings_user ON borrowings(user_id);
CREATE INDEX idx_borrowings_status ON borrowings(status);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_status ON reservations(status);

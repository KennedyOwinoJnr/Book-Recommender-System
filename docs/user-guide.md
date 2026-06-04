# Library System Operations & User Guide

This guide outlines user workflows, librarian workflows, admin panels, and SMTP validation testing.

---

## 1. SMTP Email Verification & Testing (Mailpit)

We configured a mock SMTP testing server called **Mailpit** to handle email verification and password resets locally. No real emails will leave the docker network.

### Testing the Registration Flow
1. Open the app in your browser at `http://localhost:3000`.
2. Click **Register** and complete the form.
3. Upon submitting, the app will show a message instructing you to verify your email.
4. To view the verification email, open **Mailpit Web UI** in a new browser tab:
   - **Mailpit URL**: `http://localhost:8025`
5. You will see a new email in the inbox from `noreply@tomrec-library.com`.
6. Click the verification link in the email body:
   - Example: `http://localhost:3000/verify-email?token=...`
7. You will be redirected to the login page with a success message: **"Email verified successfully! You can now log in."**

---

## 2. Standard Reader (Member) Workflow

### 1. The Personal Portal
Upon logging in, you enter the portal.
- **Top Picks**: Shows 6 book recommendations compiled by SVD collaborative and TF-IDF content filters based on your history.
- **Collaborative Predictions**: Displays books that other readers with similar tastes rated highly.
- **Dashboard Stats**: Displays your active borrowing counts (maximum 5), active holds, and unpaid penalties.

### 2. Catalog Search & Discovery
- Open **Search Catalog** in the navigation panel.
- Search titles/authors or filter tags.
- Click a book to open the details modal showing stock status and detailed synopses.

### 3. Borrowing & Reserving Books
- If a book is in stock, click **Borrow Book**. The book is added to your loans and availability stock is decremented.
- If out of stock, the button changes to **Reserve Book / Place Hold**. Click it to place a hold. When another user checks in the book, it is assigned to you.

### 4. Ratings
- In the details modal, select a rating from `0` to `10` and click **Rate**. Ratings help retrain the collaborative SVD models.

---

## 3. Librarian / Desk Circulation Workflow

Users with the `ROLE_LIBRARIAN` role have access to desk options.

### 1. Inventory Master
Librarians can perform CRUD catalog operations:
- **Add Book**: Fill out ISBN, title, author, year, page count, categories, and cover images to register a title.
- **Edit Book**: Update details or adjust stocks.
- **Delete Book**: Remove title from system catalog.

### 2. Circulation Desk (Loans Check-In)
- Displays all active/overdue loans in the library.
- Search loans by reader username or book title.
- When a reader returns a physical copy, click **Check In / Return**. The system updates stock and records overdue fines if returned past the due date.

---

## 4. Administrative Controls (Admin / Super Admin)

### 1. Reader Directory
Admins can manage members:
- Toggle **Suspend / Activate** to deactivate or reactivate user accounts.

### 2. Assigning Roles (Super Admin exclusive)
Super Admins can upgrade user accounts:
- Click **Roles** beside any user in the directory.
- Check role permissions (`SUPER_ADMIN`, `ADMIN`, `LIBRARIAN`, `MEMBER`) and click **Save Role Permissions** to apply updates instantly.

### 3. System Audit Logs (Super Admin exclusive)
- Review audit trails showing actor email, action (login, checkout, return, catalog edit), target, and timestamp details.

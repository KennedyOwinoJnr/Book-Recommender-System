# REST API Reference Guide

All API endpoints are structured under `/api/v1` and return JSON payloads.

---

## 1. Authentication (`/api/v1/auth`)

### Register User
- **Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Authentication**: None (Public)
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "Password@123",
    "firstName": "John",
    "lastName": "Doe",
    "location": "Nairobi, Kenya",
    "age": 25
  }
  ```
- **Response** (200 OK): Returns the registered user details DTO (without password hashes).

### Login User
- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Authentication**: None (Public)
- **Request Body**:
  ```json
  {
    "usernameOrEmail": "johndoe",
    "password": "Password@123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "type": "Bearer",
    "username": "johndoe",
    "email": "john@example.com",
    "roles": ["ROLE_MEMBER"]
  }
  ```

### Verify Email
- **Method**: `GET`
- **Path**: `/api/v1/auth/verify`
- **Authentication**: None
- **Query Parameters**: `token` (String)
- **Response** (200 OK): Maps a verification success message.

### Request Password Reset Link
- **Method**: `POST`
- **Path**: `/api/v1/auth/password-reset/request`
- **Request Body**: `{ "email": "john@example.com" }`

### Execute Password Reset
- **Method**: `POST`
- **Path**: `/api/v1/auth/password-reset/execute`
- **Request Body**: `{ "token": "UUID-token", "newPassword": "newSecretPassword" }`

---

## 2. Books & Catalog (`/api/v1/books`)

### Paginated Catalog Browse
- **Method**: `GET`
- **Path**: `/api/v1/books`
- **Authentication**: Required (Member / Librarian / Admin / Super Admin)
- **Query Parameters**:
  - `query` (optional) - Search title or author
  - `category` (optional) - Filter by tag
  - `page` (optional, default 0) - Page number
  - `size` (optional, default 20) - Page size
- **Response**: Spring Data Page structure containing arrays of `BookDto`.

### Book Details
- **Method**: `GET`
- **Path**: `/api/v1/books/{id}`
- **Response**: Detailed `BookDto`.

### Register / Edit / Delete Book
- **Methods**: `POST`, `PUT`, `DELETE`
- **Paths**: `/api/v1/books`, `/api/v1/books/{id}`
- **Authentication**: Required (`ROLE_LIBRARIAN`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)

### Rate Book
- **Method**: `POST`
- **Path**: `/api/v1/books/{id}/ratings`
- **Request Body**: `{ "rating": 9 }`

---

## 3. Circulation & Borrowings (`/api/v1/borrowings`)

### Checkout Book
- **Method**: `POST`
- **Path**: `/api/v1/borrowings`
- **Request Body**: `{ "bookId": 123 }`
- **Constraint**: Users are capped at 5 active loans. Fails if the book is out of stock.

### Return Book Check-in
- **Method**: `PUT`
- **Path**: `/api/v1/borrowings/{id}/return`
- **Authentication**: Required (`ROLE_LIBRARIAN`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)
- **Response**: Closed borrowing record showing calculated overdue fines (charged at $0.50 per day past the due date).

### Active Loans
- **Method**: `GET`
- **Path**: `/api/v1/borrowings/me/active`

---

## 4. Reservations & Holds (`/api/v1/reservations`)

### Place Hold
- **Method**: `POST`
- **Path**: `/api/v1/reservations`
- **Request Body**: `{ "bookId": 123 }`
- **Constraint**: Book must be currently out of stock.

### Cancel Hold
- **Method**: `POST`
- **Path**: `/api/v1/reservations/{id}/cancel`

---

## 5. Machine Learning Recommendations (`/api/v1/recommendations`)

### Hybrid Recommendations
- **Method**: `GET`
- **Path**: `/api/v1/recommendations/hybrid`
- **Authentication**: Required (`ROLE_MEMBER`)

### Collaborative Recommendations
- **Method**: `GET`
- **Path**: `/api/v1/recommendations/collaborative`

### Popular Books
- **Method**: `GET`
- **Path**: `/api/v1/recommendations/popular`
- **Authentication**: None (Public)

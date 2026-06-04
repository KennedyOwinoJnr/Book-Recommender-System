# System Architecture & Technical Specifications

This document outlines the technical architecture, data flow, and directory layouts of the modernized **Tomrec Library Management System**.

## Architectural Style
The system is built using a **Modular Layered Architecture** with clean separation of boundaries between backend logic, user interface representation, and machine learning computation.

```
                  ┌─────────────────────────┐
                  │   Client Side (React)   │
                  └────────────┬────────────┘
                               │ HTTP REST
                               ▼
                  ┌─────────────────────────┐
                  │  Spring Boot Backend    │
                  └──────┬─────────────┬────┘
                         │             │
                Postgres │             │ HTTP REST
                  Client │             │
                         ▼             ▼
                  ┌──────────┐  ┌───────────┐
                  │ Postgres │  │ Python ML │
                  │ Database │  │ Service   │
                  └──────────┘  └───────────┘
```

---

## 1. Directory Structure

- `backend/` — Core REST API and business operations written in Java Spring Boot 3.2.
- `frontend/` — Multi-dashboard single-page application built on React 18, Vite, and Lucide.
- `ml-service/` — Recommendation engine API built with Python FastAPI, exposing collaborative and hybrid SVD filters.
- `data/` — Holds the original CSV datasets (Books, Users, Ratings, apibooks) bind-mounted for automatic initialization.
- `Deployment/` — Houses pre-trained models (`svd.pkl`, `final_df.pkl`) loaded at startup by the Python service.

---

## 2. Technical Stack Details

### Core Backend (Java Spring Boot)
- **Framework**: Spring Boot 3.2.3, Spring Security 6, Spring Data JPA.
- **Database Migrations**: Flyway.
- **APIs**: Restful contracts using DTO structures with validation.
- **Security**: JSON Web Tokens (JWT) for authentication and Role-Based Access Control (RBAC).
- **Communication**: RestTemplate client for microservice requests.

### Core Frontend (React)
- **Framework**: React 18, Vite build runner, React Router v6.
- **Icons**: Lucide React.
- **CSS**: Responsive dark-mode styling with glassmorphism and CSS variables.
- **HTTP client**: Axios instance wrapping tokens and auto-login expiration handlers.

### Machine Learning Service (Python FastAPI)
- **Framework**: FastAPI with Uvicorn.
- **Models**: scikit-surprise (SVD models), scikit-learn (TF-IDF vectorizer + Cosine Similarity matrix).
- **Initialization**: Starts up models on context lifespan hooks to precompute matrices, guaranteeing fast response times.

---

## 3. Database Normalization & Performance Schema

The database model is fully normalized to PostgreSQL rules:

- `users` — Reader account records with locations, ages, activation toggle states, and verification indicators.
- `roles` — System security roles (`ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_LIBRARIAN`, `ROLE_MEMBER`).
- `user_roles` — Maps roles to users (N:M join).
- `books` — Catalog metadata items containing titles, authors, publishers, descriptions, page counts, and stocks tracking.
- `categories` — Holds book category names.
- `book_categories` — Maps books to categories (N:M join).
- `book_ratings` — User ratings (0-10) for collaborative predictions training.
- `borrowings` — Records active loans, due dates, returned dates, and accrued late penalties.
- `reservations` — Implements book holds queues when items are out of stock.
- `audit_logs` — System audit trails recording actions, actors, and targets.

### Database Indexing Strategy
To optimize query performance across large datasets (~270k books, ~1.1M ratings), the database builds the following indexes at initialization:
- `idx_books_title` & `idx_books_author`: Speeds up catalog searches.
- `idx_books_isbn`: Fast lookup for API integrations.
- `idx_ratings_user` & `idx_ratings_book`: Accelerates recommendation calculations and profile queries.
- `idx_borrowings_user` & `idx_borrowings_status`: Fast dashboard indicators load.

---

## 4. Workflows & Data Flows

### Seeding Data on Startup
1. When the backend starts, it queries the `books` table.
2. If empty, the `DataSeederService` starts reading CSV files from the mounted `/app/data/` volume.
3. In-memory mappings of `apibooks.csv` are built to enrich descriptions and page counts.
4. Directly runs SQL bulk statements using `JdbcTemplate` batches to seed books, users, and ratings.
5. Maps default roles and admin credentials.
6. Execution takes ~1-2 minutes for complete seeding.

### SVD Collaborative Filtering Flow
1. The user logs in and opens the Dashboard.
2. The frontend requests `/api/v1/recommendations/hybrid` from the backend.
3. The backend calls `POST http://ml-service:5000/recommend/hybrid`.
4. The Python service extracts user ratings history, runs SVD estimations, combines them with TF-IDF cosine similarities on the seed book, and yields top recommendations.
5. If the service fails, fallback to local database popular choices.

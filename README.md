# Tomrec — Enterprise Library Management System (Modernized)

Welcome to the modernized **Tomrec Library Management System**. The system has been completely rewritten and modernized from the Streamlit Python prototype into an enterprise-grade, scalable, containerized, multi-dashboard platform.

---

## 🚀 Key Modernized Enhancements

1. **Clean Microservice Separation**: Rebuilt the core operations backend in Java Spring Boot 3.2, user portals in React 18, and kept Python solely for collaborative and hybrid machine learning recommendations.
2. **Normalized SQL Storage**: Replaced pandas in-memory data pickle lookups with PostgreSQL 16. Includes indexes on query fields, primary foreign key relations, and automated migration scripts via Flyway.
3. **Role-Based Access Control (RBAC)**: Implemented standard roles (`SUPER_ADMIN`, `ADMIN`, `LIBRARIAN`, `MEMBER`) with endpoint protection using Spring Security and JWT.
4. **Auto Database Seeding**: Automatic seeding of ~271,000 books, ~1.1M ratings, and ~278,000 users directly into Postgres on first container startup.
5. **SMTP Verification Desk**: Implemented secure registration with email validation and password reset flows routed through a local mock SMTP testing server (Mailpit).

---

## 🛠️ Technology Stack

| Domain | Technology | Details |
|---|---|---|
| **Backend API** | Spring Boot 3.2.3 | Java 17, Spring Security, Data JPA, Flyway, RestTemplate |
| **Frontend Portal** | React 18 | Vite, React Router, Lucide, Recharts |
| **ML Engine** | Python FastAPI | Uvicorn, scikit-surprise (SVD models), scikit-learn (TF-IDF) |
| **Database** | PostgreSQL 16 | Alpine image, named data volume, optimized indexing |
| **SMTP Mail** | Mailpit | Mock developer SMTP server with local web mail inbox UI |
| **Infrastructure** | Docker Compose | Multi-container setups with health checks and volume persistence |

---

## 📁 System Directory Map

```
Book-Recommender-System/
├── backend/          # Java Spring Boot REST API
├── frontend/         # React SPA web portal (Port 3000)
├── ml-service/       # FastAPI ML recommendation engine (Port 5000)
├── docs/             # Technical docs (Architecture, API, Operations)
├── data/             # Original CSV datasets (used to seed DB)
└── Deployment/       # Streamlit prototype and SVD pickle models
```

---

## ⚙️ Quick Start Setup (Docker Compose)

The entire application runs inside Docker. **Zero local dependencies** are required on your host system.

### Prerequisites
- Docker and Docker Compose installed and running.

### Execution Commands
1. Clone / open the project directory in your terminal.
2. Launch the services:
   ```bash
   docker compose up --build
   ```
3. Docker will build and start all containers. On first run, the backend will perform database seeding. **Seeding will take ~1–2 minutes** due to dataset sizes. Keep an eye on container logs:
   - `library-backend  | Database is empty. Starting CSV database seeding...`
   - `library-backend  | Total books imported: 100000`
   - `library-backend  | Database seeding successfully completed in X ms.`

---

## 🌐 Dashboard Access URLs

| Application | Address | Credentials / Info |
|---|---|---|
| **React Web Portal** | [http://localhost:3000](http://localhost:3000) | Main library app. Registration & log-in. |
| **Mailpit Inbox** | [http://localhost:8025](http://localhost:8025) | View sent verification & password reset emails. |
| **ML FastAPI Docs** | [http://localhost:5000/docs](http://localhost:5000/docs) | OpenAPI interactive Swagger for ML microservice. |
| **Backend Actuator** | [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health) | Health status of Spring Boot service. |

---

## 🔑 Default Administrator Credentials

To test privileged dashboards (Admin / Librarian) immediately, log in using:
- **Email**: `admin@library.com`
- **Password**: `Admin@123`

---

## 📖 Operational Documentation

Detailed operation logs are stored in the `docs/` folder:
- **[System Architecture Guide](file:///c:/Users/KennedyOdhiambo/Desktop/Hobbie/Book-Recommender-System/docs/architecture.md)** — Architectural design, database normalization schema, and SVD recommender integrations.
- **[REST API Reference](file:///c:/Users/KennedyOdhiambo/Desktop/Hobbie/Book-Recommender-System/docs/api-reference.md)** — Available REST endpoints, request structures, and JWT claims.
- **[Operations User Guide](file:///c:/Users/KennedyOdhiambo/Desktop/Hobbie/Book-Recommender-System/docs/user-guide.md)** — Step-by-step instructions for reader checkouts, librarian desk actions, and mock email validation.

# SwasthaAI

SwasthaAI is an AI-driven healthcare platform offering smart symptom checks, risk prediction, clinical note automation, and doctor booking. Powered by NLP, ML, and voice tech, it delivers faster, more accurate, and personalized care for both patients and providers.

---

## Table of Contents

- [User Flow](#user-flow)
- [Technical Architecture](#technical-architecture)
- [Tech Stack](#tech-stack)
- [Frontend Structure](#frontend-structure)
- [Backend & Microservices](#backend--microservices)
- [API Documentation](#api-documentation)
- [Development & Setup](#development--setup)
- [Contributing](#contributing)
- [License](#license)

---

## User Flow

1. **Landing & Authentication**
   - Users land on the homepage and can sign up or log in using email/OTP or Google OAuth.
   - New users complete onboarding: email verification, OTP, PIN setup, and profile completion.

2. **Dashboard**
   - Authenticated users access a personalized dashboard.
   - Patients can view health records, book appointments, and receive AI-driven insights.
   - Doctors can manage appointments, view patient data, and access clinical tools.

3. **Health Vault**
   - Users upload, view, and share health documents (PDFs, lab reports).
   - AI insights are available for uploaded lab reports.

4. **Doctor Search & Booking**
   - Patients search for doctors using filters (specialty, location, experience).
   - Book appointments with real-time slot availability.

5. **MedAlert**
   - Users set medication reminders and manage alert preferences.

6. **Feedback & Support**
   - Users can submit feedback, report bugs, or request features.

---

## Technical Architecture

### High-Level Overview

- **Client:** Next.js frontend application.
- **Server:** Node.js/Express backend server.
- **Database:** PostgreSQL database managed by Prisma ORM, deployed on [neon.tech](https://neon.tech).
- **Microservices:** RAG-based chatbot service for medical queries.
- **Storage:** Cloud storage for file uploads (e.g., AWS S3).

### 1. Frontend (Next.js)

- **Pages & Routing:** `/src/app` uses Next.js App Router for modular, scalable routing.
- **Components:** Reusable UI components in `/src/components` (Navbar, Footer, Cards, Forms, etc.).
- **State Management:** Context API for authentication and global state.
- **API Calls:** Uses Axios for REST API integration.
- **Styling:** Tailwind CSS and custom CSS modules.

### 2. Backend (Node.js/Express)

- **API Structure:** Modular Express routers for authentication, user profiles, health vault, appointments, feedback, etc.
- **Authentication:** JWT-based, with support for Google OAuth and OTP flows.
- **Validation:** Zod schemas for request validation.
- **Database:** Prisma ORM with PostgreSQL (on neon.tech).
- **File Uploads:** Multer for handling uploads, with cloud storage integration.
- **Error Handling:** Centralized error middleware.

### 3. Microservice: RAG-based Chatbot

- **Purpose:** Provides an intelligent medical chatbot for users, capable of answering complex medical queries.
- **Architecture:**
  - **RAG (Retrieval-Augmented Generation):** Combines retrieval of relevant context with generative AI for accurate responses.
  - **Langchain Ecosystem:** Orchestrates the retrieval and generation pipeline.
  - **Vector Store:** Uses FAISS DB for storing and searching document embeddings.
  - **LLM:** Utilizes Perplexity as the large language model for generating answers.
  - **Reference Corpus:** All responses are grounded in "Harrison's Principles of Internal Medicine" for authoritative medical information.
- **Workflow:**
  1. User submits a medical query.
  2. Query is embedded and matched against the FAISS vector store to retrieve relevant sections from Harrison's.
  3. Retrieved context and user query are passed to the Perplexity LLM via Langchain.
  4. The LLM generates a response, referencing the authoritative medical text.
- **Deployment:** Runs as a separate microservice, communicating with the backend via REST API.

---

## Tech Stack

### Frontend

- **Framework:** [Next.js](https://nextjs.org/) (React 18+)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, CSS Modules
- **UI:** Custom components, Lucide Icons
- **State:** React Context API
- **API:** Axios

### Backend

- **Framework:** [Express.js](https://expressjs.com/)
- **Language:** TypeScript
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** PostgreSQL (deployed on [neon.tech](https://neon.tech))
- **Auth:** JWT, Google OAuth, OTP
- **Validation:** Zod
- **File Uploads:** Cloud Storage (S3 Bucket)

### Microservices

- **Chatbot:** Python (FastAPI/Flask) with Langchain, FAISS, Perplexity LLM

---

## Backend & Microservices

### 1. Backend (Node.js/Express)

- **Server Entry:** `src/server.ts` - Main entry point for the Express server.
- **Environment Variables:** Loaded from `.env` file using `dotenv` package.
- **Middleware:** Common middleware (CORS, body-parser) applied in `src/middleware`.
- **Error Handling:** Centralized error handling in `src/middleware/errorHandler.ts`.

### 2. Microservice: RAG-based Chatbot

- **Tech:** Python (FastAPI), Langchain, FAISS, Perplexity LLM
- **Endpoint:** `/api/chatbot/query`
- **Function:** Accepts user medical queries, retrieves context from Harrison's Principles of Internal Medicine using FAISS, and generates responses via Perplexity LLM, orchestrated by Langchain.
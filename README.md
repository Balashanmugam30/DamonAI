# 🧛‍♂️ DAMON AI - Your Immortal Study Partner

> *"I am Damon. Feed me your documents, and I shall grant you knowledge."*

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Damon-ff003c?style=for-the-badge&logo=vercel)](https://damon-ai-iota.vercel.app)
[![Backend Status](https://img.shields.io/badge/Backend-Online-success?style=flat-square&logo=render)](https://damonai.onrender.com/docs)

**Damon AI** is an immersive, cinematic, voice-activated PDF study assistant. Unlike standard AI tools, Damon combines a dark "Cyber-Vampire" aesthetic with advanced **RAG (Retrieval-Augmented Generation)** technology to turn boring study sessions into an interactive, narrative experience.

---

## 📸 Interface Showcase

### The Cinematic Landing Page
A full-screen 3D particle environment built with **Three.js** invites users into the void.
![Damon Landing Page](https://github.com/user-attachments/assets/244ea462-0768-400e-af14-dbbd743afea6)

### The Glassmorphism Chat Interface
A floating, translucent UI where users converse with the AI using text or voice.
![Damon Chat Interface](https://github.com/user-attachments/assets/1ba7ea41-523a-4de1-b2df-56358386516e)

---

## 🏗️ System Architecture & Workflow

Damon operates on a decoupled **Client-Server Architecture**, utilizing a high-performance Python backend for AI processing and a lightweight Vanilla JS frontend for the immersive experience.

![System Architecture](https://github.com/user-attachments/assets/6a2b0a55-eb88-4fac-8fba-0fe495ad3a22)

### The "Knowledge Absorption" Flow:
1.  **Ingestion:** User uploads a PDF via the Frontend.
2.  **Processing:** FastAPI receives the file -> `PyPDF2` extracts text -> Text is split into semantic chunks.
3.  **Embedding:** Text chunks are converted into vector embeddings using **Google's `text-embedding-004` model**.
4.  **Storage:** Vectors are stored in **ChromaDB**, creating a persistent "Long-Term Memory" for Damon.

### The "Query" Flow:
1.  **Search:** User asks a question (Voice/Text) -> Backend searches ChromaDB for the most relevant text chunks.
2.  **Synthesis:** The relevant context + user question is sent to **Gemini 1.5 Flash**.
3.  **Persona:** A System Prompt enforces the "Vampire Persona" (Dark, Elegant, Poetic).
4.  **Response:** The answer is returned to the UI and read aloud via the **Web Speech API**.

---

## ⚡ Key Features

* **🩸 Immersive 3D UI:** A reactive particle field and rotating Icosahedron core that responds to user interaction.
* **🧠 RAG Intelligence:** Upload any PDF, and Damon "absorbs" the knowledge, allowing you to chat with your textbooks.
* **🗣️ Voice Interaction:**
    * **Voice Input:** Ask questions naturally using the microphone.
    * **Voice Output:** Damon replies in a deep, custom-tuned voice (Pitch: 0.6, Rate: 0.9).
* **📜 Contextual Memory:** Damon retains conversation history and allows switching between multiple uploaded "scrolls" (PDFs).
* **⚡ Cloud Optimized:** Uses lightweight cloud embeddings to run efficiently on free-tier serverless architecture.

---

## 🛠️ Tech Stack

### Frontend (The Face)
* **Core:** HTML5, CSS3, Vanilla JavaScript (ES6+).
* **Visuals:** Three.js (WebGL 3D), GSAP (Cinematic Animations).
* **Styling:** Custom "Dark Glassmorphism" CSS variables.
* **Hosting:** Vercel.

### Backend (The Brain)
* **Framework:** Python FastAPI (ASGI).
* **AI Engine:** Google Gemini 1.5 Flash (via `google-generativeai`).
* **Vector Database:** ChromaDB (Persistent Client).
* **PDF Processing:** PyPDF2.
* **Hosting:** Render (Python Container).

---

## 🚀 How to Run Locally

If you wish to summon Damon on your local machine:

### 1. Clone the Repository
```bash
git clone [https://github.com/Balashanmugam30/DamonAI.git](https://github.com/Balashanmugam30/DamonAI.git)
cd DamonAI
````

### 2\. Backend Setup

Navigate to the backend and install dependencies.

```bash
cd backend
pip install -r requirements.txt
```

**Configure API Key:**
Create a `.env` file in the `backend` folder:

```env
GEMINI_API_KEY=your_actual_google_api_key_here
```

**Start the Server:**

```bash
uvicorn main:app --reload
```

### 3\. Frontend Setup

Open a new terminal window:

```bash
cd frontend
# Using Python to serve the static files
python -m http.server 5500
```

Visit `http://localhost:5500` in your browser.

-----

## 📂 Project Structure

```
DamonAI/
├── backend/
│   ├── chroma_db/          # Vector Storage
│   ├── main.py             # FastAPI Server & RAG Logic
│   ├── requirements.txt    # Python Dependencies
│   └── .env                # Secrets (Ignored by Git)
├── frontend/
│   ├── assets/             # Images & Icons
│   ├── index.html          # Landing Page
│   ├── chat.html           # Chat Interface
│   ├── style.css           # Global Glassmorphism Styles
│   └── script.js           # Frontend Logic & Three.js
└── README.md
```

-----

## 👨‍💻 Author

**Balashanmugam S** — *The Real World Damon*

  * [GitHub](https://github.com/Balashanmugam30)
  * [LinkedIn](https://www.linkedin.com/in/balashanmugams/)
  * [Instagram](https://www.instagram.com/balaxxh?igsh=MWh1cTd3aTBod3Mycw==)

> *"I build things that live forever... in the cloud."*

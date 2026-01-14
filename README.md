# Ripers.new - AI-Powered Document Assistant

A modern, full-stack web application that allows users to upload documents (PDF, Excel, Images, XML,everthing) and chat with them using an AI-powered RAG (Retrieval-Augmented Generation) system.

## 🚀 Features
-   **Security for the data of client.
-   **Document Chat (RAG)**: Upload documents and ask questions based on their content.
-   **Multi-Format Support**: Supports PDF, Excel (.xlsx/.xls), XML, Markdown (.md), and Text (.txt) files.
-   **Modern UI**: Sleek, dark-themed interface inspired by modern IDEs and editors.
-   **Three-Panel Layout**:
    -   **Left**: File Manager & Recent Uploads.
    -   **Center**: Document Preview & Information.
    -   **Right**: AI Chat Interface.
-   **Real-time Interactions**: Optimistic UI updates for a snappy experience.
-   **Secure**: Environment variable configuration for API keys and endpoints.

## 🛠️ Tech Stack

### Frontend
-   **React** (Vite)
-   **Tailwind CSS v4** (Styling)
-   **Material Symbols** (Icons)

### Backend
-   **FastAPI** (Python Web Framework)
-   **LangChain & RAG** (Document Processing)
-   **Groq API** (LLM Inference - Llama 3)
-   **PyPDF & Pandas** (Data Extraction)

---
## 📦 Installation & Setup

### Prerequisites
-   **Node.js** (v16+)
-   **Python** (v3.9+)
-   **Groq API Key** (Get one from [console.groq.com](https://console.groq.com))

### 1. Clone the Repository
```bash
git clone <repository-url>
cd inovation-app
```

### 2. Backend Setup
Navigate to the backend directory (or root if `chatbot.py` is there) and install dependencies.

```bash
cd backend  # (If backend is in a subfolder, otherwise stay in root)
pip install -r requirement.txt
```

**Configure Environment:**
Create a `.env` file in the backend directory:
```extension
GROQ_API_KEY=your_actual_groq_api_key_here
```

**Start the Server:**
```bash
python -m uvicorn chatbot:app --reload
```
The backend will run on `http://localhost:8000`.

### 3. Frontend Setup
Navigate to the frontend directory (`inovation-app`).

```bash
cd inovation-app
npm install
```

**Configure Environment:**
Create a `.env` file in the `inovation-app` directory:
```extension
VITE_API_BASE_URL=http://localhost:8000
```
*(Replace `localhost` with your backend IP if running on a different machine).*

**Start the Application:**
```bash
npm run dev
```
The app will open at `http://localhost:5173`.

---

## 💡 How to Use
1.  Open the app in your browser.
2.  **Upload**: Click the upload area or use the "Upload docs" buttons to select files.
3.  **Preview**: Click a file in the sidebar to see its details or preview images.
4.  **Chat**: The chat sidebar opens automatically. Type a question (e.g., "Summarize this PDF") to get an answer based *only* on the uploaded document context.

## 🤝 Contributing
1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License
Distributed under the MIT License.

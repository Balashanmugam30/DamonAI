import os
import shutil
import logging
import re  # Added for cleaning text
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import chromadb
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
import PyPDF2
import uvicorn

# --- CONFIGURATION ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.warning("⚠️ GEMINI_API_KEY not found in .env file.")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
MODEL_NAME = "gemini-flash-latest"

generation_config = {
    "temperature": 0.7, # Lowered slightly for more accuracy
    "top_p": 1,
    "top_k": 32,
    "max_output_tokens": 4096,
}
model = genai.GenerativeModel(MODEL_NAME, generation_config=generation_config)

# Initialize FastAPI
app = FastAPI(title="DAMON AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE SETUP ---
CHROMA_DB_DIR = "chroma_db"
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

class LocalEmbeddingFunction(chromadb.EmbeddingFunction):
    def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
        return embedding_model.encode(input).tolist()

embedding_func = LocalEmbeddingFunction()
collection = chroma_client.get_or_create_collection(
    name="damon_docs",
    embedding_function=embedding_func
)

# --- MEMORY STORAGE (RAM) ---
CHAT_HISTORY = []

# --- MODELS ---
class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    response: str

# --- HELPER: TEXT CLEANER ---
def clean_text(text: str) -> str:
    """Removes markdown symbols like **bold**, *italic*, and #headers"""
    # Remove bold/italic stars
    text = re.sub(r'\*+', '', text)
    # Remove headers (#)
    text = re.sub(r'#+\s', '', text)
    # Remove markdown links [text](url) -> text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    return text.strip()

# --- ENDPOINTS ---
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        global CHAT_HISTORY
        CHAT_HISTORY = []
        
        file_location = f"temp_{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        
        text = ""
        with open(file_location, "rb") as f:
            pdf_reader = PyPDF2.PdfReader(f)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        
        os.remove(file_location)

        if not text.strip():
            raise HTTPException(status_code=400, detail="PDF was empty.")

        chunk_size = 1000
        chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
        
        ids = [f"{file.filename}_{i}" for i in range(len(chunks))]
        metadatas = [{"source": file.filename} for _ in chunks]
        
        collection.add(documents=chunks, ids=ids, metadatas=metadatas)
        
        return {"message": f"I have absorbed the essence of {file.filename}."}
        
    except Exception as e:
        logger.error(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask", response_model=ChatResponse)
async def ask_question(request: ChatRequest):
    try:
        query = request.query
        
        # 1. Retrieve Context
        results = collection.query(query_texts=[query], n_results=3)
        context_text = "\n".join(results['documents'][0]) if results['documents'] else "No relevant text found."
        
        # 2. Build History
        history_text = ""
        for turn in CHAT_HISTORY[-4:]:
            history_text += f"User: {turn['user']}\nDamon: {turn['damon']}\n"

        # 3. Enhanced Prompt for Accuracy
        system_prompt = f"""
        You are DAMON, a Vampire AI assistant.
        
        CRITICAL RULES:
        1. Answer based ONLY on the CONTEXT provided below.
        2. Do NOT use Markdown formatting (no asterisks *, no bolding, no headers). Write plain text only.
        3. If the user asks "in one word" or "short answer", OBEY STRICTLY. Do not write a full sentence.
        
        CONTEXT FROM PDF:
        {context_text}
        
        PAST CONVERSATION:
        {history_text}
        
        USER QUESTION: {query}
        """
        
        # 4. Generate
        response = model.generate_content(system_prompt)
        raw_reply = response.text
        
        # 5. Clean & Save
        clean_reply = clean_text(raw_reply)
        CHAT_HISTORY.append({"user": query, "damon": clean_reply})
        
        return ChatResponse(response=clean_reply)
        
    except Exception as e:
        logger.error(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/clear")
async def clear_memory():
    global CHAT_HISTORY
    CHAT_HISTORY = []
    return {"message": "Memory cleared."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
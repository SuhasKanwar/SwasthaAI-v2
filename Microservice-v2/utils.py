import os
import tempfile
import fitz
import logging
from fastapi import UploadFile
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

logging.basicConfig(level=logging.INFO)
FAISS_PATH = "./faiss_index"

def build_faiss_db_from_data_folder(data_folder: str = "./data"):
    try:
        docs = []
        for filename in os.listdir(data_folder):
            if filename.endswith(".pdf"):
                loader = PyPDFLoader(os.path.join(data_folder, filename))
                docs.extend(loader.load())
        if not docs:
            logging.warning("No PDF documents found in data folder.")
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(docs)
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        vectorstore = FAISS.from_documents(chunks, embeddings)
        vectorstore.save_local(FAISS_PATH)
        logging.info("FAISS DB built and saved to disk.")
        return vectorstore
    except Exception as e:
        logging.error(f"Error building FAISS DB: {e}")
        return None

def load_faiss_db():
    try:
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        vectorstore = FAISS.load_local(FAISS_PATH, embeddings, allow_dangerous_deserialization=True)
        logging.info("FAISS DB loaded from disk.")
        return vectorstore
    except Exception as e:
        logging.error(f"Error loading FAISS DB: {e}")
        return None

def retrieve_context(faiss_db, query: str, k: int = 4):
    try:
        docs_and_scores = faiss_db.similarity_search_with_score(query, k=k)
        context = "\n\n".join([doc.page_content for doc, _ in docs_and_scores])
        return context
    except Exception as e:
        logging.error(f"Error retrieving context: {e}")
        return ""

def extract_text_from_pdf(file: UploadFile) -> str:
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file.file.read())
            tmp_path = tmp.name
        doc = fitz.open(tmp_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        os.remove(tmp_path)
        return text
    except Exception as e:
        logging.error(f"Error extracting text from PDF: {e}")
        return ""

def process_uploaded_pdf(file: UploadFile, query: str, k: int = 4):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file.file.read())
            tmp_path = tmp.name
        loader = PyPDFLoader(tmp_path)
        docs = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(docs)
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        vectorstore = FAISS.from_documents(chunks, embeddings)
        docs_and_scores = vectorstore.similarity_search_with_score(query, k=k)
        context = "\n\n".join([doc.page_content for doc, _ in docs_and_scores])
        os.remove(tmp_path)
        return context
    except Exception as e:
        logging.error(f"Error processing uploaded PDF: {e}")
        return ""
from fastapi import FastAPI, UploadFile, File, Form, Request, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv
from langchain_perplexity import ChatPerplexity
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables import RunnablePassthrough
from operator import itemgetter
from contextlib import asynccontextmanager

from utils import build_faiss_db_from_data_folder, load_faiss_db, retrieve_context, process_uploaded_pdf

load_dotenv()
PPLX_API_KEY = os.getenv("PPLX_API_KEY")
model = ChatPerplexity(model="sonar", api_key=PPLX_API_KEY)

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_or_prepare_faiss_db()
    yield

app = FastAPI(
    title="SwasthaAI Microservice",
    version="1.0",
    description="Handles chatbot queries with or without PDF files",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

FAISS_DB = None

def prepare_faiss_db():
    global FAISS_DB
    FAISS_DB = build_faiss_db_from_data_folder("./data")

def load_or_prepare_faiss_db():
    global FAISS_DB
    FAISS_DB = load_faiss_db()
    if FAISS_DB is None:
        FAISS_DB = build_faiss_db_from_data_folder("./data")

@app.post("/prepare-db")
async def prepare_db_route():
    prepare_faiss_db()
    return {"status": "FAISS DB rebuilt from ./data"}

store = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

prompt_template = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are SwasthaAI, an AI medical assistant that helps both patients and clinicians.\n\n"
        "Your main responsibilities are:\n"
        "- Answer general medical questions and explain conditions, tests, medications, and procedures in clear language.\n"
        "- Analyze, summarize, and explain medical reports, lab results, prescriptions, and clinical notes provided in the context or uploaded files.\n"
        "- Support clinicians with structured overviews of relevant literature, guidelines, and evidence when possible.\n\n"
        "Guidelines:\n"
        "- Be accurate, concise, and evidence-informed; clearly state uncertainties or limitations.\n"
        "- Do NOT provide a formal diagnosis, prescribe medications, or choose specific treatments.\n"
        "- Always remind users that your responses do not replace professional medical advice and that they should consult a qualified healthcare professional for decisions or emergencies.\n"
        "- If a question is clearly unrelated to health or medicine, say you cannot help with that."
    ),
    MessagesPlaceholder(variable_name="messages")
])

# trimmer = trim_messages(
#     max_tokens=10000,
#     strategy="last",
#     token_counter=model,
#     include_system=True,
#     allow_partial=True,
#     start_on="human"
# )

chain = (
    RunnablePassthrough.assign(messages=itemgetter("messages"))
    | prompt_template
    | model
)

with_message_history = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="messages"
)

def build_messages(query: str, context: str) -> list:
    return [
        HumanMessage(content=f"Context:\n{context}\n\nQuestion:\n{query}")
    ]

def get_token_from_auth_header(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    return authorization.replace("Bearer ", "").strip()

@app.post("/chatbot/query")
async def chatbot_query(request: Request, body: QueryRequest):
    token = get_token_from_auth_header(request.headers.get("authorization"))
    if FAISS_DB is None:
        return {"error": "FAISS DB not initialized. Please call /prepare-db first."}
    context = retrieve_context(FAISS_DB, body.query)
    messages = build_messages(body.query, context)
    config = {"configurable": {"session_id": token}}
    response = with_message_history.invoke({"messages": messages}, config=config)
    return {
        "answer": getattr(response, "content", str(response)),
        "citations": (getattr(response, "additional_kwargs", {}) or {}).get("citations", []),
    }

@app.post("/chatbot/query-with-file")
async def chatbot_query_with_file(
    request: Request,
    query: str = Form(...),
    file: UploadFile = File(...)
):
    token = get_token_from_auth_header(request.headers.get("authorization"))
    context = process_uploaded_pdf(file, query)
    messages = build_messages(query, context)
    config = {"configurable": {"session_id": token}}
    response = with_message_history.invoke({"messages": messages}, config=config)
    return {
        "answer": getattr(response, "content", str(response)),
        "citations": (getattr(response, "additional_kwargs", {}) or {}).get("citations", []),
        "file_info": {
            "filename": file.filename,
            "content_type": file.content_type,
        }
    }

PORT = int(os.getenv("PORT", 8000))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
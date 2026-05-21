from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pypdf import PdfReader
import requests
import os
import re

# LANGCHAIN IMPORTS
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

# =========================================
# LOAD ENV VARIABLES
# =========================================

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# =========================================
# FASTAPI APP
# =========================================

app = FastAPI()

# =========================================
# EMBEDDING MODEL
# =========================================

embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# =========================================
# GLOBAL STORAGE
# =========================================

candidate_documents = []
candidate_vector_store = None

# =========================================
# CORS
# =========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================
# UPLOAD FOLDER
# =========================================

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# =========================================
# HOME ROUTE
# =========================================

@app.get("/")
def home():
    return {
        "message": "AI Recruitment Platform Running"
    }

# =========================================
# SINGLE RESUME ANALYZER
# =========================================

@app.post("/analyze-resume/")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):

    try:

        file_path = os.path.join(
            UPLOAD_FOLDER,
            file.filename
        )

        with open(file_path, "wb") as f:
            f.write(await file.read())

        reader = PdfReader(file_path)

        resume_text = ""

        for page in reader.pages:
            text = page.extract_text()
            if text:
                resume_text += text + "\n"

        # VECTOR STORE

        vector_store = FAISS.from_texts(
            [resume_text],
            embedding_model
        )

        retrieved_docs = vector_store.similarity_search(
            job_description,
            k=1
        )

        context = "\n".join([
            doc.page_content
            for doc in retrieved_docs
        ])

        # ─────────────────────────────────────────
        # AI PROMPT — strict output format so scores
        # can be parsed reliably by the frontend
        # ─────────────────────────────────────────

        prompt = f"""
You are an expert HR analyst and ATS (Applicant Tracking System) evaluator.

Analyze the resume below against the given job description and return your response
in EXACTLY the following format. Do not deviate from these section headings.

---

RESUME STRENGTHS:
(List 4-5 key strengths of this resume)

RESUME WEAKNESSES:
(List 4-5 weaknesses or gaps in this resume)

MISSING SKILLS:
(List skills present in the job description but absent from the resume)

CAREER SUGGESTIONS:
(List 3-4 actionable suggestions to improve this resume)

ATS_SCORE: [number between 0 and 100, e.g. 78]
(One line only. Integer only. No extra text on this line.)

JOB_MATCH: [number between 0 and 100, e.g. 65]
(One line only. Integer only. No extra text on this line.)

MATCHING SKILLS:
(List skills that appear in both the resume and job description)

MISSING JOB SKILLS:
(List skills from the job description that are missing from the resume)

IMPROVEMENT SUGGESTIONS:
(List 3-4 specific suggestions to improve the candidate's match for this role)

---

JOB DESCRIPTION:
{job_description}

RESUME:
{context}
"""

        url = "https://openrouter.ai/api/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        response = requests.post(
            url,
            headers=headers,
            json=payload
        )

        data = response.json()

        analysis = data["choices"][0]["message"]["content"]

        return {
            "analysis": analysis
        }

    except Exception as e:

        return {
            "error": str(e)
        }

# =========================================
# GENERATE INTERVIEW QUESTIONS
# =========================================

@app.post("/generate-questions/")
async def generate_questions(
    file: UploadFile = File(...)
):

    try:

        file_path = os.path.join(
            UPLOAD_FOLDER,
            file.filename
        )

        with open(file_path, "wb") as f:
            f.write(await file.read())

        reader = PdfReader(file_path)

        resume_text = ""

        for page in reader.pages:
            text = page.extract_text()
            if text:
                resume_text += text + "\n"

        prompt = f"""
Based on this resume, generate exactly the following:

1. 5 HR Interview Questions
2. 5 Technical Interview Questions
3. 5 Project-Based Questions

Resume:
{resume_text}
"""

        url = "https://openrouter.ai/api/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        response = requests.post(
            url,
            headers=headers,
            json=payload
        )

        data = response.json()

        questions = data["choices"][0]["message"]["content"]

        return {
            "questions": questions
        }

    except Exception as e:

        return {
            "error": str(e)
        }

# =========================================
# BULK RESUME UPLOAD
# =========================================

@app.post("/upload-bulk-resumes/")
async def upload_bulk_resumes(
    file: UploadFile = File(...)
):

    try:

        global candidate_documents
        global candidate_vector_store

        candidate_documents = []

        # ─────────────────────────────
        # SAVE FILE
        # ─────────────────────────────

        file_path = os.path.join(
            UPLOAD_FOLDER,
            file.filename
        )

        with open(file_path, "wb") as f:
            f.write(await file.read())

        # ─────────────────────────────
        # READ PDF
        # ─────────────────────────────

        reader = PdfReader(file_path)

        full_text = ""

        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text += "\n" + text

        # ─────────────────────────────
        # SPLIT RESUMES
        # ─────────────────────────────

        resume_splits = re.split(
            r"RESUME\s+\d+",
            full_text,
            flags=re.IGNORECASE
        )

        documents = []

        # ─────────────────────────────
        # PROCESS EACH RESUME
        # ─────────────────────────────

        for resume_text in resume_splits:

            resume_text = resume_text.strip()

            if len(resume_text) < 100:
                continue

            # Extract name
            candidate_name = "Unknown"
            name_match = re.search(
                r"Name\s*\n([A-Za-z ]+)",
                resume_text
            )
            if name_match:
                candidate_name = name_match.group(1).strip()

            # Extract email
            email_match = re.search(
                r'[\w\.-]+@[\w\.-]+',
                resume_text
            )
            candidate_email = (
                email_match.group(0)
                if email_match
                else "Not Found"
            )

            # Extract phone
            phone_match = re.search(
                r'(\+91[\-\s]?)?[6789]\d{9}',
                resume_text
            )
            candidate_phone = (
                phone_match.group(0)
                if phone_match
                else "Not Found"
            )

            # Clean resume text
            clean_resume = re.sub(
                r'\n+',
                '\n',
                resume_text
            ).strip()

            # Create document
            doc = Document(
                page_content=clean_resume,
                metadata={
                    "candidate_name":  candidate_name,
                    "candidate_email": candidate_email,
                    "candidate_phone": candidate_phone
                }
            )

            documents.append(doc)

        # ─────────────────────────────
        # STORE & VECTORIZE
        # ─────────────────────────────

        candidate_documents = documents

        candidate_vector_store = FAISS.from_documents(
            candidate_documents,
            embedding_model
        )

        return {
            "message": f"{len(candidate_documents)} resumes uploaded successfully"
        }

    except Exception as e:

        return {
            "error": str(e)
        }

# =========================================
# SEARCH CANDIDATES
# =========================================

@app.post("/search-candidates/")
async def search_candidates(
    query: str = Form(...)
):

    try:

        global candidate_vector_store

        if candidate_vector_store is None:
            return {
                "message": "No resumes uploaded yet"
            }

        # ─────────────────────────────
        # SEARCH
        # ─────────────────────────────

        results = candidate_vector_store.similarity_search(
            query,
            k=5
        )

        candidates = []

        for result in results:

            candidates.append({
                "candidate_name":  result.metadata.get("candidate_name",  "Unknown"),
                "candidate_email": result.metadata.get("candidate_email", "Unknown"),
                "candidate_phone": result.metadata.get("candidate_phone", "Unknown"),
                "resume_snippet":  result.page_content[:800]
            })

        return {
            "matching_candidates": candidates
        }

    except Exception as e:

        return {
            "error": str(e)
        }
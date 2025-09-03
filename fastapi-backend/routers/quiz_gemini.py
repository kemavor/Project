from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
import os
from sqlalchemy.orm import Session
from database import get_db
from models import GeneratedQuestion

router = APIRouter(prefix="/quiz", tags=["quiz-gemini"])


class GenerateQuizRequest(BaseModel):
    topic: Optional[str] = Field(
        None, description="Topic or title for the quiz")
    source_text: Optional[str] = Field(
        None, description="Optional source text to generate questions from")
    question_count: int = Field(5, ge=1, le=50)
    difficulty: str = Field("medium", description="easy | medium | hard")
    # Optional persistence targets
    course_id: Optional[int] = Field(
        None, description="If provided, save generated questions under this course")
    stream_id: Optional[int] = Field(
        None, description="If provided, save generated questions under this stream")


class QuizOption(BaseModel):
    text: str


class QuizQuestion(BaseModel):
    question: str
    options: List[QuizOption]
    answer: str


class GenerateQuizResponse(BaseModel):
    questions: List[QuizQuestion]


def _load_gemini():
    try:
        import google.generativeai as genai  # type: ignore
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Gemini SDK import failed: {str(e)}")

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, detail="Missing GEMINI_API_KEY/GOOGLE_API_KEY environment variable")
    try:
        genai.configure(api_key=api_key)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Gemini SDK configure failed: {str(e)}")
    return genai


@router.post("/generate", response_model=GenerateQuizResponse)
async def generate_quiz(payload: GenerateQuizRequest, db: Session = Depends(get_db)):
    genai = _load_gemini()

    topic = payload.topic or "General Knowledge"
    source_text = payload.source_text or ""
    num = payload.question_count
    difficulty = payload.difficulty

    system_instructions = (
        "You are a quiz generator. Produce strictly valid JSON with no preface or commentary. "
        "The JSON schema must be: {\"questions\":[{\"question\":string,\"options\":[{\"text\":string},...],\"answer\":string}...]} "
        "Ensure exactly one correct answer appears in options and that 'answer' equals the exact text of the correct option."
    )

    user_prompt = f"""
Generate {num} unique multiple-choice questions.
Topic: {topic}
Difficulty: {difficulty}
Source (optional, use if helpful):
{source_text}

Return only JSON matching the schema above. Do not include markdown, code fences, or explanations.
Each question must have exactly 4 options.
    """

    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        model = genai.GenerativeModel(
            model_name, system_instruction=system_instructions)
        result = model.generate_content(user_prompt)
        text = result.text or ""
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Gemini generation failed: {str(e)}")

    # Best-effort JSON extraction
    import json
    import re

    def extract_json(s: str) -> str:
        # Remove code fences if present
        s = re.sub(r"^```[a-zA-Z]*", "", s.strip())
        s = re.sub(r"```$", "", s.strip())
        # Try to find the first top-level JSON object
        first_brace = s.find("{")
        last_brace = s.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            return s[first_brace:last_brace+1]
        return s

    try:
        raw = extract_json(text)
        data = json.loads(raw)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to parse quiz JSON: {str(e)}")

    # Validate/normalize
    questions_in = data.get("questions") if isinstance(data, dict) else None
    if not isinstance(questions_in, list) or len(questions_in) == 0:
        raise HTTPException(
            status_code=500, detail="Gemini returned no questions")

    normalized: List[QuizQuestion] = []
    for q in questions_in:
        question_text = str(q.get("question", "")).strip()
        answer_text = str(q.get("answer", "")).strip()
        opts = q.get("options")
        if not question_text or not answer_text or not isinstance(opts, list):
            continue
        options_norm = [QuizOption(text=str(o.get("text", "")).strip())
                        for o in opts if isinstance(o, dict)]
        if not options_norm:
            continue
        normalized.append(QuizQuestion(question=question_text,
                          options=options_norm, answer=answer_text))

    if not normalized:
        raise HTTPException(
            status_code=500, detail="No valid questions after normalization")

    # Persist questions if a target is provided
    if payload.course_id or payload.stream_id:
        try:
            for nq in normalized[:num]:
                db_obj = GeneratedQuestion(
                    stream_id=payload.stream_id,
                    course_id=payload.course_id if payload.course_id is not None else (
                        0 if payload.stream_id else None),
                    document_id=None,
                    question_type="multiple_choice",
                    question_text=nq.question,
                    correct_answer=nq.answer,
                    options=[opt.text for opt in nq.options],
                    difficulty_level=difficulty,
                    topic_tags=[topic] if topic else [],
                    generation_method="nlp",
                )
                db.add(db_obj)
            db.commit()
        except Exception as e:
            db.rollback()
            # Do not fail the response if saving fails; report error
            raise HTTPException(
                status_code=500, detail=f"Generated but failed to save: {str(e)}")

    return GenerateQuizResponse(questions=normalized[:num])

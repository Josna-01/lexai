"""
Pydantic request/response models for the LexAI API.
"""

from typing import List, Optional
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    query: str
    history: List[ChatMessage] = []
    image_base64: Optional[str] = None
    image_mime_type: Optional[str] = None



class Citation(BaseModel):
    act: str
    section: Optional[str] = None
    heading: Optional[str] = None
    year: Optional[int] = None


class ChatResponse(BaseModel):
    answer: str
    citations: List[Citation]


class SimulationStepRequest(BaseModel):
    scenario_id: int
    current_node_id: str
    user_choice: str  # "A", "B", "C", "D"


class SimulationStepResponse(BaseModel):
    grade: str  # "correct" (or "legal"), "risky", "illegal"
    explanation: str
    citation: str
    score_delta: int
    next_node: str  # e.g., "2", "3", "end"


class CustomSituationRequest(BaseModel):
    situation: str


class CustomScenarioResponse(BaseModel):
    title: str
    character: str
    nodes: dict  # maps "1", "2", "3", "4", "5" to {"story": str, "choices": {"A": str, "B": str, ...}}


class CustomEvaluationRequest(BaseModel):
    situation: str
    story: str
    choice_key: str  # "A", "B", "C", "D"
    choice_text: str



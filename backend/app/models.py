"""Pydantic models shared across API endpoints."""

from typing import List, Optional
from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str


class SourceChunk(BaseModel):
    chunk: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]


class CodeRunRequest(BaseModel):
    code: str


class CodeRunResponse(BaseModel):
    stdout: str
    image_base64: Optional[str] = None
    error: Optional[str] = None


class MindMapNode(BaseModel):
    id: str
    label: str
    type: str = "default"  # "root", "topic", "subtopic"
    content: str  # Detailed content shown when clicked


class MindMapEdge(BaseModel):
    id: str
    source: str
    target: str


class AnalysisResponse(BaseModel):
    root_node: MindMapNode
    nodes: List[MindMapNode]
    edges: List[MindMapEdge]

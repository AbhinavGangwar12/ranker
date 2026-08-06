from pydantic import BaseModel, Field
from typing import TypedDict, Annotated
from operator import add

class State(TypedDict):
    user_input: str
    input_outline: str
    worker_responses: Annotated[list[dict], add]
    sorted_confidence: list[dict]
    top3suggestions: list[str]
    verdict: str

class score(BaseModel):
    confidence: Annotated[float, Field(ge=1, le=10, description="Confidence level of the response, on a scale from 1 to 10.")]
    description: Annotated[str, Field(description="A brief description of the response, summarizing its content and relevance.")]
import asyncio
from app.agent.nodes import (
    outline_node, general_node, mathematics_node, coding_node, instruction_node, multimodal_node, longcontext_node, judge
)
from langgraph.graph import StateGraph, START, END
from app.agent.state import State
from app.agent.checkpointer import get_checkpointer

builder = StateGraph(State)
builder.add_node("outline_node", outline_node)
builder.add_node("general_node", general_node)
builder.add_node("mathematics_node", mathematics_node)
builder.add_node("coding_node", coding_node)
builder.add_node("instruction_node", instruction_node)
builder.add_node("multimodal_node", multimodal_node)
builder.add_node("longcontext_node", longcontext_node)
builder.add_node("judge", judge)

builder.add_edge(START, "outline_node")

# Fan-Out
builder.add_edge("outline_node", "general_node")
builder.add_edge("outline_node", "mathematics_node")
builder.add_edge("outline_node", "coding_node")
builder.add_edge("outline_node", "instruction_node")
builder.add_edge("outline_node", "multimodal_node")
builder.add_edge("outline_node", "longcontext_node")

# Fan-In
builder.add_edge("general_node", "judge")
builder.add_edge("mathematics_node", "judge")
builder.add_edge("coding_node", "judge")
builder.add_edge("instruction_node", "judge")
builder.add_edge("multimodal_node", "judge")
builder.add_edge("longcontext_node", "judge")

builder.add_edge("judge", END)

_graph = None
_graph_lock = asyncio.Lock()


async def get_graph():
    """Compiles the graph with an async checkpointer on first call, caches it after.
    Building the checkpointer is async (it opens a connection pool), so this can't
    happen at plain module-import time the way builder.compile() alone could."""
    global _graph
    if _graph is None:
        async with _graph_lock:
            if _graph is None:
                checkpointer = await get_checkpointer()
                _graph = builder.compile(checkpointer=checkpointer)
    return _graph
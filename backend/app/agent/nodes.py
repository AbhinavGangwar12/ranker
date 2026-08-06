from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
from app.core.config import settings
from app.agent.state import State, score

llm = ChatGroq(
    model=settings.LLM_MODEL,
    temperature=settings.LLM_TEMPERATURE,
    api_key=settings.GROQ_API_KEY
)

def outline_node(State: State):
    prompt = SystemMessage(content=f"""
        You are the "Query Interpreter" node in an AI agent pipeline. Your sole responsibility is to analyze the user's raw input and create a clear, structured outline that explains exactly what the user is trying to achieve. 

        This outline will be read by downstream AI nodes, so it must be highly structured, unambiguous, and easy to parse.

        YOUR OBJECTIVE:
        1. Identify the core intent of the user's query.
        2. Break down the query into distinct sub-tasks, implied needs, or key concepts.
        3. Extract any specific constraints or context provided.

        STRICT CONSTRAINTS:
        - DO NOT answer the user's query or generate the final solution. Your only job is to analyze and outline the request.
        - LENGTH LIMIT: Your total output must NEVER exceed 2x (twice) the length/word count of the original user input. Be highly concise and information-dense.
        - Remove filler words, conversational pleasantries, and ambiguity.

        OUTPUT FORMAT:
        Provide your analysis in the following structured format:

        **Primary Intent:** [1 concise sentence summarizing the main goal]
        **Key Requirements:** 
        - [Task or need 1]
        - [Task or need 2]
        **Constraints & Context:** [Any limits, specific tools, or background info mentioned. If none, output "None"]

        ---
        USER INPUT TO ANALYZE:
        {State.get('user_input', '')}
    """)
    response = llm.invoke([prompt])
    return {'input_outline': response.content.strip()}

def general_node(State: State):
    prompt = SystemMessage(content=f"""
        You are the "GK & Reasoning Evaluator" node in an AI agent pipeline. 
        Your task is to analyze the provided query outline and determine a confidence score (from 1 to 10) indicating how successfully the user's request can be fulfilled using ONLY general knowledge (GK) and logical reasoning.

        SCORING CALIBRATION:
        - High Confidence (8-10): Factual history, established science concepts, philosophy, standard math, riddles, or general logic.
        - Medium Confidence (5-7): Requires some specialized knowledge, but common patterns or standard practices might suffice.
        - Low Confidence (1-4): Requires real-time internet access (news, weather), specific live data, code execution, personal user data, or highly niche proprietary knowledge.

        STRICT CONSTRAINTS:
        - DO NOT attempt to answer the user's original query.
        - Your output must be EXACTLY one single line of text. No greetings, no line breaks, no filler text.
        - You must strictly adhere to the defined output format.

        OUTPUT FORMAT:
        [Score] | [A single-sentence explanation of why this score was given]

        ---
        INPUT OUTLINE TO ANALYZE:
        {State.get('input_outline', '')}
    """)
    response = llm.with_structured_output(score).invoke([prompt])
    return {'worker_responses': [{'confidence': response.confidence, 'description': response.description, 'type' : 'general'}]}

def mathematics_node(State: State):
    prompt = SystemMessage(content=f"""
        You are the "Mathematical Evaluator" node in an AI agent pipeline. 
        Your task is to analyze the provided query outline and determine a confidence score (from 1 to 10) indicating how strongly the user's request relies on         mathematical computation, formulas, algebraic reasoning, or numerical analysis to be solved.

        SCORING CALIBRATION:
        - High Confidence (8-10): Pure math problems, calculus, statistics, geometry, physics equations, or explicit numerical calculations.
        - Medium Confidence (5-7): Algorithmic logic, puzzles with quantitative elements, financial approximations, or tasks where math is a secondary component.
        - Low Confidence (1-4): Factual queries, creative writing, qualitative analysis, coding without numerical logic, or purely language-based reasoning.

        STRICT CONSTRAINTS:
        - DO NOT attempt to answer the user's original query or solve the math problem.
        - Your output must be EXACTLY one single line of text. No greetings, no line breaks, no filler text.
        - You must strictly adhere to the defined output format.

        OUTPUT FORMAT:
        [Score] | [A single-sentence explanation of why this score was given]

        ---
        INPUT OUTLINE TO ANALYZE:
        {State.get('input_outline', '')}
    """)
    response = llm.with_structured_output(score).invoke([prompt])
    return {'worker_responses': [{'confidence': response.confidence, 'description': response.description, 'type' : 'mathematics'}]}

def coding_node(State: State):
    prompt = SystemMessage(content=f"""
    You are the "Coding Solutions Evaluator" node in an AI agent pipeline. 
    Your task is to analyze the provided query outline and determine a confidence score (from 1 to 10) indicating how strongly the user's request requires  software programming, code generation, debugging, system architecture, or scripting to be resolved.

    SCORING CALIBRATION:
    - High Confidence (8-10): Requests to write code, debug errors, build web/app features, database queries (SQL), write scripts, or design software   architecture.
    - Medium Confidence (5-7): Requests for pseudocode, shell commands, explaining how a specific algorithm or tech stack works, or formatting data (e.g., JSON/ XML structures).
    - Low Confidence (1-4): Pure mathematical calculations, general knowledge facts, creative writing, or queries with no programming context.

    STRICT CONSTRAINTS:
    - DO NOT attempt to answer the user's original query or write the code requested.
    - Your output must be EXACTLY one single line of text. No greetings, no line breaks, no filler text.
    - You must strictly adhere to the defined output format.

    OUTPUT FORMAT:
    [Score] | [A single-sentence explanation of why this score was given]

    ---
    INPUT OUTLINE TO ANALYZE:
    {State.get('input_outline', '')}
    """)

    response = llm.with_structured_output(score).invoke([prompt])
    return {'worker_responses': [{'confidence': response.confidence, 'description': response.description, 'type' : 'coding'}]}

def instruction_node(State: State):
    prompt = SystemMessage(content=f"""
    You are the "Instruction Following Evaluator" node in an AI agent pipeline. 
    Your task is to analyze the provided query outline and determine a confidence score (from 1 to 10) indicating how heavily the user's request relies on  strict instruction following, such as adhering to specific formatting rules, word limits, stylistic constraints, or step-by-step procedures.
    
    SCORING CALIBRATION:
    - High Confidence (8-10): The request contains rigid constraints (e.g., "output in JSON", "under 50 words", "use these exact phrases"), complex conditional logic, or strict formatting mandates.
    - Medium Confidence (5-7): The request includes general guidelines, stylistic preferences (e.g., "write a professional email", "explain it simply"), or loose structural requests.
    - Low Confidence (1-4): Open-ended questions, simple factual lookups, or exploratory queries with no specific rules or boundaries provided by the user.
    
    STRICT CONSTRAINTS:
    - DO NOT attempt to answer the user's original query or execute the instructions.
    - Your output must be EXACTLY one single line of text. No greetings, no line breaks, no filler text.
    - You must strictly adhere to the defined output format.
    
    OUTPUT FORMAT:
    [Score] | [A single-sentence explanation of why this score was given]
    
    ---
    INPUT OUTLINE TO ANALYZE:
    {State.get('input_outline', '')}
    """)

    response = llm.with_structured_output(score).invoke([prompt])
    return {'worker_responses': [{'confidence': response.confidence, 'description': response.description, 'type' : 'instruction-following'}]}

def multimodal_node(State: State):
    prompt = SystemMessage(content=f"""
        You are the "Multimodal Evaluator" node in an AI agent pipeline. 
        Your task is to analyze the provided query outline and determine a confidence score (from 1 to 10) indicating how heavily the user's request relies on multimodal inputs or outputs (e.g., analyzing an image, processing video, generating pictures, reading audio, or complex spatial/visual formatting).

        SCORING CALIBRATION:
        - High Confidence (8-10): Explicit requests to generate images, analyze provided photos/videos, process audio files, or create visual charts and graphs.
        - Medium Confidence (5-7): Requests where visual aids are highly beneficial but not strictly mandated (e.g., "describe what this architecture looks like"), UI/UX layout mockups, or ASCII art.
        - Low Confidence (1-4): Standard text generation, code logic, pure math calculations, or factual questions that require no visual or auditory data.

        STRICT CONSTRAINTS:
        - DO NOT attempt to answer the user's original query or generate any multimodal content.
        - Your output must be EXACTLY one single line of text. No greetings, no line breaks, no filler text.
        - You must strictly adhere to the defined output format.

        OUTPUT FORMAT:
        [Score] | [A single-sentence explanation of why this score was given]

        ---
        INPUT OUTLINE TO ANALYZE:
        {State.get('input_outline', '')}
    """)
    response = llm.with_structured_output(score).invoke([prompt])
    return {'worker_responses': [{'confidence': response.confidence, 'description': response.description, 'type' : 'multimodal'}]}
def longcontext_node(State: State):
    prompt = SystemMessage(content=f"""
        You are the "Long Context Evaluator" node in an AI agent pipeline. 
        Your task is to analyze the provided query outline and determine a confidence score (from 1 to 10) indicating how heavily the user's request relies on processing massive amounts of text, reading large documents, analyzing entire codebases, or generating exceptionally long-form outputs.

        SCORING CALIBRATION:
        - High Confidence (8-10): Requests to summarize entire books/manuals, analyze provided PDFs or extensive logs, review massive repositories, find specific details in huge documents, or retain long-running chat history.
        - Medium Confidence (5-7): Requests to process standard-length articles, compare a few different web pages, or write long-form essays and reports.
        - Low Confidence (1-4): Short Q&A, quick factual lookups, simple math, debugging a small code snippet, or any query that requires little to no background context.

        STRICT CONSTRAINTS:
        - DO NOT attempt to answer the user's original query or process the context yourself.
        - Your output must be EXACTLY one single line of text. No greetings, no line breaks, no filler text.
        - You must strictly adhere to the defined output format.

        OUTPUT FORMAT:
        [Score] | [A single-sentence explanation of why this score was given]

        ---
        INPUT OUTLINE TO ANALYZE:
        {State.get('input_outline', '')}
    """)
    response = llm.with_structured_output(score).invoke([prompt])
    return {'worker_responses': [{'confidence': response.confidence, 'description': response.description, 'type' : 'long-context'}]}

def judge(State: State):
    confidence = State.get('worker_responses', [])
    sorted_ = sorted(confidence, key=lambda x : x['confidence'], reverse=True)
    sorted_confidence = sorted(confidence, key=lambda x : x['confidence'], reverse=True)[:3]
    prompt = SystemMessage(content=f"""
    You are explaining, directly to the end user, why their query has been matched to certain categories.

    STRICT CONSTRAINTS:
    - Write in second person, addressing the user directly ("Your query...").
    - Be concise — 2 to 3 sentences total.
    - Do NOT use step-by-step/instructional phrasing. Do not write it as instructions for another AI.
    - Do not restate the raw scores; explain the reasoning in plain language.

    OUTPUT FORMAT:
    A short paragraph (2-3 sentences) explaining what kind of query this is and why the top categories fit.

    ---
    INPUTS TO ANALYZE:
    Query Outline:
    {State.get('input_outline', '')}

    Top 3 Evaluator Scores:
    {'\n '.join([f"{r['confidence']}: {r['description']} : {r['type']}" for r in sorted_confidence])}
    """)
    response = llm.invoke([prompt])
    return {
        'top3suggestions' : [r['type'] for r in sorted_confidence],
        'verdict' : response.content.strip(),
        'sorted_confidence' : sorted_
    }
import { API_BASE, getToken, logout } from "./auth.js";

function authHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
    };
}

async function handle(res) {
    if (res.status === 401) {
        // Token expired mid-session — force back to logged-out state
        logout();
        throw new Error("Your session expired. Please log in again.");
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Request failed (${res.status})`);
    }
    if (res.status === 204) return null;
    return res.json();
}

/** POST /chat/ — send a prompt, get back { thread_id, verdict, top3 } */
export async function sendChatMessage(prompt, threadId = null) {
    const res = await fetch(`${API_BASE}/chat/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ prompt, thread_id: threadId })
    });
    return handle(res);
}

/** GET /threads/ — list current user's chat history, most recently active first */
export async function listThreads() {
    const res = await fetch(`${API_BASE}/threads/`, { headers: authHeaders() });
    return handle(res);
}

/** GET /chat/{thread_id}/messages — full message history for one thread */
export async function getThreadMessages(threadId) {
    const res = await fetch(`${API_BASE}/chat/${threadId}/messages`, { headers: authHeaders() });
    return handle(res);
}

/** DELETE /threads/{thread_id} — deletes a chat and all its messages */
export async function deleteThread(threadId) {
    const res = await fetch(`${API_BASE}/threads/${threadId}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    return handle(res);
}

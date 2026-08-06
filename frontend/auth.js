// Change this to your deployed backend URL in production (e.g. Render URL)
// export const API_BASE = "http://localhost:8000";
export const API_BASE = "https://ranker-3obf.onrender.com";

const TOKEN_KEY = "ai_leaderboard_token";

let currentUser = null; // { id, email } | null — populated on login / on page load if token exists

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function isLoggedIn() {
    return !!getToken();
}

export function getCurrentUser() {
    return currentUser;
}

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function logout() {
    localStorage.removeItem(TOKEN_KEY);
    currentUser = null;
}

/**
 * Logs in against POST /auth/login.
 * FastAPI's OAuth2PasswordRequestForm expects form-urlencoded data with
 * fields named "username" and "password" — NOT JSON.
 */
export async function login(email, password) {
    const body = new URLSearchParams();
    body.append("username", email);
    body.append("password", password);

    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Login failed. Check your email and password.");
    }

    const data = await res.json();
    setToken(data.access_token);
    await fetchCurrentUser();
    return currentUser;
}

/**
 * Registers against POST /auth/register (plain JSON body, per UserCreate schema),
 * then immediately logs in so the caller doesn't need a second round trip.
 */
export async function register(email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Registration failed.");
    }

    return login(email, password);
}

/** Calls GET /auth/me to populate currentUser. Logs out if the token is invalid/expired. */
export async function fetchCurrentUser() {
    const token = getToken();
    if (!token) {
        currentUser = null;
        return null;
    }

    const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        // Token expired or invalid — clear it so the UI falls back to logged-out state
        logout();
        return null;
    }

    currentUser = await res.json();
    return currentUser;
}

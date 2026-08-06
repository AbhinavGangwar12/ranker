// import { fetchTopModels as fetchReasoningModels } from "./fetch_reasoning.js";
// import { fetchTopModels as fetchMathsModels } from "./fetch_maths.js";
// import { fetchTopModels as fetchCodeModels } from "./fetch_code.js";
// import { fetchTopModels as fetchInstructionModels } from "./fetch_if.js";
// import { fetchTopModels as fetchMultiModels } from "./fetch_multi.js";
// import { fetchTopModels as fetchLongModels } from "./fetch_long.js";
// import { login, register, logout, isLoggedIn, getCurrentUser, fetchCurrentUser } from "./auth.js";
// import { sendChatMessage, listThreads, getThreadMessages, deleteThread } from "./api.js";

// const contentDiv = document.getElementById('main-content');

// // Maps each category to its fetch function + page title/subtitle
// const CATEGORIES = {
//     general: {
//         fetcher: fetchReasoningModels,
//         title: "Global Leaderboard (MMLU-Pro)",
//         subtitle: "Comprehensive benchmark analysis across top 10 models.",
//         footer: "Showing top 10 models based on TIGER-Lab MMLU-Pro benchmark."
//     },
//     mathematics: {
//         fetcher: fetchMathsModels,
//         title: "Mathematics Leaderboard (GSM8K)",
//         subtitle: "Top 10 models ranked by grade-school math benchmark performance.",
//         footer: "Showing top 10 models based on GSM8K benchmark."
//     },
//     code: {
//         fetcher: fetchCodeModels,
//         title: "Code Leaderboard (SWE-Bench)",
//         subtitle: "Top 10 models ranked by human evaluation of code generation performance.",
//         footer: "Showing top 10 models based on SWE-Bench benchmark."
//     },
//     "instruction-following": {
//         fetcher: fetchInstructionModels,
//         title: "Instruction Following Leaderboard (IFEval)",
//         subtitle: "Top 10 models ranked by performance on instruction following tasks.",
//         footer: "Showing top 10 models based on IFEval benchmark."
//     },
//     "multi-tasking": {
//         fetcher: fetchMultiModels,
//         title: "Multi-Tasking Leaderboard (MMMU)",
//         subtitle: "Top 10 models ranked by performance on multi-tasking benchmarks.",
//         footer: "Showing top 10 models based on MMMU benchmark."
//     },
//     "long-context": {
//         fetcher: fetchLongModels,
//         title: "Long Context Leaderboard (LongBench)",
//         subtitle: "Top 10 models ranked by performance on long-context benchmarks.",
//         footer: "Showing top 10 models based on LongBench benchmark."
//     }
// };

// let currentCategory = null;  // Prevents stale/out-of-order responses from overwriting a newer selection
// let currentThreadId = null;  // Active chat thread — null means "not started yet / new chat"

// const RANK_BADGE = [
//     "bg-[#ffd166] text-[#7a5200]", // 1st
//     "bg-[#e4e0d6] text-[#5c5647]", // 2nd
//     "bg-[#e9c9a8] text-[#7a4b1a]"  // 3rd
// ];

// // ---------------------------------------------------------------------------
// // Leaderboard rendering (unchanged behavior)
// // ---------------------------------------------------------------------------

// function renderTable(models, meta) {
//     if (!models || models.length === 0) {
//         contentDiv.innerHTML = `<div class="p-6 text-center text-ink-400">Failed to load leaderboard data.</div>`;
//         return;
//     }

//     let html = `
//         <div class="mb-6 flex flex-col md:flex-row md:items-end justify-between animate-slide-up gap-4">
//             <div>
//                 <h1 class="text-lg font-medium mb-1 text-ink-900">${meta.title}</h1>
//                 <p class="text-xs text-ink-500">${meta.subtitle}</p>
//             </div>
//             <div class="flex gap-2">
//                 <button class="flex items-center gap-2 px-4 py-2 text-sm bg-white rounded-lg hover:bg-cream-100 transition-colors text-ink-700">
//                     <i class="fa-solid fa-filter"></i>Filter
//                 </button>
//                 <button class="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors">
//                     <i class="fa-solid fa-download"></i>Export CSV
//                 </button>
//             </div>
//         </div>

//         <div class="flex flex-col gap-2 animate-fade-in">
//             ${models.map(model => `
//                 <div class="soft-card flex items-center gap-4 px-4 py-3">
//                     <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 ${RANK_BADGE[model.Rank - 1] || 'bg-cream-100 text-ink-500'}">${model.Rank}</span>
//                     <i class="fa-solid ${model.icon} text-ink-400 w-4 text-center"></i>
//                     <span class="font-medium text-ink-900 whitespace-nowrap">${model.Name}</span>
//                     ${model.Rank === 1 ? `<span class="bg-terracotta-100 text-terracotta-500 text-[10px] px-2 py-0.5 rounded-full font-medium hidden sm:inline-block">SOTA</span>` : ''}
//                     <span class="hidden md:inline text-sm text-ink-500 ml-2">${model.DataSource}</span>
//                     <div class="ml-auto flex items-center gap-3">
//                         <div class="w-20 h-1.5 bg-cream-100 rounded-full overflow-hidden hidden sm:block">
//                             <div class="h-full bg-teal-600 rounded-full transition-all duration-1000 ease-out" style="width: 0%" data-width="${model.scoreNum}%"></div>
//                         </div>
//                         <span class="font-medium text-teal-600 tabular-nums w-16 text-right">${model.Score}</span>
//                     </div>
//                 </div>
//             `).join('')}
//         </div>
//         <div class="text-center mt-6 text-sm text-ink-400">${meta.footer}</div>
//     `;
//     contentDiv.innerHTML = html;

//     setTimeout(() => {
//         document.querySelectorAll('[data-width]').forEach(el => {
//             el.style.width = el.getAttribute('data-width');
//         });
//     }, 50);
// }

// function setActiveNav(category) {
//     document.querySelectorAll('.nav-btn').forEach(btn => {
//         const isActive = btn.dataset.category === category;
//         btn.classList.toggle('bg-white', isActive);
//         btn.classList.toggle('text-teal-600', isActive);
//         btn.classList.toggle('font-medium', isActive);
//         btn.classList.toggle('text-ink-500', !isActive);
//     });
// }

// async function loadCategory(category) {
//     if (category === 'chat') {
//         currentCategory = category;
//         currentThreadId = null;
//         setActiveNav(category);
//         renderChatWindow();
//         return;
//     }

//     const meta = CATEGORIES[category];
//     if (!meta) return;

//     currentCategory = category;
//     setActiveNav(category);
//     contentDiv.innerHTML = `<div class="p-6 text-center text-ink-400">Loading leaderboard rankings...</div>`;

//     const models = await meta.fetcher();
//     if (currentCategory !== category) return; // stale response guard

//     renderTable(models, meta);
// }

// // ---------------------------------------------------------------------------
// // Auth: header button + login/register form
// // ---------------------------------------------------------------------------

// function renderAuthButton() {
//     const btn = document.getElementById('auth-btn');
//     const label = document.getElementById('auth-btn-label');
//     const icon = btn.querySelector('i');
//     const chatBtn = document.querySelector('.nav-btn[data-category="chat"]');

//     if (isLoggedIn() && getCurrentUser()) {
//         label.textContent = 'Log out';
//         icon.className = 'fa-solid fa-right-from-bracket text-lg w-5 text-center';
//         chatBtn.classList.remove('opacity-40', 'cursor-not-allowed');
//         chatBtn.removeAttribute('title');
//     } else {
//         label.textContent = 'Log in';
//         icon.className = 'fa-solid fa-right-to-bracket text-lg w-5 text-center';
//         chatBtn.classList.add('opacity-40', 'cursor-not-allowed');
//         chatBtn.title = 'Log in to access this feature';
//     }
// }

// function renderAuthView(mode = 'login') {
//     setActiveNav(null);
//     contentDiv.innerHTML = `
//         <div class="max-w-sm mx-auto mt-12 animate-slide-up">
//             <div class="soft-card p-6">
//                 <h1 class="text-lg font-medium text-ink-900 mb-1">${mode === 'login' ? 'Log in' : 'Create account'}</h1>
//                 <p class="text-xs text-ink-500 mb-5">${mode === 'login' ? 'Log in to use the Chat with us feature.' : 'Sign up to get started.'}</p>
//                 <div id="auth-error" class="hidden text-xs text-terracotta-500 bg-terracotta-100 rounded-lg px-3 py-2 mb-4"></div>
//                 <form id="auth-form" class="flex flex-col gap-3">
//                     <input type="email" id="auth-email" required placeholder="Email" autocomplete="email"
//                         class="bg-cream-50 border border-cream-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-600 text-ink-900" />
//                     <input type="password" id="auth-password" required minlength="6" placeholder="Password" autocomplete="current-password"
//                         class="bg-cream-50 border border-cream-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-600 text-ink-900" />
//                     <button type="submit" id="auth-submit-btn" class="bg-teal-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-teal-500 transition-colors">
//                         ${mode === 'login' ? 'Log in' : 'Sign up'}
//                     </button>
//                 </form>
//                 <p class="text-xs text-ink-500 mt-4 text-center">
//                     ${mode === 'login' ? "Don't have an account?" : "Already have an account?"}
//                     <button id="auth-toggle-btn" class="text-teal-600 font-medium hover:underline">${mode === 'login' ? 'Sign up' : 'Log in'}</button>
//                 </p>
//             </div>
//         </div>
//     `;

//     document.getElementById('auth-toggle-btn').addEventListener('click', () => {
//         renderAuthView(mode === 'login' ? 'register' : 'login');
//     });

//     document.getElementById('auth-form').addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const email = document.getElementById('auth-email').value.trim();
//         const password = document.getElementById('auth-password').value;
//         const errBox = document.getElementById('auth-error');
//         const btn = document.getElementById('auth-submit-btn');

//         errBox.classList.add('hidden');
//         btn.disabled = true;
//         btn.textContent = mode === 'login' ? 'Logging in...' : 'Signing up...';

//         try {
//             if (mode === 'login') await login(email, password);
//             else await register(email, password);

//             renderAuthButton();
//             loadCategory('chat'); // straight into the chat interface on success
//         } catch (err) {
//             errBox.textContent = err.message;
//             errBox.classList.remove('hidden');
//             btn.disabled = false;
//             btn.textContent = mode === 'login' ? 'Log in' : 'Sign up';
//         }
//     });
// }

// // ---------------------------------------------------------------------------
// // Chat with us: input/result split + history list
// // ---------------------------------------------------------------------------

// function renderResultBox({ verdict, top3 } = {}) {
//     const resultDiv = document.getElementById('chat-result');
//     if (!resultDiv) return;

//     if (!verdict) {
//         resultDiv.innerHTML = '';
//         return;
//     }

//     resultDiv.innerHTML = `
//         <div class="p-4">
//             <p class="text-sm text-ink-900 mb-4 leading-relaxed">${verdict}</p>
//             <div class="flex flex-col gap-2">
//                 ${(top3 || []).map(t => `
//                     <div class="bg-white rounded-lg p-3 border border-cream-200">
//                         <div class="flex items-center justify-between mb-1">
//                             <span class="font-medium text-sm text-ink-900 capitalize">${t.type.replace(/-/g, ' ')}</span>
//                             <span class="text-xs text-teal-600 font-medium">${t.confidence}/10</span>
//                         </div>
//                         <p class="text-xs text-ink-500">${t.description}</p>
//                     </div>
//                 `).join('')}
//             </div>
//         </div>
//     `;
// }

// function formatDate(isoString) {
//     const d = new Date(isoString);
//     return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' +
//            d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
// }

// async function loadHistory() {
//     const listDiv = document.getElementById('chat-history-list');
//     if (!listDiv) return;

//     listDiv.innerHTML = `<div class="text-xs text-ink-400 px-1">Loading chat history...</div>`;

//     try {
//         const threads = await listThreads();
//         if (!threads || threads.length === 0) {
//             listDiv.innerHTML = `<div class="text-xs text-ink-400 px-1">No chats yet — send a message to start one.</div>`;
//             return;
//         }

//         listDiv.innerHTML = threads.map(t => `
//             <div class="soft-card flex items-center justify-between px-4 py-3 cursor-pointer history-item" data-thread-id="${t.id}">
//                 <div class="min-w-0">
//                     <div class="text-sm text-ink-900 truncate">${t.title || 'Untitled chat'}</div>
//                     <div class="text-xs text-ink-400 mt-0.5">${formatDate(t.updated_at)}</div>
//                 </div>
//                 <button class="delete-thread-btn text-ink-400 hover:text-terracotta-500 flex-shrink-0 ml-3 px-2 py-1" data-thread-id="${t.id}" title="Delete this chat">
//                     <i class="fa-solid fa-trash"></i>
//                 </button>
//             </div>
//         `).join('');

//         listDiv.querySelectorAll('.history-item').forEach(item => {
//             item.addEventListener('click', () => openThread(item.dataset.threadId));
//         });
//         listDiv.querySelectorAll('.delete-thread-btn').forEach(btn => {
//             btn.addEventListener('click', async (e) => {
//                 e.stopPropagation();
//                 if (!confirm('Delete this chat? This cannot be undone.')) return;
//                 try {
//                     await deleteThread(btn.dataset.threadId);
//                     if (currentThreadId === btn.dataset.threadId) {
//                         currentThreadId = null;
//                         document.getElementById('chat-input').value = '';
//                         renderResultBox();
//                     }
//                     loadHistory();
//                 } catch (err) {
//                     alert(err.message);
//                 }
//             });
//         });
//     } catch (err) {
//         listDiv.innerHTML = `<div class="text-xs text-terracotta-500 px-1">${err.message}</div>`;
//     }
// }

// async function openThread(threadId) {
//     try {
//         const messages = await getThreadMessages(threadId);
//         const lastUser = [...messages].reverse().find(m => m.role === 'user');
//         const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');

//         currentThreadId = threadId;
//         document.getElementById('chat-input').value = lastUser ? lastUser.content : '';
//         renderResultBox(lastAssistant ? { verdict: lastAssistant.content, top3: lastAssistant.top3 } : {});
//     } catch (err) {
//         alert(err.message);
//     }
// }

// async function sendMessage() {
//     const input = document.getElementById('chat-input');
//     const sendBtn = document.getElementById('chat-send-btn');
//     const prompt = input.value.trim();
//     if (!prompt) return;

//     sendBtn.disabled = true;
//     sendBtn.innerHTML = `Sending... <i class="fa-solid fa-spinner fa-spin"></i>`;

//     try {
//         const result = await sendChatMessage(prompt, currentThreadId);
//         currentThreadId = result.thread_id;
//         renderResultBox(result);
//         input.value = '';
//         loadHistory();
//     } catch (err) {
//         renderResultBox({
//             verdict: `Something went wrong: ${err.message}`,
//             top3: []
//         });
//     } finally {
//         sendBtn.disabled = false;
//         sendBtn.innerHTML = `Send <i class="fa-solid fa-paper-plane"></i>`;
//     }
// }

// function renderChatWindow() {
//     contentDiv.innerHTML = `
//         <div class="mb-6 animate-slide-up">
//             <h1 class="text-lg font-medium mb-1 text-ink-900">Chat with us</h1>
//             <p class="text-xs text-ink-500">Enter your prompt on the left — we'll suggest which category fits it best.</p>
//         </div>
//         <div class="flex flex-col md:flex-row gap-4 min-h-[400px] animate-fade-in">
//             <div class="flex-1 soft-card p-4 flex flex-col">
//                 <label class="text-xs font-medium text-ink-500 mb-2">Your input</label>
//                 <textarea id="chat-input" class="flex-1 w-full resize-none bg-cream-50 rounded-lg p-3 text-sm text-ink-900 outline-none border border-cream-200" placeholder="Type something..."></textarea>
//                 <div class="flex items-center justify-between mt-3">
//                     <button id="chat-new-btn" class="text-xs text-ink-500 hover:text-ink-900 transition-colors">+ New chat</button>
//                     <button id="chat-send-btn" class="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors text-sm">
//                         Send <i class="fa-solid fa-paper-plane"></i>
//                     </button>
//                 </div>
//             </div>
//             <div class="flex-1 soft-card flex flex-col overflow-hidden">
//                 <label class="text-xs font-medium text-ink-500 px-4 pt-4">Result</label>
//                 <div id="chat-result" class="flex-1 w-full overflow-y-auto"></div>
//             </div>
//         </div>

//         <div class="mt-8 animate-fade-in">
//             <h2 class="text-sm font-medium text-ink-700 mb-3">Recent chats</h2>
//             <div id="chat-history-list" class="flex flex-col gap-2"></div>
//         </div>
//     `;

//     document.getElementById('chat-send-btn').addEventListener('click', sendMessage);
//     document.getElementById('chat-input').addEventListener('keydown', (e) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             sendMessage();
//         }
//     });
//     document.getElementById('chat-new-btn').addEventListener('click', () => {
//         currentThreadId = null;
//         document.getElementById('chat-input').value = '';
//         renderResultBox();
//     });

//     loadHistory();
// }

// // ---------------------------------------------------------------------------
// // Wiring
// // ---------------------------------------------------------------------------

// document.querySelectorAll('.nav-btn[data-category]').forEach(btn => {
//     btn.addEventListener('click', () => {
//         const category = btn.dataset.category;
//         if (category === 'chat' && !isLoggedIn()) {
//             renderAuthView('login');
//             return;
//         }
//         loadCategory(category);
//     });
// });

// document.getElementById('auth-btn').addEventListener('click', () => {
//     if (isLoggedIn()) {
//         logout();
//         renderAuthButton();
//         if (currentCategory === 'chat') loadCategory('general');
//     } else {
//         renderAuthView('login');
//     }
// });

// async function init() {
//     if (isLoggedIn()) {
//         await fetchCurrentUser(); // validates token, logs out silently if expired
//     }
//     renderAuthButton();
//     loadCategory('general');
// }

// window.addEventListener('DOMContentLoaded', init);


import { fetchTopModels as fetchReasoningModels } from "./fetch_reasoning.js";
import { fetchTopModels as fetchMathsModels } from "./fetch_maths.js";
import { fetchTopModels as fetchCodeModels } from "./fetch_code.js";
import { fetchTopModels as fetchInstructionModels } from "./fetch_if.js";
import { fetchTopModels as fetchMultiModels } from "./fetch_multi.js";
import { fetchTopModels as fetchLongModels } from "./fetch_long.js";
import { login, register, logout, isLoggedIn, getCurrentUser, fetchCurrentUser } from "./auth.js";
import { sendChatMessage, listThreads, getThreadMessages, deleteThread } from "./api.js";

const contentDiv = document.getElementById('main-content');

// Maps each category to its fetch function + page title/subtitle
const CATEGORIES = {
    general: {
        fetcher: fetchReasoningModels,
        title: "Global Leaderboard (MMLU-Pro)",
        subtitle: "Comprehensive benchmark analysis across top 10 models.",
        footer: "Showing top 10 models based on TIGER-Lab MMLU-Pro benchmark."
    },
    mathematics: {
        fetcher: fetchMathsModels,
        title: "Mathematics Leaderboard (GSM8K)",
        subtitle: "Top 10 models ranked by grade-school math benchmark performance.",
        footer: "Showing top 10 models based on GSM8K benchmark."
    },
    code: {
        fetcher: fetchCodeModels,
        title: "Code Leaderboard (SWE-Bench)",
        subtitle: "Top 10 models ranked by human evaluation of code generation performance.",
        footer: "Showing top 10 models based on SWE-Bench benchmark."
    },
    "instruction-following": {
        fetcher: fetchInstructionModels,
        title: "Instruction Following Leaderboard (IFEval)",
        subtitle: "Top 10 models ranked by performance on instruction following tasks.",
        footer: "Showing top 10 models based on IFEval benchmark."
    },
    "multi-tasking": {
        fetcher: fetchMultiModels,
        title: "Multi-Tasking Leaderboard (MMMU)",
        subtitle: "Top 10 models ranked by performance on multi-tasking benchmarks.",
        footer: "Showing top 10 models based on MMMU benchmark."
    },
    "long-context": {
        fetcher: fetchLongModels,
        title: "Long Context Leaderboard (LongBench)",
        subtitle: "Top 10 models ranked by performance on long-context benchmarks.",
        footer: "Showing top 10 models based on LongBench benchmark."
    }
};

let currentCategory = null;  // Prevents stale/out-of-order responses from overwriting a newer selection
let currentThreadId = null;  // Active chat thread — null means "not started yet / new chat"

const RANK_BADGE = [
    "bg-[#ffd166] text-[#7a5200]", // 1st
    "bg-[#e4e0d6] text-[#5c5647]", // 2nd
    "bg-[#e9c9a8] text-[#7a4b1a]"  // 3rd
];

// ---------------------------------------------------------------------------
// Leaderboard rendering
// ---------------------------------------------------------------------------

function downloadCSV(models, category) {
    const headers = ['Rank', 'Name', 'Source', 'Score'];
    const rows = models.map(m => [m.Rank, m.Name, m.DataSource, m.Score]);

    const escapeCell = (val) => {
        const str = String(val);
        // Quote any cell containing a comma, quote, or newline — standard CSV escaping
        return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const csv = [headers, ...rows].map(row => row.map(escapeCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${category}-leaderboard.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function renderTable(models, meta, category) {
    if (!models || models.length === 0) {
        contentDiv.innerHTML = `<div class="p-6 text-center text-ink-400">Failed to load leaderboard data.</div>`;
        return;
    }

    let html = `
        <div class="mb-6 flex flex-col md:flex-row md:items-end justify-between animate-slide-up gap-4">
            <div>
                <h1 class="text-lg font-medium mb-1 text-ink-900">${meta.title}</h1>
                <p class="text-xs text-ink-500">${meta.subtitle}</p>
            </div>
            <button id="export-csv-btn" class="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors">
                <i class="fa-solid fa-download"></i>Export CSV
            </button>
        </div>

        <div class="flex flex-col gap-2 animate-fade-in">
            ${models.map(model => `
                <div class="soft-card flex items-center gap-4 px-4 py-3">
                    <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 ${RANK_BADGE[model.Rank - 1] || 'bg-cream-100 text-ink-500'}">${model.Rank}</span>
                    <i class="fa-solid ${model.icon} text-ink-400 w-4 text-center"></i>
                    <span class="font-medium text-ink-900 truncate min-w-0">${model.Name}</span>
                    ${model.Rank === 1 ? `<span class="bg-terracotta-100 text-terracotta-500 text-[10px] px-2 py-0.5 rounded-full font-medium hidden sm:inline-block">SOTA</span>` : ''}
                    <span class="hidden md:inline text-sm text-ink-500 ml-2">${model.DataSource}</span>
                    <div class="ml-auto flex items-center gap-3">
                        <div class="w-20 h-1.5 bg-cream-100 rounded-full overflow-hidden hidden sm:block">
                            <div class="h-full bg-teal-600 rounded-full transition-all duration-1000 ease-out" style="width: 0%" data-width="${model.scoreNum}%"></div>
                        </div>
                        <span class="font-medium text-teal-600 tabular-nums w-16 text-right">${model.Score}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="text-center mt-6 text-sm text-ink-400">${meta.footer}</div>
    `;
    contentDiv.innerHTML = html;

    document.getElementById('export-csv-btn').addEventListener('click', () => downloadCSV(models, category));

    setTimeout(() => {
        document.querySelectorAll('[data-width]').forEach(el => {
            el.style.width = el.getAttribute('data-width');
        });
    }, 50);
}

function setActiveNav(category) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const isActive = btn.dataset.category === category;
        btn.classList.toggle('bg-white', isActive);
        btn.classList.toggle('text-teal-600', isActive);
        btn.classList.toggle('font-medium', isActive);
        btn.classList.toggle('text-ink-500', !isActive);
    });
}

async function loadCategory(category) {
    if (category === 'chat') {
        currentCategory = category;
        currentThreadId = null;
        setActiveNav(category);
        renderChatWindow();
        return;
    }

    const meta = CATEGORIES[category];
    if (!meta) return;

    currentCategory = category;
    setActiveNav(category);
    contentDiv.innerHTML = `<div class="p-6 text-center text-ink-400">Loading leaderboard rankings...</div>`;

    const models = await meta.fetcher();
    if (currentCategory !== category) return; // stale response guard

    renderTable(models, meta, category);
}

// ---------------------------------------------------------------------------
// Auth: header button + login/register form
// ---------------------------------------------------------------------------

function renderAuthButton() {
    const btn = document.getElementById('auth-btn');
    const label = document.getElementById('auth-btn-label');
    const icon = btn.querySelector('i');
    const chatBtn = document.querySelector('.nav-btn[data-category="chat"]');

    if (isLoggedIn() && getCurrentUser()) {
        label.textContent = 'Log out';
        icon.className = 'fa-solid fa-right-from-bracket text-lg w-5 text-center';
        chatBtn.classList.remove('opacity-40', 'cursor-not-allowed');
        chatBtn.removeAttribute('title');
    } else {
        label.textContent = 'Log in';
        icon.className = 'fa-solid fa-right-to-bracket text-lg w-5 text-center';
        chatBtn.classList.add('opacity-40', 'cursor-not-allowed');
        chatBtn.title = 'Log in to access this feature';
    }
}

function renderAuthView(mode = 'login') {
    setActiveNav(null);
    contentDiv.innerHTML = `
        <div class="max-w-sm mx-auto mt-12 animate-slide-up">
            <div class="soft-card p-6">
                <h1 class="text-lg font-medium text-ink-900 mb-1">${mode === 'login' ? 'Log in' : 'Create account'}</h1>
                <p class="text-xs text-ink-500 mb-5">${mode === 'login' ? 'Log in to use the Chat with us feature.' : 'Sign up to get started.'}</p>
                <div id="auth-error" class="hidden text-xs text-terracotta-500 bg-terracotta-100 rounded-lg px-3 py-2 mb-4"></div>
                <form id="auth-form" class="flex flex-col gap-3">
                    <input type="email" id="auth-email" required placeholder="Email" autocomplete="email"
                        class="bg-cream-50 border border-cream-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-600 text-ink-900" />
                    <input type="password" id="auth-password" required minlength="6" placeholder="Password" autocomplete="current-password"
                        class="bg-cream-50 border border-cream-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-600 text-ink-900" />
                    <button type="submit" id="auth-submit-btn" class="bg-teal-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-teal-500 transition-colors">
                        ${mode === 'login' ? 'Log in' : 'Sign up'}
                    </button>
                </form>
                <p class="text-xs text-ink-500 mt-4 text-center">
                    ${mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                    <button id="auth-toggle-btn" class="text-teal-600 font-medium hover:underline">${mode === 'login' ? 'Sign up' : 'Log in'}</button>
                </p>
            </div>
        </div>
    `;

    document.getElementById('auth-toggle-btn').addEventListener('click', () => {
        renderAuthView(mode === 'login' ? 'register' : 'login');
    });

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const errBox = document.getElementById('auth-error');
        const btn = document.getElementById('auth-submit-btn');

        errBox.classList.add('hidden');
        btn.disabled = true;
        btn.textContent = mode === 'login' ? 'Logging in...' : 'Signing up...';

        try {
            if (mode === 'login') await login(email, password);
            else await register(email, password);

            renderAuthButton();
            loadCategory('chat'); // straight into the chat interface on success
        } catch (err) {
            errBox.textContent = err.message;
            errBox.classList.remove('hidden');
            btn.disabled = false;
            btn.textContent = mode === 'login' ? 'Log in' : 'Sign up';
        }
    });
}

// ---------------------------------------------------------------------------
// Chat with us: input/result split + history list
// ---------------------------------------------------------------------------

function renderResultBox({ verdict, top3 } = {}) {
    const resultDiv = document.getElementById('chat-result');
    if (!resultDiv) return;

    if (!verdict) {
        resultDiv.innerHTML = '';
        return;
    }

    const sorted = [...(top3 || [])].sort((a, b) => b.confidence - a.confidence);

    const MIN_SIZE = 110;
    const MAX_SIZE = 190;

    const nodesHtml = sorted.map(t => {
        const scale = Math.max(0, Math.min(1, t.confidence / 10)); // clamp 0-1
        const size = Math.round(MIN_SIZE + scale * (MAX_SIZE - MIN_SIZE));
        const fontSize = Math.round(12 + scale * 6);
        const descFontSize = Math.round(9 + scale * 2);
        const tint = (0.06 + scale * 0.14).toFixed(2);
        const borderAlpha = (0.3 + scale * 0.5).toFixed(2);

        return `
            <div class="graph-node rounded-full flex flex-col items-center justify-center text-center p-3 overflow-hidden transition-transform hover:scale-105"
                 style="width:${size}px; height:${size}px; background: rgba(47,125,107,${tint}); border: 2px solid rgba(47,125,107,${borderAlpha});"
                 title="${t.description.replace(/"/g, '&quot;')}">
                <span class="font-semibold text-ink-900 capitalize leading-tight" style="font-size:${fontSize}px;">${t.type.replace(/-/g, ' ')}</span>
                <span class="text-teal-600 font-medium mt-0.5" style="font-size:${descFontSize + 1}px;">${t.confidence}/10</span>
                <p class="text-ink-500 mt-1 leading-tight px-1" style="font-size:${descFontSize}px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">${t.description}</p>
            </div>
        `;
    }).join('');

    resultDiv.innerHTML = `
        <div class="p-4">
            <div class="flex flex-wrap items-center justify-center gap-5 py-4">
                ${nodesHtml}
            </div>
            <div class="soft-card p-4 mt-2">
                <label class="text-xs font-medium text-ink-500 block mb-2">Verdict</label>
                <p class="text-sm text-ink-900 leading-relaxed">${verdict}</p>
            </div>
        </div>
    `;
}

function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' +
           d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

async function loadHistory() {
    const listDiv = document.getElementById('chat-history-list');
    if (!listDiv) return;

    listDiv.innerHTML = `<div class="text-xs text-ink-400 px-1">Loading chat history...</div>`;

    try {
        const threads = await listThreads();
        if (!threads || threads.length === 0) {
            listDiv.innerHTML = `<div class="text-xs text-ink-400 px-1">No chats yet — send a message to start one.</div>`;
            return;
        }

        listDiv.innerHTML = threads.map(t => `
            <div class="soft-card flex items-center justify-between px-4 py-3 cursor-pointer history-item" data-thread-id="${t.id}">
                <div class="min-w-0">
                    <div class="text-sm text-ink-900 truncate">${t.title || 'Untitled chat'}</div>
                    <div class="text-xs text-ink-400 mt-0.5">${formatDate(t.updated_at)}</div>
                </div>
                <button class="delete-thread-btn text-ink-400 hover:text-terracotta-500 flex-shrink-0 ml-3 px-2 py-1" data-thread-id="${t.id}" title="Delete this chat">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `).join('');

        listDiv.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => openThread(item.dataset.threadId));
        });
        listDiv.querySelectorAll('.delete-thread-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!confirm('Delete this chat? This cannot be undone.')) return;
                try {
                    await deleteThread(btn.dataset.threadId);
                    if (currentThreadId === btn.dataset.threadId) {
                        currentThreadId = null;
                        document.getElementById('chat-input').value = '';
                        renderResultBox();
                    }
                    loadHistory();
                } catch (err) {
                    alert(err.message);
                }
            });
        });
    } catch (err) {
        listDiv.innerHTML = `<div class="text-xs text-terracotta-500 px-1">${err.message}</div>`;
    }
}

async function openThread(threadId) {
    try {
        const messages = await getThreadMessages(threadId);
        const lastUser = [...messages].reverse().find(m => m.role === 'user');
        const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');

        currentThreadId = threadId;
        document.getElementById('chat-input').value = lastUser ? lastUser.content : '';
        renderResultBox(lastAssistant ? { verdict: lastAssistant.content, top3: lastAssistant.top3 } : {});
    } catch (err) {
        alert(err.message);
    }
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const prompt = input.value.trim();
    if (!prompt) return;

    sendBtn.disabled = true;
    sendBtn.innerHTML = `Sending... <i class="fa-solid fa-spinner fa-spin"></i>`;

    try {
        const result = await sendChatMessage(prompt, currentThreadId);
        currentThreadId = result.thread_id;
        renderResultBox(result);
        input.value = '';
        loadHistory();
    } catch (err) {
        renderResultBox({
            verdict: `Something went wrong: ${err.message}`,
            top3: []
        });
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `Send <i class="fa-solid fa-paper-plane"></i>`;
    }
}

function renderChatWindow() {
    contentDiv.innerHTML = `
        <div class="mb-6 animate-slide-up">
            <h1 class="text-lg font-medium mb-1 text-ink-900">Chat with us</h1>
            <p class="text-xs text-ink-500">Enter your prompt on the left — we'll suggest which category fits it best.</p>
        </div>
        <div class="flex flex-col md:flex-row gap-4 min-h-[400px] animate-fade-in">
            <div class="flex-1 soft-card p-4 flex flex-col">
                <label class="text-xs font-medium text-ink-500 mb-2">Your input</label>
                <textarea id="chat-input" class="flex-1 w-full resize-none bg-cream-50 rounded-lg p-3 text-sm text-ink-900 outline-none border border-cream-200" placeholder="Type something..."></textarea>
                <div class="flex items-center justify-between mt-3">
                    <button id="chat-new-btn" class="text-xs text-ink-500 hover:text-ink-900 transition-colors">+ New chat</button>
                    <button id="chat-send-btn" class="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors text-sm">
                        Send <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            <div class="flex-1 soft-card flex flex-col overflow-hidden">
                <label class="text-xs font-medium text-ink-500 px-4 pt-4">Result</label>
                <div id="chat-result" class="flex-1 w-full overflow-y-auto"></div>
            </div>
        </div>

        <div class="mt-8 animate-fade-in">
            <h2 class="text-sm font-medium text-ink-700 mb-3">Recent chats</h2>
            <div id="chat-history-list" class="flex flex-col gap-2"></div>
        </div>
    `;

    document.getElementById('chat-send-btn').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    document.getElementById('chat-new-btn').addEventListener('click', () => {
        currentThreadId = null;
        document.getElementById('chat-input').value = '';
        renderResultBox();
    });

    loadHistory();
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

document.querySelectorAll('.nav-btn[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        if (category === 'chat' && !isLoggedIn()) {
            renderAuthView('login');
            return;
        }
        loadCategory(category);
    });
});

document.getElementById('auth-btn').addEventListener('click', () => {
    if (isLoggedIn()) {
        logout();
        renderAuthButton();
        if (currentCategory === 'chat') loadCategory('general');
    } else {
        renderAuthView('login');
    }
});

function setHeaderGreeting() {
    const el = document.getElementById('header-greeting');
    if (!el) return;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    el.textContent = `${greeting} — here's what's trending in AI models today.`;
}

async function init() {
    setHeaderGreeting();
    if (isLoggedIn()) {
        await fetchCurrentUser(); // validates token, logs out silently if expired
    }
    renderAuthButton();
    loadCategory('general');
}

window.addEventListener('DOMContentLoaded', init);
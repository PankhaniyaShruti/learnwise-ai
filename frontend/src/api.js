const API_BASE_URL = import.meta.env.DEV ? "http://127.0.0.1:8000" : "";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "Something went wrong. Please try again.");
  }
  return data;
}

export async function learnTopic(topic, mode = "simple", userEmail) {
  return request("/api/learn", {
    method: "POST",
    body: JSON.stringify({ topic: topic.trim(), mode, user_email: userEmail }),
  });
}

export async function submitQuiz(sessionId, answers, userEmail) {
  return request("/api/quiz/submit", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, answers, user_email: userEmail }),
  });
}

export async function getHistory(email, limit = 20) {
  return request(`/api/history?email=${encodeURIComponent(email)}&limit=${limit}`, { method: "GET" });
}

export async function getHistoryItem(sessionId) {
  return request(`/api/history/${sessionId}`, { method: "GET" });
}

export async function getQuizHistory(email, limit = 20) {
  return request(`/api/quiz/history?email=${encodeURIComponent(email)}&limit=${limit}`, { method: "GET" });
}

export async function getProgress(email) {
  return request(`/api/progress?email=${encodeURIComponent(email)}`, { method: "GET" });
}

export async function checkHealth() {
  return request("/api/health", { method: "GET" });
}
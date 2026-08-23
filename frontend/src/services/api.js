const API_BASE_URL = "http://127.0.0.1:8000";

export async function generateLesson(topic, mode = "simple") {
  const response = await fetch(`${API_BASE_URL}/api/learn`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: topic.trim(),
      mode,
    }),
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response received from the server.");
  }

  if (!response.ok) {
    throw new Error(
      data?.detail || "Failed to generate the lesson. Please try again."
    );
  }

  if (
    !data ||
    typeof data.explanation !== "string" ||
    !Array.isArray(data.key_concepts) ||
    !Array.isArray(data.quiz)
  ) {
    throw new Error("The AI returned an invalid lesson format.");
  }

  return data;
}

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error("Backend is not available.");
  }

  return response.json();
}
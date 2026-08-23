function Lesson({ explanation, topic, mode }) {
  if (!explanation) return null;

  // IMPORTANT FIX: Convert literal \n to actual newlines before splitting
  const normalizedText = explanation.replace(/\\n/g, '\n');
  const lines = normalizedText.split('\n').map((line) => line.trim()).filter(Boolean);

  return (
    <section className="card lesson-card">
      <div className="section-number">01 · LESSON</div>
      <div className="lesson-header">
        <div>
          <h2>{topic || "Your Lesson"}</h2>
        </div>
      </div>
      <div className="lesson-content">
        {lines.map((line, index) => {
          // Main markdown heading
          if (line.startsWith("# ")) {
            return <h3 key={index}>{line.replace(/^#\s*/, "")}</h3>;
          }
          // Secondary markdown heading
          if (line.startsWith("## ")) {
            return <h4 key={index}>{line.replace(/^##\s*/, "")}</h4>;
          }
          // Numbered list
          if (/^\d+\.\s/.test(line)) {
            return (
              <div className="lesson-numbered" key={index} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--accent)' }}>{line.match(/^\d+/)?.[0]}.</strong>
                <p style={{ margin: 0 }}>{line.replace(/^\d+\.\s*/, "").replace(/\*\*/g, "")}</p>
              </div>
            );
          }
          // Bullet list
          if (line.startsWith("- ") || line.startsWith("* ")) {
            return (
              <div className="lesson-bullet" key={index} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--accent)' }}>•</strong>
                <p style={{ margin: 0 }}>{line.replace(/^[-*]\s*/, "").replace(/\*\*/g, "")}</p>
              </div>
            );
          }
          // Normal paragraph (removing leftover ** markdown for bolding temporarily)
          return <p key={index}>{line.replace(/\*\*/g, "")}</p>;
        })}
      </div>
    </section>
  );
}

export default Lesson;
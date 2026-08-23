import { useState } from "react";
import { submitQuiz } from "../api";

// NAYA: userEmail prop accept kar rahe hain
function Quiz({ quiz, sessionId, userEmail }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function selectAnswer(questionIndex, answer) {
    if (result) return;
    setAnswers((previous) => ({
      ...previous,
      [questionIndex]: answer,
    }));
  }

  async function handleSubmit() {
    if (Object.keys(answers).length !== quiz.length) {
      setError("Please answer all questions before submitting.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const formattedAnswers = Object.entries(answers).map(([questionIndex, selectedAnswer]) => ({
        question_index: Number(questionIndex),
        selected_answer: selectedAnswer,
      }));
      
      // NAYA: API ko userEmail bhej rahe hain
      const data = await submitQuiz(sessionId, formattedAnswers, userEmail);
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function retryQuiz() {
    setAnswers({});
    setResult(null);
    setError("");
  }

  if (!quiz?.length) return null;

  return (
    <div className="card quiz-card">
      <p className="section-number">03 · KNOWLEDGE CHECK</p>
      <h2>Test your understanding</h2>
      <p className="quiz-subtitle">Choose the best answer for each question.</p>

      {quiz.map((question, questionIndex) => {
        const selected = answers[questionIndex];

        return (
          <div className="question" key={questionIndex} style={{ marginTop: '30px', borderBottom: '1px solid var(--line)', paddingBottom: '20px' }}>
            <div className="question-label" style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
              Question {questionIndex + 1}
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>{question.question}</h3>

            <div className="options">
              {question.options.map((option, optionIndex) => {
                const isSelected = selected === option;
                const isCorrect = result && option === question.correct_answer;
                const isWrong = result && isSelected && option !== question.correct_answer;

                let className = "option";
                if (isSelected) className += " selected";
                if (isCorrect) className += " correct";
                if (isWrong) className += " wrong";

                return (
                  <button
                    key={option}
                    className={className}
                    onClick={() => selectAnswer(questionIndex, option)}
                    disabled={Boolean(result)}
                    type="button"
                  >
                    <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                    <span style={{ marginLeft: "10px" }}>{option}</span>
                  </button>
                );
              })}
            </div>

            {result && (
              <p className="answer" style={{ marginTop: '15px', background: 'var(--paper)', padding: '10px', borderRadius: '6px' }}>
                Correct answer: <strong>{question.correct_answer}</strong>
              </p>
            )}
          </div>
        );
      })}

      {error && <div className="error">{error}</div>}

      {!result ? (
        <button className="submit-quiz" onClick={handleSubmit} disabled={submitting} type="button">
          {submitting ? "Evaluating..." : "Check My Answers"}
        </button>
      ) : (
        <div className="quiz-result" style={{ textAlign: 'center', marginTop: '30px' }}>
          <div className="score-number" style={{ fontSize: '48px', color: 'var(--accent)', fontFamily: 'var(--serif)' }}>
            {result.percentage}%
          </div>
          <h3>{result.performance}</h3>
          <p>You scored <strong>{result.score}/{result.total}</strong></p>

          {result.weak_concepts?.length > 0 && (
            <div className="weak-result" style={{ marginTop: '20px', textAlign: 'left', background: 'var(--paper)', padding: '20px', borderRadius: '8px' }}>
              <strong>Focus on:</strong>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                {result.weak_concepts.map((concept) => (
                  <span key={concept} style={{ background: 'var(--accent-soft)', color: 'var(--accent-dark)', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button className="retry-button" onClick={retryQuiz} type="button" style={{ marginTop: '20px' }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default Quiz;
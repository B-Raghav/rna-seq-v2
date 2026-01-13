import { useState } from "react";
import PropTypes from "prop-types";

export default function CodeBlock({ code, language, onRun }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRun = async () => {
    setLoading(true);
    setError("");
    try {
      const output = await onRun(code);
      setResult(output);
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Could not run code");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="code-card">
      <div className="code-card__header">
        <span>{language || "code"}</span>
        <button type="button" onClick={handleRun} disabled={loading}>
          {loading ? "Running…" : "Run"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
      {error && <p className="error-text">{error}</p>}
      {result && (
        <div className="run-output">
          {result.stdout && (
            <div>
              <h4>stdout</h4>
              <pre>{result.stdout}</pre>
            </div>
          )}
          {result.error && (
            <div>
              <h4>error</h4>
              <pre>{result.error}</pre>
            </div>
          )}
          {result.image_base64 && (
            <img src={`data:image/png;base64,${result.image_base64}`} alt="Plot" />
          )}
        </div>
      )}
    </div>
  );
}

CodeBlock.propTypes = {
  code: PropTypes.string.isRequired,
  language: PropTypes.string,
  onRun: PropTypes.func.isRequired,
};

CodeBlock.defaultProps = {
  language: "",
};

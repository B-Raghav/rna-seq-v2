import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./components/CodeBlock.jsx";
import MessageBubble from "./components/MessageBubble.jsx";
import ChatInput from "./components/ChatInput.jsx";
import "./styles/app.css";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  const runPython = useCallback(async (code) => {
    const { data } = await axios.post(`${API_BASE}/run-code`, { code });
    return data;
  }, []);

  const markdownComponents = useMemo(
    () => ({
      code({ inline, className, children, ...props }) {
        const language = className?.replace("language-", "") ?? "";
        const content = String(children).replace(/\n$/, "");
        if (inline) {
          return (
            <code className={className} {...props}>
              {content}
            </code>
          );
        }
        return (
          <CodeBlock code={content} language={language} onRun={runPython} />
        );
      },
    }),
    [runPython]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const handleAsk = async (text) => {
    const question = text.trim();
    if (!question) return;
    setError("");
    setMessages((prev) => [
      ...prev,
      {
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
        role: "user",
        content: question,
      },
    ]);
    setIsLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/chat`, { question });
      setMessages((prev) => [
        ...prev,
        {
          id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-a`,
          role: "assistant",
          content: data.answer,
          sources: data.sources ?? [],
        },
      ]);
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Unable to fetch answer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <h1>RNA-seq Assistant</h1>
      </header>

      <main className="chat-shell">
        <section className="chat-window" ref={scrollRef}>
          {messages.length === 0 && !isLoading && (
            <div className="empty-state">
              <p>Ask a question about RNA-seq analysis...</p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} role={msg.role} sources={msg.sources}>
              <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
            </MessageBubble>
          ))}

          {isLoading && <div className="typing">Thinking...</div>}
        </section>

        <ChatInput disabled={isLoading} onSubmit={handleAsk} />

        {error && <div className="error-banner">{error}</div>}
      </main>
    </div>
  );
}

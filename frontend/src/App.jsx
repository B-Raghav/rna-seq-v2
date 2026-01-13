import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./components/CodeBlock.jsx";
import MessageBubble from "./components/MessageBubble.jsx";
import ChatInput from "./components/ChatInput.jsx";
import MindMap from "./components/MindMap.jsx";
import "./styles/app.css";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

// Icons as SVG components
const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

const SummaryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="9" y1="9" x2="15" y2="9"></line>
    <line x1="9" y1="13" x2="15" y2="13"></line>
    <line x1="9" y1="17" x2="12" y2="17"></line>
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const CodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

export default function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const scrollRef = useRef(null);

  // Playground state
  const [playgroundCode, setPlaygroundCode] = useState(`# Python Playground\n# Write your code here and click Run\n\nimport numpy as np\nimport matplotlib.pyplot as plt\n\n# Example: Create a simple plot\nx = np.linspace(0, 10, 100)\ny = np.sin(x)\n\nplt.figure(figsize=(8, 5))\nplt.plot(x, y, 'b-', linewidth=2)\nplt.xlabel('X axis')\nplt.ylabel('Y axis')\nplt.title('Sine Wave')\nplt.grid(True)\nplt.tight_layout()\nplt.show()`);
  const [playgroundResult, setPlaygroundResult] = useState(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundError, setPlaygroundError] = useState("");

  const runPython = useCallback(async (code) => {
    const { data } = await axios.post(`${API_BASE}/run-code`, { code });
    return data;
  }, []);

  // Summary/Mind Map State
  const [analysisData, setAnalysisData] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const generateSummary = useCallback(async () => {
    setIsSummaryLoading(true);
    setSummaryError("");
    setAnalysisData(null);
    try {
      const { data } = await axios.post(`${API_BASE}/summary`, {});
      setAnalysisData(data);
    } catch (err) {
      setSummaryError(err?.response?.data?.detail ?? "Failed to generate summary.");
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  // Auto-fetch summary and files on startup
  useEffect(() => {
    generateSummary();
    fetchFiles();
  }, [generateSummary]);

  const fetchFiles = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/files`);
      if (data.files) setFiles(data.files);
    } catch (err) {
      console.error("Failed to fetch files", err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API_BASE}/upload-pdf`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // Refresh file list
      await fetchFiles();
      alert("PDF uploaded and indexed successfully!");
    } catch (err) {
      alert("Failed to upload PDF: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
      // Clear input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAction = (action) => {
    if (action === "summary") {
      setActiveTab("summary");
      if (!analysisData && !isSummaryLoading) {
        generateSummary();
      }
    } else if (action === "ask") {
      setActiveTab("chat");
    } else if (action === "playground") {
      setActiveTab("playground");
    }
  };

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

  const runPlaygroundCode = async () => {
    setPlaygroundLoading(true);
    setPlaygroundError("");
    setPlaygroundResult(null);
    try {
      const { data } = await axios.post(`${API_BASE}/run-code`, { code: playgroundCode });
      setPlaygroundResult(data);
      if (data.error) {
        setPlaygroundError(data.error);
      }
    } catch (err) {
      setPlaygroundError(err?.response?.data?.detail ?? "Failed to run code");
    } finally {
      setPlaygroundLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <span className="header-icon">📖</span>
        <h1>AI Knowledge Assistant</h1>
        <span className="header-subtitle">Ask questions and get summaries from your educational content</span>
      </header>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Knowledge Base Card */}
          <div className="card">
            <div className="card-header">
              <BookIcon />
              Knowledge Base
            </div>
            <div className="topic-row">
              <span className="topic-label">Available Topics</span>
              <span className="topic-count">{files.length || 1}</span>
            </div>
            <div className="file-list" style={{ marginBottom: "10px", maxHeight: "150px", overflowY: "auto" }}>
              {files.length === 0 ? (
                <div className="empty-message">
                  <span>RNA-seq Tutorial PDF loaded</span>
                  <small>Default content</small>
                </div>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: "10px 0", fontSize: "0.85rem" }}>
                  {files.map((f, i) => (
                    <li key={i} style={{ padding: "4px 0", borderBottom: "1px solid #eee" }}>📄 {f}</li>
                  ))}
                </ul>
              )}
            </div>
            <input
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              className="btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Add PDF"}
            </button>
            <button
              className="btn-text"
              style={{ marginTop: "10px", width: "100%", textAlign: "center", background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "0.8rem" }}
              onClick={() => setActiveTab("chat")}
            >
              Go to Chat →
            </button>
          </div>

          {/* Actions Card */}
          <div className="card">
            <div className="actions-title">
              <span>A</span>ctions
            </div>
            <button className="action-btn" onClick={() => handleAction("summary")}>
              <SummaryIcon />
              Create Summary
            </button>
            <button className="action-btn" onClick={() => handleAction("ask")}>
              <ChatIcon />
              Ask Questions
            </button>
            <button className="action-btn" onClick={() => handleAction("playground")}>
              <CodeIcon />
              Open Playground
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === "home" ? "active" : ""}`}
              onClick={() => setActiveTab("home")}
            >
              Home
            </button>
            <button
              className={`tab ${activeTab === "summary" ? "active" : ""}`}
              onClick={() => setActiveTab("summary")}
            >
              Summary
            </button>
            <button
              className={`tab ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              Q&A Chat
            </button>
            <button
              className={`tab ${activeTab === "playground" ? "active" : ""}`}
              onClick={() => setActiveTab("playground")}
            >
              Playground
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === "home" && (
              <div className="home-intro">
                <div className="intro-header">
                  <BookIcon />
                  <h2>Welcome to AI Knowledge Assistant</h2>
                </div>
                <p className="intro-text">
                  Your intelligent companion for exploring and understanding RNA-seq data analysis.
                  This tool uses AI-powered Retrieval Augmented Generation (RAG) to answer your questions
                  based on educational content.
                </p>

                <div className="features-grid">
                  <div className="feature-card">
                    <ChatIcon />
                    <h4>Q&A Chat</h4>
                    <p>Ask questions about RNA-seq concepts and get AI-powered answers based on the loaded PDF content.</p>
                  </div>
                  <div className="feature-card">
                    <SummaryIcon />
                    <h4>Summary</h4>
                    <p>Generate concise summaries of complex topics from your educational materials.</p>
                  </div>
                  <div className="feature-card">
                    <CodeIcon />
                    <h4>Playground</h4>
                    <p>Write and execute Python code for data visualization and analysis with matplotlib and numpy.</p>
                  </div>
                </div>

                <div className="getting-started">
                  <h4>Getting Started</h4>
                  <p>Click on <strong>Q&A Chat</strong> to start asking questions, or try the <strong>Playground</strong> to run Python code!</p>
                </div>
              </div>
            )}

            {activeTab === "summary" && (
              <div className="summary-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {isSummaryLoading && (
                  <div className="loading-state">
                    <SummaryIcon />
                    <h3>Generating Mind Map...</h3>
                    <p>This may take a minute.</p>
                  </div>
                )}

                {summaryError && (
                  <div className="error-banner">{summaryError} <button onClick={generateSummary}>Retry</button></div>
                )}

                {!isSummaryLoading && !analysisData && !summaryError && (
                  <div className="empty-state">
                    <SummaryIcon />
                    <h3>Mind Map</h3>
                    <button className="btn-primary" onClick={generateSummary}>
                      Generate Analysis
                    </button>
                  </div>
                )}

                {analysisData && (
                  <>
                    <div className="mindmap-area" style={{ flex: '1', borderBottom: '1px solid #eee' }}>
                      <MindMap data={analysisData} onNodeClick={setSelectedTopic} />
                    </div>
                    <div className="topic-detail-panel" style={{ height: '30%', padding: '20px', overflowY: 'auto', background: '#f9f9f9' }}>
                      {selectedTopic ? (
                        <div className="slide-up-content">
                          <h3>{selectedTopic.label}</h3>
                          <p>{selectedTopic.content}</p>
                        </div>
                      ) : (
                        <div className="placeholder-text" style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>
                          Select a node to view details
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "chat" && (
              <>
                <section className="chat-window" ref={scrollRef}>
                  {messages.length === 0 && !isLoading && (
                    <div className="empty-state">
                      <ChatIcon />
                      <h3>Start a conversation</h3>
                      <p>Ask anything about RNA-seq analysis...</p>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} role={msg.role} sources={msg.sources}>
                      <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                    </MessageBubble>
                  ))}

                  {isLoading && <div className="typing">Thinking...</div>}
                </section>

                <div className="chat-input-container">
                  <ChatInput disabled={isLoading} onSubmit={handleAsk} />
                </div>

                {error && <div className="error-banner">{error}</div>}
              </>
            )}

            {activeTab === "playground" && (
              <div className="playground-container">
                <div className="playground-header">
                  <div className="playground-title">
                    <CodeIcon />
                    <span>Python Playground</span>
                  </div>
                  <button
                    className="btn-run"
                    onClick={runPlaygroundCode}
                    disabled={playgroundLoading}
                  >
                    <PlayIcon />
                    {playgroundLoading ? "Running..." : "Run Code"}
                  </button>
                </div>
                <textarea
                  className="playground-editor"
                  value={playgroundCode}
                  onChange={(e) => setPlaygroundCode(e.target.value)}
                  spellCheck="false"
                />
                {playgroundError && (
                  <div className="playground-error">{playgroundError}</div>
                )}
                {playgroundResult && (
                  <div className="playground-output">
                    {playgroundResult.stdout && (
                      <div className="output-section">
                        <h4>Output</h4>
                        <pre>{playgroundResult.stdout}</pre>
                      </div>
                    )}
                    {playgroundResult.image_base64 && (
                      <div className="output-section">
                        <h4>Plot</h4>
                        <img
                          src={`data:image/png;base64,${playgroundResult.image_base64}`}
                          alt="Plot output"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


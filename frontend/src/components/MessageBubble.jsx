import PropTypes from "prop-types";
import SourcesList from "./SourcesList.jsx";

export default function MessageBubble({ role, children, sources }) {
  return (
    <div className={`message message-${role}`}>
      <div className="message-meta">
        <span>{role === "user" ? "You" : "Assistant"}</span>
      </div>
      <div className="message-body">{children}</div>
      {role === "assistant" && sources?.length > 0 && <SourcesList items={sources} />}
    </div>
  );
}

MessageBubble.propTypes = {
  role: PropTypes.oneOf(["user", "assistant"]).isRequired,
  children: PropTypes.node.isRequired,
  sources: PropTypes.arrayOf(
    PropTypes.shape({
      chunk: PropTypes.string,
    })
  ),
};

MessageBubble.defaultProps = {
  sources: [],
};

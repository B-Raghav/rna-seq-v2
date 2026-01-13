import { useState } from "react";
import PropTypes from "prop-types";

export default function ChatInput({ disabled, onSubmit }) {
  const [value, setValue] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!value.trim()) return;
    onSubmit(value);
    setValue("");
  };

  const handleKeyDown = (event) => {
    // Enter without Shift sends the message
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit(value);
        setValue("");
      }
    }
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        rows={2}
        placeholder="Ask a question..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  );
}

ChatInput.propTypes = {
  disabled: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
};

ChatInput.defaultProps = {
  disabled: false,
};

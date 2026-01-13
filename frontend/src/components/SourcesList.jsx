import PropTypes from "prop-types";

export default function SourcesList({ items }) {
  return (
    <details className="sources">
      <summary>Show sources</summary>
      <ul>
        {items.map((item, idx) => (
          <li key={`${idx}-${item.chunk.slice(0, 20)}`}>
            <p>{item.chunk}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}

SourcesList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      chunk: PropTypes.string.isRequired,
    })
  ).isRequired,
};

import React, { useState } from "react";

export default function ExpandableText({ text, maxChars = 140 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;

  const isLong = text.length > maxChars;
  const displayText = isExpanded || !isLong ? text : text.slice(0, maxChars) + "...";

  return (
    <p style={{ fontSize: "12px", color: "#334155", lineHeight: 1.4, marginBottom: "6px", wordBreak: "break-word" }}>
      {displayText}{" "}
      {isLong && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
          style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 800, fontSize: "11px", cursor: "pointer", padding: 0 }}
        >
          {isExpanded ? "See Less" : "See More"}
        </button>
      )}
    </p>
  );
};

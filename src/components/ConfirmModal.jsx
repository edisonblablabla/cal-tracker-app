import React from "react";

export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "#ef4444",
  icon = "fa-triangle-exclamation",
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box"
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "340px",
          padding: "24px 20px 20px 20px",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
          border: "1px solid #f1f5f9",
          textAlign: "center",
          boxSizing: "border-box"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon Circle */}
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: confirmColor === "#ef4444" ? "rgba(239, 68, 68, 0.1)" : "rgba(2, 132, 199, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px auto"
          }}
        >
          <i
            className={"fa-solid " + icon}
            style={{
              fontSize: "22px",
              color: confirmColor
            }}
          ></i>
        </div>

        <h3
          style={{
            margin: "0 0 8px 0",
            fontSize: "17px",
            fontWeight: 900,
            color: "#0f172a",
            letterSpacing: "-0.2px"
          }}
        >
          {title}
        </h3>

        <p
          style={{
            margin: "0 0 20px 0",
            fontSize: "13px",
            color: "#64748b",
            lineHeight: 1.45
          }}
        >
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "11px",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 800,
              color: "#64748b",
              cursor: "pointer"
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "11px",
              background: confirmColor,
              border: "none",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 800,
              color: "#ffffff",
              cursor: "pointer",
              boxShadow: "0 4px 12px " + (confirmColor === "#ef4444" ? "rgba(239, 68, 68, 0.3)" : "rgba(2, 132, 199, 0.3)")
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

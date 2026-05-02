"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/simulation/engine";

export function Chat({ messages, onSend }: { messages: ChatMessage[]; onSend: (text: string) => void }) {
  const [value, setValue] = useState("");

  function submit() {
    const next = value.trim();
    if (!next) return;
    onSend(next);
    setValue("");
  }

  function roleColor(role: ChatMessage["role"]) {
    if (role === "user") return "var(--stoic)";
    if (role === "oracle") return "var(--gold)";
    if (role === "system") return "var(--purple)";
    return "var(--t1)";
  }

  return (
    <div className="cell flex-col gap10">
      <div className="section-hed">Live Chat</div>
      <div style={{ maxHeight: 240, overflow: "auto" }}>
        {messages.slice(0, 12).map((msg) => (
          <div key={msg.id} className="body-xs" style={{ marginBottom: 6 }}>
            <strong style={{ color: roleColor(msg.role) }}>{msg.author}</strong>{" "}
            <span>{msg.content}</span>
          </div>
        ))}
      </div>
      <div className="flex gap8">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Type message..."
          className="mono-sm"
          style={{
            flex: 1,
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--t1)",
            padding: "8px 10px",
          }}
        />
        <button className="nbtn fill" onClick={submit} type="button">
          Send
        </button>
      </div>
    </div>
  );
}

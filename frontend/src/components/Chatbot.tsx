import React, { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};


// Use a stable model name compatible with v1beta
const PRIMARY_MODEL = "gemini-1.5-flash"; // previously used -latest which can 404
const FALLBACK_MODEL = "gemini-1.0-pro";  // simple text model fallback

function buildEndpoint(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in environment");
  }

  // Try primary model first
  let resp = await fetch(`${buildEndpoint(PRIMARY_MODEL)}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
          role: "user",
        },
      ],
    }),
  });

  if (!resp.ok) {
    // If model not found/unsupported, try fallback
    const status = resp.status;
    try {
      const data = await resp.json();
      const message = data?.error?.message || resp.statusText;
      if (status === 404 || /not found|not supported/i.test(message)) {
        resp = await fetch(`${buildEndpoint(FALLBACK_MODEL)}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }], role: "user" }],
          }),
        });
      }
      if (!resp.ok) {
        throw new Error(`Gemini error: ${status} ${message}`);
      }
    } catch (e: any) {
      // if parsing failed and not retried, surface original
      if (!resp.ok) {
        throw new Error(`Gemini error: ${status} ${resp.statusText}`);
      }
    }
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text.trim();
}

const Chatbot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Hi! I’m your CivicReport assistant. Ask me about reporting issues, dashboards, or how the app works.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const reply = await callGemini(
        `You are a helpful assistant for the Civic Issue Reporter app. Be concise and specific to the app's features. User: ${trimmed}`
      );
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply || "I couldn't generate a response right now.",
      };
      setMessages((m) => [...m, botMsg]);
    } catch (e: any) {
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: e?.message || "Something went wrong calling Gemini.",
      };
      setMessages((m) => [...m, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chatbot"
        className="fixed bottom-6 right-6 z-50 rounded-full civic-gradient text-white shadow-lg px-4 py-3 hover:opacity-90"
      >
        {open ? "Close Chat" : "Chat"}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 max-h-[70vh] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 font-semibold">CivicReport Assistant</div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-blue-50 text-blue-900 self-end rounded-lg p-2"
                    : "bg-gray-100 text-gray-900 rounded-lg p-2"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="text-xs text-muted-foreground">Thinking…</div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="p-2 border-t flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about using the app…"
              className="flex-1 rounded-md border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring"
            />
            <button
              onClick={send}
              disabled={loading}
              className="rounded-md civic-gradient text-white px-3 text-sm disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;



import React, { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// Models to try in order (availability varies by API key/region)
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash",
  "gemini-2.5-flash",
];

function buildEndpoint(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in environment");
  }

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
  });
  const opts = {
    method: "POST" as const,
    headers: { "Content-Type": "application/json" },
    body,
  };

  let lastError = "";
  for (const model of GEMINI_MODELS) {
    const resp = await fetch(`${buildEndpoint(model)}?key=${apiKey}`, opts);
    if (resp.ok) {
      const data = await resp.json();
      return (data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    }
    const errData = await resp.json().catch(() => ({}));
    lastError = errData?.error?.message || resp.statusText;
    if (resp.status !== 404 && !/not found|not supported/i.test(lastError)) {
      break;
    }
  }
  throw new Error(`Gemini error: ${lastError}`);
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
        `You are a helpful assistant for the Civic Issue Reporter app. Be concise and specific to the app's features. User: ${trimmed}`,
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
          <div className="px-4 py-3 border-b bg-gray-50 font-semibold">
            CivicReport Assistant
          </div>
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

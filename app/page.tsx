"use client";

import { useChat } from "ai/react";
import { useState } from "react";

export default function Chat() {
  const [api, setApi] = useState<string>("/api/functions");

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api,
    initialInput:
      "If my question contains a math problem execute ruby code to solve it. Here is my question: Solve 3x - 4 = 17",
  });

  return (
    <div className="flex flex-col gap-2 container mx-auto mt-10">
      {messages.length > 0 && (
        <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-4 ${
                m.role === "user" ? "bg-gray-100" : "bg-white"
              }`}
            >
              <span className="opacity-40 font-semibold">
                {m.role === "user" ? "User: " : "AI: "}
              </span>
              {m.content}
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-stretch gap-1 w-full items-stretch"
      >
        <input
          className="form-control flex-1"
          value={input}
          onChange={handleInputChange}
          placeholder="Your message..."
        />
        <select
          className="form-select border rounded-md px-2 bg-green-600 text-white"
          value={api}
          onChange={(e) => setApi(e.target.value)}
        >
          <option value="/api/moreinfo">More Info</option>
          <option value="/api/functions">Functions</option>
          <option value="/api/langchain">Langchain</option>
        </select>
        <button type="submit" className="btn">
          Send
        </button>
      </form>
    </div>
  );
}

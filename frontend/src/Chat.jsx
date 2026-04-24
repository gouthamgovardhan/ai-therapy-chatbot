import { BASE_URL } from "./config";
import { useState, useEffect, useRef } from "react";
import Typing from "./Typing";

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      text: "Hey, how are you feeling today? Do you want to talk it out or just have someone listen?",
      bot: true
    }
  ]);

  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [tempName, setTempName] = useState("");
  const [typing, setTyping] = useState(false);
  const [_history, setHistory] = useState([]);

  const chatRef = useRef();
  const BASE_URL = import.meta.env.VITE_API_URL;

  // 🧾 Fetch history
  useEffect(() => {
    if (!name) return;

    fetch(`${BASE_URL}/history?name=${name}`)
      .then(res => res.json())
      .then(data => setHistory(data));
  }, [name]);

  // 📜 Auto scroll
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, typing]);

  // 🎤 Voice input (safe)
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
    };

    recognition.start();
  };

  // 👉 NAME SCREEN
  if (!name) {
    return (
      <div className="phone">
        <div
          className="chat"
          style={{
            justifyContent: "center",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div className="bot">Hey 👋 What should I call you?</div>

          <input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tempName) {
                setName(tempName);
                setMessages([
                  {
                    text: `Hi ${tempName}, how are you feeling today? Do you want to talk it out or just have someone listen?`,
                    bot: true
                  }
                ]);
              }
            }}
            placeholder="Enter your name..."
          />
        </div>
      </div>
    );
  }

  // 👉 SEND MESSAGE
  const sendMessage = async () => {
    if (!input || typing) return;

    const updated = [...messages, { text: input, user: true }];
    setMessages(updated);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: input, name })
      });

      const data = await res.json();

      setTyping(false);
      setMessages(prev => [...prev, { text: data.reply, bot: true }]);

      // 🔄 refresh history
      fetch(`${BASE_URL}/history?name=${name}`)
        .then(res => res.json())
        .then(data => setHistory(data));

    } catch {
      setTyping(false);
      setMessages(prev => [
        ...prev,
        { text: "Server issue. Check backend.", bot: true }
      ]);
    }
  };

  return (
    <div className="container">
      
      {/* 🧾 SIDEBAR */}
      <div className="sidebar">
        <h4>History</h4>
        {_history.map((h, i) => (
          <div key={i} className="history-item">
            {h.message.slice(0, 30)}
          </div>
        ))}
      </div>

      {/* 📱 CHAT */}
      <div className="phone">
        <div className="chat" ref={chatRef}>
          {messages.map((m, i) => (
            <div key={i} className={m.user ? "user" : "bot"}>
              {m.text}
            </div>
          ))}
          {typing && <Typing />}
        </div>

        {/* ✍️ INPUT */}
        <div style={{ display: "flex" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your thoughts..."
            style={{ flex: 1 }}
          />
          <button onClick={startListening}>🎤</button>
        </div>
      </div>
    </div>
  );
}
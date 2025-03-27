import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function FarmersAIChat() {
  const [query, setQuery] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat, chatHistory]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get("http://localhost:5000/history");
      setChatHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/ask", { query });
      setCurrentChat(response.data);
      setChatHistory([response.data, ...chatHistory]);
      setQuery("");
    } catch (error) {
      console.error("Error getting AI response:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderResponse = (response) => {
    if (typeof response === "string") {
      return <p>{response}</p>;
    }

    return Object.entries(response).map(([section, content]) => {
      if (section === "response") {
        return <p key={section}>{content}</p>;
      }

      return (
        <div key={section}>
          <h3>{section}</h3>
          {typeof content === "string" ? (
            <p>{content}</p>
          ) : (
            <div>
              <p>{content.main}</p>
              {content.items && (
                <ul>
                  {content.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      fontFamily: 'Arial, sans-serif', 
      border: '1px solid #e0e0e0', 
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <div style={{ 
        backgroundColor: '#4CAF50', 
        color: 'white', 
        padding: '15px', 
        textAlign: 'center' 
      }}>
        <h1 style={{ margin: 0 }}>🌱 AgriExpert AI</h1>
      </div>

      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #e0e0e0' 
      }}>
        <button 
          onClick={() => setActiveTab("chat")}
          style={{
            flex: 1, 
            padding: '10px', 
            border: 'none', 
            backgroundColor: activeTab === "chat" ? '#E8F5E9' : 'white',
            color: activeTab === "chat" ? '#4CAF50' : 'black',
            cursor: 'pointer'
          }}
        >
          Chat
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          style={{
            flex: 1, 
            padding: '10px', 
            border: 'none', 
            backgroundColor: activeTab === "history" ? '#E8F5E9' : 'white',
            color: activeTab === "history" ? '#4CAF50' : 'black',
            cursor: 'pointer'
          }}
        >
          History
        </button>
      </div>

      <div style={{ 
        height: '400px', 
        overflowY: 'auto', 
        padding: '15px', 
        backgroundColor: '#f5f5f5' 
      }}>
        {activeTab === "chat" ? (
          !currentChat ? (
            <div style={{ textAlign: 'center', color: '#888' }}>
              Start a conversation
            </div>
          ) : (
            <div>
              <div style={{ 
                textAlign: 'right', 
                marginBottom: '10px' 
              }}>
                <div style={{ 
                  display: 'inline-block', 
                  backgroundColor: '#E8F5E9', 
                  padding: '10px', 
                  borderRadius: '8px' 
                }}>
                  {currentChat.query}
                </div>
              </div>

              <div style={{ 
                backgroundColor: 'white', 
                padding: '10px', 
                borderRadius: '8px',
                marginBottom: '10px'
              }}>
                {renderResponse(currentChat.response)}
              </div>
            </div>
          )
        ) : (
          chatHistory.map((chat, index) => (
            <div 
              key={index} 
              style={{ 
                backgroundColor: 'white', 
                padding: '10px', 
                marginBottom: '10px', 
                borderRadius: '8px' 
              }}
            >
              <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                Q: {chat.query}
              </p>
              {renderResponse(chat.response)}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ 
        padding: '10px', 
        borderTop: '1px solid #e0e0e0', 
        backgroundColor: 'white' 
      }}>
        <div style={{ display: 'flex' }}>
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendQuery()}
            placeholder="Ask a farming question..."
            style={{ 
              flex: 1, 
              padding: '10px', 
              border: '1px solid #e0e0e0', 
              borderRadius: '4px',
              marginRight: '10px'
            }}
          />
          <button 
            onClick={handleSendQuery}
            disabled={loading || !query.trim()}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading || !query.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  FiSend, 
  FiClock, 
  FiMessageSquare, 
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo 
} from "react-icons/fi";

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
      return <p className="text-gray-700">{response}</p>;
    }

    return Object.entries(response).map(([section, content]) => {
      if (section === "response") {
        return <p key={section} className="text-gray-700">{content}</p>;
      }

      return (
        <div key={section} className="mb-3">
          <h3 className="font-bold text-green-700 capitalize flex items-center">
            {getSectionIcon(section)} {section}
          </h3>
          {typeof content === "string" ? (
            <p className="ml-6 text-gray-700">{content}</p>
          ) : (
            <div className="ml-6">
              <p className="text-gray-700">{content.main}</p>
              {content.items && (
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {content.items.map((item, i) => (
                    <li key={i} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  const getSectionIcon = (section) => {
    switch(section.toLowerCase()) {
      case "problem":
        return <FiAlertTriangle className="mr-2 text-yellow-500" />;
      case "solution":
        return <FiCheckCircle className="mr-2 text-green-500" />;
      case "warning":
        return <FiAlertTriangle className="mr-2 text-red-500" />;
      default:
        return <FiInfo className="mr-2 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-green-800 flex items-center justify-center">
            <span className="mr-3">🌱</span> AgriExpert AI Assistant
          </h1>
          <p className="text-green-600 mt-2">
            Get expert farming advice anytime, anywhere
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`flex-1 py-3 font-medium flex items-center justify-center ${activeTab === "chat" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500"}`}
              onClick={() => setActiveTab("chat")}
            >
              <FiMessageSquare className="mr-2" /> Live Chat
            </button>
            <button
              className={`flex-1 py-3 font-medium flex items-center justify-center ${activeTab === "history" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500"}`}
              onClick={() => setActiveTab("history")}
            >
              <FiClock className="mr-2" /> History
            </button>
          </div>

          {/* Chat Area */}
          <div className="h-96 overflow-y-auto p-4 bg-gray-50">
            {activeTab === "chat" ? (
              !currentChat ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No active conversation. Ask your first question!
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current conversation only */}
                  <div>
                    {/* User Query */}
                    <div className="mb-4">
                      <div className="flex items-center mb-1">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <span className="text-green-600">👤</span>
                        </div>
                        <span className="font-medium text-gray-700">You</span>
                      </div>
                      <div className="ml-11 bg-green-50 p-3 rounded-lg border border-green-100">
                        <p className="text-gray-800">{currentChat.query}</p>
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="mb-6">
                      <div className="flex items-center mb-1">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-blue-600">🤖</span>
                        </div>
                        <span className="font-medium text-gray-700">AgriExpert</span>
                      </div>
                      <div className="ml-11 bg-white p-3 rounded-lg border border-gray-200">
                        {renderResponse(currentChat.response)}
                      </div>
                    </div>
                  </div>
                  <div ref={messagesEndRef} />
                </div>
              )
            ) : (
              <div className="space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No conversation history yet
                  </div>
                ) : (
                  chatHistory.map((chat, index) => (
                    <div key={index} className="border-b pb-4 last:border-0">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <FiClock className="mr-1" />
                        {new Date(chat.timestamp).toLocaleString()}
                      </div>
                      <div className="mb-2">
                        <p className="font-medium text-gray-700">Q: {chat.query}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        {renderResponse(chat.response)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Input Area (only visible in chat tab) */}
          {activeTab === "chat" && (
            <div className="p-4 border-t bg-white">
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ask about crops, pests, weather, soil..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendQuery()}
                />
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-r-lg transition flex items-center disabled:opacity-50"
                  onClick={handleSendQuery}
                  disabled={loading || !query.trim()}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Thinking...
                    </>
                  ) : (
                    <>
                      <FiSend className="mr-2" /> Send
                    </>
                  )}
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Example: "How to treat aphids on tomatoes?", "Best crops for clay soil?"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
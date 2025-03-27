import os
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from datetime import datetime
import re

app = Flask(__name__)
CORS(app)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCAYS1gL7i3GIAbquudL1Olxpy7P-o4ej4")
genai.configure(api_key=GEMINI_API_KEY)

# MongoDB Connection
MONGO_URI = "mongodb+srv://workrelatedV1:workrelated6375@cluster0.wkeoz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client["farmers_ai_db"]
collection = db["queries"]

SYSTEM_PROMPT = """
You are AgriExpert, an AI assistant specialized in agriculture. Follow these guidelines:
1. Structure responses with clear headings and bullet points
2. Use simple language suitable for farmers
3. Provide practical, actionable advice
4. Format lists, steps, and important points clearly
5. Include relevant emojis where appropriate
6. If suggesting solutions, provide multiple options
7. Highlight warnings/dangers with warning symbols
8. Keep responses concise but comprehensive
9. DO NOT use markdown formatting like **bold** or ## headings
10. Separate each point with a new line
11. For lists, use simple numbering or bullets without special characters
12. Maintain a clean, readable format throughout
"""

def clean_response(text):
    """Clean and format the response text"""
    # Remove markdown formatting
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)  # Remove bold
    text = re.sub(r'\#+\s*(.*?)\n', r'\1\n', text)  # Remove headings
    text = re.sub(r'`(.*?)`', r'\1', text)  # Remove code formatting
    
    # Convert markdown lists to plain text with newlines
    text = re.sub(r'^\s*[\-\*\+]\s+(.*)$', r'\1', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\.\s+(.*)$', r'\1', text, flags=re.MULTILINE)
    
    # Ensure proper spacing and newlines
    text = re.sub(r'\n\s*\n', '\n\n', text)  # Remove excessive newlines
    text = text.strip()
    
    return text

def format_response(text):
    """Format the response into a structured format"""
    cleaned_text = clean_response(text)
    
    # Split into sections if there are clear headings
    sections = {}
    lines = cleaned_text.split('\n')
    current_section = 'response'
    sections[current_section] = []
    
    for line in lines:
        if line.endswith(':') and len(line) < 30:  # Likely a section heading
            current_section = line[:-1].lower().replace(' ', '_')
            sections[current_section] = []
        else:
            if line.strip():  # Only add non-empty lines
                sections[current_section].append(line.strip())
    
    # Convert lists to single strings with newlines
    for section in sections:
        sections[section] = '\n'.join(sections[section])
    
    return sections if len(sections) > 1 or 'response' not in sections else {'response': cleaned_text}

def generate_ai_response(query):
    """Generate structured AI response using Gemini API"""
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content([SYSTEM_PROMPT, query])
    return format_response(response.text)

@app.route('/ask', methods=['POST'])
def ask_ai():
    data = request.get_json()
    user_query = data.get("query")
    
    if not user_query:
        return jsonify({"error": "No query provided"}), 400
    
    try:
        ai_response = generate_ai_response(user_query)
        record = {
            "query": user_query,
            "response": ai_response,
            "timestamp": datetime.utcnow()
        }
        
        collection.insert_one(record)
        return jsonify({"query": user_query, "response": ai_response})
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/history', methods=['GET'])
def get_history():
    try:
        history = list(collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(20))
        return jsonify(history)
    except PyMongoError as e:
        return jsonify({"error": "Database error"}), 500

if __name__ == '__main__':
    app.run(debug=True)
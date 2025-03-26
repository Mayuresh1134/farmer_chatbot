
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
7. Highlight warnings/dangers with ⚠️
8. Keep responses concise but comprehensive

"""

def format_response(text):
    """Convert markdown-like formatting to structured JSON"""
    sections = {}
    current_section = None
    
    for line in text.split('\n'):
        if line.startswith('**') and ':**' in line:
            current_section = line.strip('**').split(':**')[0].lower()
            sections[current_section] = line.split(':**')[1].strip()
        elif current_section:
            if line.strip().startswith('- '):
                if 'items' not in sections[current_section]:
                    sections[current_section] = {'main': sections[current_section], 'items': []}
                sections[current_section]['items'].append(line.strip('- ').strip())
            else:
                if isinstance(sections[current_section], dict):
                    sections[current_section]['main'] += ' ' + line.strip()
                else:
                    sections[current_section] += ' ' + line.strip()
    
    return sections if sections else {'response': text}

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
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import tempfile
import uuid
import traceback
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_groq import ChatGroq
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import json
import requests

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Enable CORS for all routes
CORS(app, supports_credentials=True)

# Global variables
groq_api_key = os.getenv('GROQ_API_KEY')
llm = ChatGroq(groq_api_key=groq_api_key, model_name="llama-3.1-8b-instant")

# Store for sessions and document content
sessions = {}

@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Only PDF files are supported'}), 400
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(tempfile.gettempdir(), f"{session_id}_{filename}")
        file.save(temp_path)
        
        # Process PDF
        loader = PyPDFLoader(temp_path)
        docs = loader.load()
        
        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=5000, chunk_overlap=800)
        splits = text_splitter.split_documents(docs)
        
        # Store document content in session
        document_content = "\n\n".join([doc.page_content for doc in splits])
        sessions[session_id] = {
            'content': document_content,
            'filename': filename,
            'chat_history': []
        }
        
        # Clean up temp file
        os.remove(temp_path)
        
        return jsonify({
            'session_id': session_id,
            'filename': filename,
            'message': 'File uploaded and processed successfully'
        })
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        print("Chat endpoint called")
        data = request.get_json()
        print(f"Request data: {data}")
        
        session_id = data.get('session_id')
        message = data.get('message')
        
        if not session_id or not message:
            return jsonify({'error': 'Session ID and message are required'}), 400
        
        if session_id not in sessions:
            return jsonify({'error': 'Session not found. Please upload a file first.'}), 404
        
        session_data = sessions[session_id]
        document_content = session_data['content']
        chat_history = session_data['chat_history']
        
        print(f"Session found, document length: {len(document_content)}")
        
        # Create a simple prompt without complex formatting
        prompt_text = f"""You are a helpful assistant. Answer the user's question based on this document:

DOCUMENT:
{document_content[:3000]}...

QUESTION: {message}

ANSWER:"""
        
        print("Calling Groq API...")
        # Get response from LLM
        response = llm.invoke(prompt_text)
        answer = response.content
        
        print(f"Got response: {answer[:100]}...")
        
        # Store in chat history
        chat_history.append({
            'human': message,
            'assistant': answer
        })
        
        return jsonify({
            'answer': answer,
            'session_id': session_id
        })
        
    except Exception as e:
        print(f"Chat error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat/history/<session_id>', methods=['GET'])
def get_chat_history(session_id):
    try:
        if session_id not in sessions:
            return jsonify({'messages': []})
        
        chat_history = sessions[session_id]['chat_history']
        messages = []
        
        for chat in chat_history:
            messages.append({'type': 'human', 'content': chat['human']})
            messages.append({'type': 'ai', 'content': chat['assistant']})
        
        return jsonify({'messages': messages})
        
    except Exception as e:
        print(f"History error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    try:
        if session_id in sessions:
            del sessions[session_id]
        
        return jsonify({'message': 'Session deleted successfully'})
        
    except Exception as e:
        print(f"Delete error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'RAG API is running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

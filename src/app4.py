from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import tempfile
import uuid
import traceback
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.prompts import PromptTemplate

# Load env
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Enable CORS
CORS(app, supports_credentials=True)

# Global vars
groq_api_key = os.getenv('GROQ_API_KEY')
llm = ChatGroq(groq_api_key=groq_api_key, model_name="Gemma2-9b-It")

# HuggingFace embeddings (small + fast model recommended)
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

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
        
        session_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        temp_path = os.path.join(tempfile.gettempdir(), f"{session_id}_{filename}")
        file.save(temp_path)
        
        # Load PDF
        loader = PyPDFLoader(temp_path)
        docs = loader.load()
        
        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        
        # Build FAISS index
        vectorstore = FAISS.from_documents(splits, embeddings)
        
        # Save in memory
        sessions[session_id] = {
            'vectorstore': vectorstore,
            'filename': filename,
            'chat_history': []
        }
        
        os.remove(temp_path)
        
        return jsonify({
            'session_id': session_id,
            'filename': filename,
            'message': 'File uploaded, embedded, and indexed successfully'
        })
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        message = data.get('message')
        
        if not session_id or not message:
            return jsonify({'error': 'Session ID and message are required'}), 400
        if session_id not in sessions:
            return jsonify({'error': 'Session not found. Upload a file first.'}), 404
        
        session_data = sessions[session_id]
        vectorstore = session_data['vectorstore']
        chat_history = session_data['chat_history']
        
        # Retrieve top-k chunks
        retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
        docs = retriever.get_relevant_documents(message)
        context = "\n\n".join([doc.page_content for doc in docs])
        
        # Prompt with structured template
        prompt_template = PromptTemplate(
            template="""
You are a helpful assistant. Use the following retrieved context from the PDF to answer the question.
If the answer is not in the document, say you cannot find it.

Context:
{context}

Question: {question}

Answer:""",
            input_variables=["context", "question"]
        )
        prompt_text = prompt_template.format(context=context, question=message)
        
        response = llm.invoke(prompt_text)
        answer = response.content
        
        chat_history.append({'human': message, 'assistant': answer})
        
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

import streamlit as st
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_chroma import Chroma
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_groq import ChatGroq
from langchain.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.runnables.history import RunnableWithMessageHistory
import os
from dotenv import load_dotenv

load_dotenv()

os.environ['HF_TOKEN'] = os.getenv('HF_TOKEN')
groq_api_key = os.getenv('GROQ_API_KEY')
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

## set up streamlit

st.title("RAG with pdf uploads and chat history")
st.write("Upload pdf's and chat with its content")

llm=ChatGroq(groq_api_key=groq_api_key, model_name="Gemma2-9b-It")
session_id = st.text_input("Session Id", value="default_session")

# statefully manage chat history

if 'store' not in st.session_state:
    st.session_state.store={}

uploaded_file = st.file_uploader("Choose a pdf file",type='pdf',accept_multiple_files=False)

if uploaded_file:
    documents=[]
    temppdf=f'./temp.pdf'
    with open(temppdf,'wb') as file:
        file.write(uploaded_file.getvalue())
        file_name=uploaded_file.name

    loader = PyPDFLoader(temppdf)
    docs=loader.load()
    documents.extend(docs)

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=5000, chunk_overlap=800)
    splits = text_splitter.split_documents(documents)
    vectorstore = Chroma.from_documents(splits,embedding=embeddings)
    retriever=vectorstore.as_retriever()

    contextualize_q_system_prompt = (
        "Given a chat history and the latest user question"
        "Which might reference context in chat history"
        "formulate a standalone question which can be understood"
        "without the chat history. Do NOT answer the question,"
        "just reformulate it if needed and otherwise return it as is."
    )

    contextualize_q_prompt = ChatPromptTemplate.from_messages(
        [
            ('system',contextualize_q_system_prompt),
            MessagesPlaceholder('chat_history'),
            ('human','{input}'),
        ]
    )

    history_aware_retriever = create_history_aware_retriever(llm,retriever,contextualize_q_prompt)

    ## Answer Question prompt
    system_prompt = (
        "You are a helpful assistant that answers questions based on the provided context."
        "Please provide the most accurate response based on the question."
        "\n\n"
        "{context}"
    )

    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ('system', system_prompt),
            MessagesPlaceholder('chat_history'),
            ('human', '{input}'),
        ]
    )

    question_answer_chain = create_stuff_documents_chain(llm,qa_prompt)

    rag_chain = create_retrieval_chain(history_aware_retriever,question_answer_chain)

    def get_session_history(session_id: str) -> BaseChatMessageHistory:
        if session_id not in st.session_state.store:
            st.session_state.store[session_id] = ChatMessageHistory()
        return st.session_state.store[session_id]
    
    conversation_rag_chain = RunnableWithMessageHistory(
        rag_chain,
        get_session_history,
        input_messages_key='input',
        history_messages_key='chat_history',
        output_messages_key='answer'
    )

    user_input = st.text_input("Ask a question about the document")
    if user_input:
        session_history= get_session_history(session_id)
        response = conversation_rag_chain.invoke(
            {'input':user_input},
            config={
                'configurable':{'session_id': session_id}
            },
        )
        st.write(st.session_state.store)
        st.success(f"Assistant: {response['answer']}")
        st.write(f"Chat History: {session_history.messages}")
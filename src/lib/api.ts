const API_BASE_URL = 'http://localhost:5000/api';

export interface UploadResponse {
  session_id: string;
  filename: string;
  message: string;
}

export interface ChatResponse {
  answer: string;
  session_id: string;
}

export interface ChatMessage {
  type: 'human' | 'ai';
  content: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed: ${response.status}`);
    }

    return response.json();
  }

  async sendMessage(sessionId: string, message: string): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        message,
      }),
    });
  }

  async getChatHistory(sessionId: string): Promise<ChatHistoryResponse> {
    return this.makeRequest<ChatHistoryResponse>(`/chat/history/${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.makeRequest<{ status: string; message: string }>('/health');
  }
}

export const apiService = new ApiService();

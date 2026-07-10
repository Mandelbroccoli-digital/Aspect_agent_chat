// API service for communicating with the Aspect AI backend

export interface AspectResponse {
  aspect: string;
  response: string;
  timestamp: string;
  confidence: number;
}

export interface ChatResponse {
  responses: AspectResponse[];
  session_id: string;
  message_id: string;
}

export interface SendMessageRequest {
  message: string;
  session_id: string;
  aspects?: string[];
}

export interface SessionHistory {
  session_id: string;
  history: Array<{
    user_message: string;
    responses: Record<string, string>;
    timestamp: string;
  }>;
}

class AspectAIAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';
  }

  async sendMessage(request: SendMessageRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseURL}/api/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getSessionHistory(sessionId: string): Promise<SessionHistory> {
    const response = await fetch(`${this.baseURL}/api/session/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get session history: ${response.status}`);
    }

    return response.json();
  }

  async clearSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/session/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to clear session: ${response.status}`);
    }
  }

  async healthCheck(): Promise<{
    status: string;
    models_status: Record<string, string>;
    cuda_available: boolean;
  }> {
    const response = await fetch(`${this.baseURL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
  }
}

export const aspectAI = new AspectAIAPI();
# Aspect AI Backend

A FastAPI backend that powers the Aspect AI multi-perspective chat system using real Hugging Face models.

## Features

- **Real AI Models**: Uses actual Hugging Face transformers for each aspect
- **Multi-Aspect Processing**: Logic, Creative, and Analytical perspectives
- **Session Memory**: Maintains conversation context across messages
- **Async Processing**: Concurrent response generation for better performance
- **CORS Enabled**: Ready for frontend integration

## Models Used

| Aspect | Model | Purpose |
|--------|-------|---------|
| Logic | microsoft/DialoGPT-medium | Reasoning and problem-solving |
| Creative | gpt2-medium | Imaginative and artistic responses |
| Analytical | microsoft/DialoGPT-medium | Data analysis and structured thinking |

## Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Start the Server**:
   ```bash
   python start.py
   ```

3. **Access the API**:
   - Server: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

## API Endpoints

### POST /api/message
Send a message and get responses from all aspects.

**Request**:
```json
{
  "message": "What's the best way to solve climate change?",
  "session_id": "user123",
  "aspects": ["Logic", "Creative", "Analytical"]
}
```

**Response**:
```json
{
  "responses": [
    {
      "aspect": "Logic",
      "response": "A systematic approach would involve...",
      "timestamp": "2024-01-15T10:30:00",
      "confidence": 0.8
    }
  ],
  "session_id": "user123",
  "message_id": "user123_1"
}
```

### GET /api/session/{session_id}
Get conversation history for a session.

### DELETE /api/session/{session_id}
Clear conversation history for a session.

## Performance Notes

- Models are loaded once on startup
- GPU acceleration used if available
- Responses generated concurrently
- Session history limited to last 10 messages
- Context window optimized for memory efficiency

## Development

The backend automatically reloads on code changes when running with `python start.py`.

For production deployment, use:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```
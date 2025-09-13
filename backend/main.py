from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import torch
import json
import os
from typing import Dict, List, Optional
import asyncio
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Aspect AI Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models configuration
MODELS_CONFIG = {
    "Logic": {
        "model_name": "microsoft/DialoGPT-medium",
        "prompt_template": "You are a logical, analytical AI focused on reasoning and problem-solving. Provide clear, structured responses. {message}",
        "max_length": 150,
        "temperature": 0.7
    },
    "Creative": {
        "model_name": "gpt2-medium", 
        "prompt_template": "You are a creative, imaginative AI. Think outside the box and provide innovative, artistic responses. {message}",
        "max_length": 150,
        "temperature": 0.9
    },
    "Analytical": {
        "model_name": "microsoft/DialoGPT-medium",
        "prompt_template": "You are an analytical AI focused on data, patterns, and structured analysis. Provide detailed, methodical responses. {message}",
        "max_length": 150,
        "temperature": 0.6
    }
}

# Global model storage
models = {}
tokenizers = {}

class UserMessage(BaseModel):
    message: str
    session_id: str
    aspects: Optional[List[str]] = ["Logic", "Creative", "Analytical"]

class AspectResponse(BaseModel):
    aspect: str
    response: str
    timestamp: str
    confidence: float

class ChatResponse(BaseModel):
    responses: List[AspectResponse]
    session_id: str
    message_id: str

# Session storage (in production, use Redis or database)
sessions: Dict[str, List[Dict]] = {}

async def load_models():
    """Load all models on startup"""
    logger.info("Loading Hugging Face models...")
    
    for aspect, config in MODELS_CONFIG.items():
        try:
            logger.info(f"Loading {aspect} model: {config['model_name']}")
            
            # Load tokenizer and model
            tokenizer = AutoTokenizer.from_pretrained(config['model_name'])
            model = AutoModelForCausalLM.from_pretrained(
                config['model_name'],
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None
            )
            
            # Add padding token if it doesn't exist
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            
            # Create pipeline
            pipe = pipeline(
                "text-generation",
                model=model,
                tokenizer=tokenizer,
                device=0 if torch.cuda.is_available() else -1,
                return_full_text=False
            )
            
            models[aspect] = pipe
            tokenizers[aspect] = tokenizer
            logger.info(f"✅ {aspect} model loaded successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to load {aspect} model: {str(e)}")
            # Fallback to a simpler model or mock response
            models[aspect] = None

def get_session_context(session_id: str, max_context: int = 3) -> str:
    """Get recent conversation context for a session"""
    if session_id not in sessions:
        return ""
    
    recent_messages = sessions[session_id][-max_context:]
    context = ""
    
    for msg in recent_messages:
        context += f"Human: {msg['user_message']}\n"
        for aspect, response in msg['responses'].items():
            context += f"{aspect}: {response}\n"
        context += "\n"
    
    return context

async def generate_aspect_response(aspect: str, message: str, session_id: str) -> AspectResponse:
    """Generate response for a specific aspect"""
    try:
        config = MODELS_CONFIG[aspect]
        model_pipe = models.get(aspect)
        
        if model_pipe is None:
            # Fallback response if model failed to load
            return AspectResponse(
                aspect=aspect,
                response=f"[{aspect} perspective] I'm currently processing your request: '{message}'. This aspect focuses on {aspect.lower()} thinking patterns.",
                timestamp=datetime.now().isoformat(),
                confidence=0.5
            )
        
        # Get conversation context
        context = get_session_context(session_id)
        
        # Format prompt with context and template
        full_prompt = f"{context}{config['prompt_template'].format(message=message)}"
        
        # Generate response
        response = model_pipe(
            full_prompt,
            max_length=config['max_length'],
            temperature=config['temperature'],
            do_sample=True,
            pad_token_id=tokenizers[aspect].eos_token_id
        )
        
        generated_text = response[0]['generated_text'].strip()
        
        # Clean up the response
        if generated_text.startswith(message):
            generated_text = generated_text[len(message):].strip()
        
        return AspectResponse(
            aspect=aspect,
            response=generated_text,
            timestamp=datetime.now().isoformat(),
            confidence=0.8
        )
        
    except Exception as e:
        logger.error(f"Error generating {aspect} response: {str(e)}")
        return AspectResponse(
            aspect=aspect,
            response=f"[{aspect}] I encountered an issue processing your request. Let me try a different approach to your question: '{message}'",
            timestamp=datetime.now().isoformat(),
            confidence=0.3
        )

@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    await load_models()

@app.get("/")
async def root():
    return {"message": "Aspect AI Backend is running", "models_loaded": list(models.keys())}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_status": {aspect: "loaded" if model is not None else "failed" for aspect, model in models.items()},
        "cuda_available": torch.cuda.is_available()
    }

@app.post("/api/message", response_model=ChatResponse)
async def process_message(msg: UserMessage):
    """Process user message and generate responses from all aspects"""
    try:
        logger.info(f"Processing message for session {msg.session_id}: {msg.message}")
        
        # Generate responses from all requested aspects concurrently
        tasks = []
        for aspect in msg.aspects:
            if aspect in MODELS_CONFIG:
                tasks.append(generate_aspect_response(aspect, msg.message, msg.session_id))
        
        responses = await asyncio.gather(*tasks)
        
        # Store in session history
        if msg.session_id not in sessions:
            sessions[msg.session_id] = []
        
        session_entry = {
            "user_message": msg.message,
            "responses": {resp.aspect: resp.response for resp in responses},
            "timestamp": datetime.now().isoformat()
        }
        sessions[msg.session_id].append(session_entry)
        
        # Keep only last 10 messages per session
        if len(sessions[msg.session_id]) > 10:
            sessions[msg.session_id] = sessions[msg.session_id][-10:]
        
        message_id = f"{msg.session_id}_{len(sessions[msg.session_id])}"
        
        return ChatResponse(
            responses=responses,
            session_id=msg.session_id,
            message_id=message_id
        )
        
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/session/{session_id}")
async def get_session_history(session_id: str):
    """Get conversation history for a session"""
    return {
        "session_id": session_id,
        "history": sessions.get(session_id, [])
    }

@app.delete("/api/session/{session_id}")
async def clear_session(session_id: str):
    """Clear conversation history for a session"""
    if session_id in sessions:
        del sessions[session_id]
    return {"message": f"Session {session_id} cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
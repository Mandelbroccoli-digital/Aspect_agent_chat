#!/usr/bin/env python3
"""
Startup script for Aspect AI Backend
"""
import uvicorn
import sys
import os

def main():
    """Start the FastAPI server"""
    print("🚀 Starting Aspect AI Backend...")
    print("📡 Server will be available at: http://localhost:8000")
    print("📚 API docs will be available at: http://localhost:8000/docs")
    print("🔄 CORS enabled for frontend at: http://localhost:5173")
    
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Shutting down Aspect AI Backend...")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
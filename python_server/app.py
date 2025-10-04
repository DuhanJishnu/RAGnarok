from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config

# Import blueprints
from api.chat import chat_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    CORS(app)
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=[Config.RATE_LIMIT]
    )
    
    # Register blueprints
    app.register_blueprint(chat_bp)
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {"status": "healthy", "message": "RAG Pipeline Server is running"}
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
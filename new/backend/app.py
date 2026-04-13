from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from routes.api import api_bp
import os

def create_app():
    """Application factory"""
    app = Flask(__name__, 
                static_folder='../frontend',
                static_url_path='')
    
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(api_bp)
    
    # Serve frontend
    @app.route('/')
    def index():
        return send_from_directory(app.static_folder, 'index.html')
    
    @app.route('/<path:path>')
    def serve_static(path):
        if os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')
    
    # Health check
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'message': 'Medicine Alternative Finder API'}
    
    return app

if __name__ == '__main__':
    app = create_app()
    print("🚀 Starting Medicine Alternative Finder...")
    print("📊 API available at: http://localhost:5000/api")
    print("🌐 Frontend available at: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)

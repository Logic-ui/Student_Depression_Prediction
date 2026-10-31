import os
from flask import Flask, jsonify
from flask_cors import CORS
from routes.prediction import prediction_bp
from routes.analytics import analytics_bp

def create_app():
    app = Flask(__name__)
    
    # Enable Cross-Origin Resource Sharing for all origins and methods
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register API blueprints
    app.register_blueprint(prediction_bp, url_prefix='/api')
    app.register_blueprint(analytics_bp, url_prefix='/api')

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'Student Depression Prediction API',
            'version': '1.0.0',
            'framework': 'Flask',
            'endpoints': [
                '/api/health',
                '/api/schema',
                '/api/predict',
                '/api/eda/summary',
                '/api/eda/charts',
                '/api/model/metrics',
                '/api/model/features'
            ]
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'status': 'error', 'error': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'status': 'error', 'error': 'Internal server error'}), 500

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Flask server on http://127.0.0.1:{port}...")
    app.run(host='0.0.0.0', port=port, debug=False)

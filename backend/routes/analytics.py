import os
import json
from flask import Blueprint, jsonify

analytics_bp = Blueprint('analytics', __name__)

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
EDA_FILE = os.path.join(MODELS_DIR, 'eda_summary.json')
METRICS_FILE = os.path.join(MODELS_DIR, 'model_metrics.json')
FEATURES_FILE = os.path.join(MODELS_DIR, 'feature_importance.json')

def load_json_file(filepath):
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

@analytics_bp.route('/eda/summary', methods=['GET'])
def get_eda_summary():
    data = load_json_file(EDA_FILE)
    if not data:
        return jsonify({
            'status': 'error',
            'error': 'EDA summary not found. Please run train_model.py to initialize.'
        }), 404

    summary = {
        'total_records': data.get('total_records'),
        'depressed_count': data.get('depressed_count'),
        'non_depressed_count': data.get('non_depressed_count'),
        'overall_depression_rate': data.get('overall_depression_rate'),
        'numerical_summary': data.get('numerical_summary'),
        'key_insights': [
            {
                'title': "Health Condition is the Primary Indicator",
                'description': "Students with 'Critical' health conditions had 100% depression incidence, while 'Good' health condition showed 0% depression in the dataset."
            },
            {
                'title': "Social Circles Provide Protective Buffers",
                'description': "Students with active friend circles had a 24.0% depression rate compared to 34.3% for isolated students."
            },
            {
                'title': "Relationship Status Dynamics",
                'description': "Single students exhibited a 35.9% depression rate, significantly higher than students in relationships (11.5%)."
            },
            {
                'title': "Socioeconomic Stratification",
                'description': "Lower Middle Class students experienced 30.6% depression rate compared to 17.6% for students from Rich class backgrounds."
            }
        ]
    }
    return jsonify({'status': 'success', 'data': summary}), 200

@analytics_bp.route('/eda/charts', methods=['GET'])
def get_eda_charts():
    data = load_json_file(EDA_FILE)
    if not data:
        return jsonify({
            'status': 'error',
            'error': 'EDA chart data not found. Please run train_model.py to initialize.'
        }), 404

    return jsonify({
        'status': 'success',
        'charts': {
            'target_distribution': data.get('target_distribution', []),
            'gender_chart': data.get('gender_chart', []),
            'age_chart': data.get('age_chart', []),
            'health_chart': data.get('health_chart', []),
            'relationship_chart': data.get('relationship_chart', []),
            'friend_chart': data.get('friend_chart', []),
            'family_chart': data.get('family_chart', []),
            'living_chart': data.get('living_chart', []),
            'division_chart': data.get('division_chart', []),
            'cgpa_chart': data.get('cgpa_chart', []),
            'semester_chart': data.get('semester_chart', []),
            'correlation_matrix': data.get('correlation_matrix', {})
        }
    }), 200

@analytics_bp.route('/model/metrics', methods=['GET'])
def get_model_metrics():
    metrics = load_json_file(METRICS_FILE)
    if not metrics:
        return jsonify({
            'status': 'error',
            'error': 'Model metrics not found. Please run train_model.py.'
        }), 404

    return jsonify({
        'status': 'success',
        'data': metrics
    }), 200

@analytics_bp.route('/model/features', methods=['GET'])
def get_model_features():
    features = load_json_file(FEATURES_FILE)
    if not features:
        return jsonify({
            'status': 'error',
            'error': 'Feature importances not found. Please run train_model.py.'
        }), 404

    return jsonify({
        'status': 'success',
        'data': features
    }), 200

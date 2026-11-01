import os
import joblib
import pandas as pd
from flask import Blueprint, request, jsonify
from utils.preprocessing import validate_input, format_input_dataframe, CATEGORICAL_OPTIONS, NUMERICAL_CONSTRAINTS

prediction_bp = Blueprint('prediction', __name__)

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
FULL_PIPELINE_PATH = os.path.join(MODELS_DIR, 'full_pipeline.joblib')
MODEL_PATH = os.path.join(MODELS_DIR, 'depression_model.joblib')
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, 'preprocessing_pipeline.joblib')

pipeline = None
_last_mtime = 0

def get_pipeline():
    global pipeline, _last_mtime
    mtime = os.path.getmtime(FULL_PIPELINE_PATH) if os.path.exists(FULL_PIPELINE_PATH) else 0
    if pipeline is None or mtime != _last_mtime:
        if os.path.exists(FULL_PIPELINE_PATH):
            pipeline = joblib.load(FULL_PIPELINE_PATH)
            _last_mtime = mtime
        elif os.path.exists(MODEL_PATH) and os.path.exists(PREPROCESSOR_PATH):
            from sklearn.pipeline import Pipeline
            clf = joblib.load(MODEL_PATH)
            prep = joblib.load(PREPROCESSOR_PATH)
            pipeline = Pipeline(steps=[('preprocessor', prep), ('classifier', clf)])
            _last_mtime = mtime
        else:
            raise FileNotFoundError("Trained model files not found. Please run train_model.py first.")
    return pipeline

def assess_risk_factors(data):
    """
    Identifies notable risk factors present in the student's inputs
    based on EDA findings.
    """
    factors = []
    health = data.get('Health_condition', '')
    if health in ['Critical', 'Abnormal']:
        factors.append({
            'factor': f"Reported Health Condition ({health})",
            'severity': 'high' if health == 'Critical' else 'moderate',
            'detail': "Health issues are the strongest statistical indicator of psychological distress."
        })
    
    if data.get('friend_circle') == 'No':
        factors.append({
            'factor': "Lack of Social Support (No Friend Circle)",
            'severity': 'moderate',
            'detail': "Students without an active peer circle experience elevated depression rates."
        })
    
    if data.get('Relationship_status') == 'Single':
        factors.append({
            'factor': "Relationship Status (Single)",
            'severity': 'low',
            'detail': "Single students exhibited higher depression frequencies than students in relationships."
        })

    cgpa = float(data.get('CGPA', 4.0))
    if cgpa < 3.0:
        factors.append({
            'factor': f"Academic Stress Indicator (CGPA: {cgpa:.2f})",
            'severity': 'moderate',
            'detail': "Lower academic performance often correlates with increased academic anxiety."
        })

    if data.get('Family_background') == 'Lower Middle class':
        factors.append({
            'factor': "Economic Vulnerability (Lower Middle Class)",
            'severity': 'low',
            'detail': "Financial strain can contribute to ongoing stress and anxiety."
        })

    return factors

def generate_recommendations(risk_level, risk_factors):
    """
    Provides supportive, educational next steps.
    """
    recs = [
        "Maintain open communication with friends, family, or academic mentors.",
        "Practice healthy sleep schedules and balanced daily routines."
    ]

    if risk_level in ['High', 'Moderate']:
        recs.insert(0, "Consider scheduling a consultation with your university counseling center or a licensed mental health professional.")
    
    for f in risk_factors:
        if 'Health Condition' in f['factor']:
            recs.append("Consult a qualified medical healthcare provider to address any physical or chronic health concerns.")
            break

    if any('Social Support' in f['factor'] for f in risk_factors):
        recs.append("Explore campus clubs, study groups, or peer support communities to build meaningful connections.")

    return recs

@prediction_bp.route('/schema', methods=['GET'])
def get_schema():
    """
    Returns the required fields, allowable categorical options, and numerical ranges
    to enable dynamic and strictly validated frontend form rendering.
    """
    return jsonify({
        'status': 'success',
        'categorical_options': CATEGORICAL_OPTIONS,
        'numerical_constraints': {
            k: {**v, 'type': v['type'].__name__}
            for k, v in NUMERICAL_CONSTRAINTS.items()
        }
    }), 200

@prediction_bp.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({
                'status': 'error',
                'error': 'Invalid request body. Expected a JSON payload.'
            }), 400

        cleaned_data, error_msg = validate_input(data)
        if error_msg:
            return jsonify({
                'status': 'error',
                'error': error_msg
            }), 400

        pipe = get_pipeline()
        input_df = format_input_dataframe(cleaned_data)

        raw_pred = pipe.predict(input_df)[0]
        has_proba = hasattr(pipe, 'predict_proba')

        if has_proba:
            proba_arr = pipe.predict_proba(input_df)[0]
            dep_proba = float(proba_arr[1])
            confidence = float(max(proba_arr) * 100)
        else:
            dep_proba = 1.0 if raw_pred == 1 else 0.0
            confidence = 90.0

        is_depressed = bool(raw_pred == 1)
        pred_label = "Depressed" if is_depressed else "Not Depressed"
        
        # Risk categorization based on model probability
        if dep_proba >= 0.70:
            risk_level = "High"
            badge_color = "red"
        elif dep_proba >= 0.35:
            risk_level = "Moderate"
            badge_color = "amber"
        else:
            risk_level = "Low"
            badge_color = "green"

        risk_factors = assess_risk_factors(cleaned_data)
        recommendations = generate_recommendations(risk_level, risk_factors)

        engineered_metrics = {
            'health_risk_weight': float(input_df['Health_Risk_Weight'].iloc[0]),
            'social_isolation_index': float(input_df['Social_Isolation_Index'].iloc[0]),
            'academic_pressure_score': float(input_df['Academic_Pressure_Score'].iloc[0]),
            'financial_burden_index': float(input_df['Financial_Burden_Index'].iloc[0]),
            'age_to_semester_pace': float(input_df['Age_to_Semester_Pace'].iloc[0])
        }

        return jsonify({
            'status': 'success',
            'prediction': 'Yes' if is_depressed else 'No',
            'prediction_label': pred_label,
            'is_depressed': is_depressed,
            'probability': round(dep_proba, 4),
            'depression_probability_percentage': round(dep_proba * 100, 2),
            'confidence_score': round(confidence, 2),
            'risk_level': risk_level,
            'badge_color': badge_color,
            'risk_factors': risk_factors,
            'recommendations': recommendations,
            'engineered_metrics': engineered_metrics,
            'input_data': cleaned_data,
            'disclaimer': "This prediction is an educational machine learning assessment and must NOT be used as a clinical diagnosis."
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': f"Internal prediction failure: {str(e)}"
        }), 500

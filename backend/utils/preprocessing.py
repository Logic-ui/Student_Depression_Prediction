import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

NUMERICAL_FEATURES = ['Age', 'Current_semester', 'CGPA', 'Cost_without_study']

CATEGORICAL_FEATURES = [
    'Gender',
    'Family_background',
    'Relationship_status',
    'Marital_status',
    'Living_style',
    'friend_circle',
    'Health_condition',
    'Home_division'
]

ALL_FEATURE_COLUMNS = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
TARGET_COLUMN = 'Depression'

CATEGORICAL_OPTIONS = {
    'Gender': ['Female', 'Male'],
    'Family_background': ['Middle class', 'Lower Middle class', 'Rich class'],
    'Relationship_status': ['Single', 'In a Relationship', 'Complicated'],
    'Marital_status': ['Unmarried', 'Married', 'Separated'],
    'Living_style': ['Bachelor', 'Family'],
    'friend_circle': ['Yes', 'No'],
    'Health_condition': ['Normal', 'Good', 'Abnormal', 'Critical'],
    'Home_division': [
        'Dhaka', 'Khulna', 'Rajshahi', 'Sylhet',
        'Chittagong', 'Rangpur', 'Barisal', 'Mymensingh'
    ]
}

NUMERICAL_CONSTRAINTS = {
    'Age': {'min': 15, 'max': 40, 'type': int, 'label': 'Age'},
    'Current_semester': {'min': 0, 'max': 16, 'type': int, 'label': 'Current Semester'},
    'CGPA': {'min': 0.0, 'max': 4.0, 'type': float, 'label': 'CGPA'},
    'Cost_without_study': {'min': 0, 'max': 100000, 'type': float, 'label': 'Living Cost (Monthly)'}
}

def build_preprocessor():
    """
    Constructs a ColumnTransformer for numerical scaling and categorical one-hot encoding.
    Fitted only on training data to prevent data leakage.
    """
    return ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), NUMERICAL_FEATURES),
            ('cat', OneHotEncoder(drop=None, sparse_output=False, handle_unknown='ignore'), CATEGORICAL_FEATURES)
        ],
        remainder='drop'
    )

def validate_input(data):
    """
    Validates payload input for student prediction.
    Returns (cleaned_dict, error_message). If valid, error_message is None.
    """
    if not isinstance(data, dict):
        return None, "Input payload must be a JSON object."
    
    cleaned = {}
    errors = []

    # Check and clean numerical features
    for feat, spec in NUMERICAL_CONSTRAINTS.items():
        if feat not in data or data[feat] is None or str(data[feat]).strip() == "":
            errors.append(f"Missing required field: '{feat}' ({spec['label']}).")
            continue
        try:
            val = spec['type'](data[feat])
            if val < spec['min'] or val > spec['max']:
                errors.append(f"Field '{feat}' must be between {spec['min']} and {spec['max']}. Received: {val}.")
            else:
                cleaned[feat] = val
        except (ValueError, TypeError):
            errors.append(f"Field '{feat}' must be a valid {spec['type'].__name__} number.")

    # Check and clean categorical features
    for feat, options in CATEGORICAL_OPTIONS.items():
        if feat not in data or data[feat] is None or str(data[feat]).strip() == "":
            errors.append(f"Missing required field: '{feat}'.")
            continue
        val = str(data[feat]).strip()
        # Case-insensitive matching to canonical option
        matched = next((opt for opt in options if opt.lower() == val.lower()), None)
        if matched is not None:
            cleaned[feat] = matched
        else:
            errors.append(f"Invalid value for '{feat}': '{val}'. Valid choices are: {', '.join(options)}.")

    if errors:
        return None, "; ".join(errors)
    
    return cleaned, None

def format_input_dataframe(cleaned_dict):
    """
    Converts a validated input dictionary into a single-row pandas DataFrame
    with standard column ordering.
    """
    return pd.DataFrame([cleaned_dict])[ALL_FEATURE_COLUMNS]

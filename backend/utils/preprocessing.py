import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

RAW_NUMERICAL_FEATURES = ['Age', 'Current_semester', 'CGPA', 'Cost_without_study']

ENGINEERED_NUMERICAL_FEATURES = [
    'Health_Risk_Weight',
    'Social_Isolation_Index',
    'Academic_Pressure_Score',
    'Financial_Burden_Index',
    'Age_to_Semester_Pace'
]

NUMERICAL_FEATURES = RAW_NUMERICAL_FEATURES + ENGINEERED_NUMERICAL_FEATURES

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
RAW_FEATURE_COLUMNS = RAW_NUMERICAL_FEATURES + CATEGORICAL_FEATURES
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

def add_engineered_features(df):
    """
    Computes domain-specific engineered features to enrich the machine learning pipeline:
    1. Health_Risk_Weight: Quantitative ordinal representation of somatic health (0-3).
    2. Social_Isolation_Index: Cumulative proxy for isolation from living, friends, and relationship (0-5).
    3. Academic_Pressure_Score: Compound interaction between semester progress and CGPA gap.
    4. Financial_Burden_Index: Living expenses weighted by family socioeconomic tier.
    5. Age_to_Semester_Pace: Deviation between expected semester progress and actual semester.
    """
    df = df.copy()

    # 1. Health Risk Weight
    health_map = {'Good': 0.0, 'Normal': 1.0, 'Abnormal': 2.0, 'Critical': 3.0}
    df['Health_Risk_Weight'] = df['Health_condition'].map(health_map).fillna(1.0)

    # 2. Social Isolation Index
    no_friends = (df['friend_circle'] == 'No').astype(float) * 2.0
    single = (df['Relationship_status'] == 'Single').astype(float) * 1.0
    bachelor = (df['Living_style'] == 'Bachelor').astype(float) * 1.0
    unmarried = (df['Marital_status'].isin(['Unmarried', 'Separated'])).astype(float) * 1.0
    df['Social_Isolation_Index'] = no_friends + single + bachelor + unmarried

    # 3. Academic Pressure Score
    # Higher semester with lower CGPA indicates compounded academic stress
    cgpa_gap = np.clip(4.01 - df['CGPA'].astype(float), 0.01, 2.0)
    semester_factor = np.clip(df['Current_semester'].astype(float) / 10.0, 0.1, 1.6)
    df['Academic_Pressure_Score'] = np.round(semester_factor * cgpa_gap, 4)

    # 4. Financial Burden Index
    # Lower-middle-class students face significantly higher financial strain for equal living cost
    bg_multiplier = df['Family_background'].map({
        'Lower Middle class': 1.5,
        'Middle class': 1.0,
        'Rich class': 0.6
    }).fillna(1.0)
    df['Financial_Burden_Index'] = np.round(
        (df['Cost_without_study'].astype(float) / 15000.0) * bg_multiplier, 4
    )

    # 5. Age to Semester Pace
    # Expected semester assuming entry at age 18 (2 semesters per year)
    expected_semester = (df['Age'].astype(float) - 18.0) * 2.0
    df['Age_to_Semester_Pace'] = np.round(df['Current_semester'].astype(float) - expected_semester, 2)

    return df

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
    Converts a validated input dictionary into a single-row pandas DataFrame,
    enriches it with engineered features, and orders columns for the preprocessor.
    """
    raw_df = pd.DataFrame([cleaned_dict])[RAW_FEATURE_COLUMNS]
    enriched_df = add_engineered_features(raw_df)
    return enriched_df[ALL_FEATURE_COLUMNS]

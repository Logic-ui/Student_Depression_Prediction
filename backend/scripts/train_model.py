import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

# Add parent directory to path to import backend.utils
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.insert(0, backend_dir)

from utils.preprocessing import (
    NUMERICAL_FEATURES,
    CATEGORICAL_FEATURES,
    ALL_FEATURE_COLUMNS,
    RAW_FEATURE_COLUMNS,
    TARGET_COLUMN,
    build_preprocessor,
    add_engineered_features,
    CATEGORICAL_OPTIONS,
    NUMERICAL_CONSTRAINTS
)

def main():
    print("=" * 60)
    print("STUDENT DEPRESSION PREDICTION - MODEL TRAINING & EVALUATION")
    print("=" * 60)

    dataset_path = os.path.join(os.path.dirname(backend_dir), 'dataset', 'student_depression_dataset.csv')
    if not os.path.exists(dataset_path):
        # Fallback to current directory or dataset root
        dataset_path = os.path.join(backend_dir, '..', 'Student_Depression_Dataset.csv')

    print(f"Loading dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)
    print(f"Dataset Loaded Successfully! Shape: {df.shape}")

    # Check for missing values and duplicates
    missing_count = int(df.isnull().sum().sum())
    duplicates_count = int(df.duplicated().sum())
    print(f"Total Missing Values: {missing_count}")
    print(f"Total Duplicate Rows: {duplicates_count}")

    if duplicates_count > 0:
        print(f"Removing {duplicates_count} duplicate rows...")
        df = df.drop_duplicates().reset_index(drop=True)

    # Validate target column
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Target column '{TARGET_COLUMN}' not found in dataset columns: {list(df.columns)}")

    # Target variable distribution
    target_counts = df[TARGET_COLUMN].value_counts().to_dict()
    print(f"Target Distribution: {target_counts}")

    # Binary encoding of target: Yes = 1, No = 0
    y = df[TARGET_COLUMN].map({'Yes': 1, 'No': 0}).astype(int)

    print("Computing domain-specific engineered features...")
    df_enriched = add_engineered_features(df)
    X = df_enriched[ALL_FEATURE_COLUMNS].copy()
    print(f"Total Features (Raw + Engineered): {len(ALL_FEATURE_COLUMNS)}")

    # Stratified Train/Test split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Training Samples: {len(X_train)} | Test Samples: {len(X_test)}")
    print(f"Training Class Ratio: {np.bincount(y_train).tolist()} (0: No, 1: Yes)")
    print(f"Test Class Ratio:     {np.bincount(y_test).tolist()} (0: No, 1: Yes)")

    # Initialize Preprocessor
    preprocessor = build_preprocessor()
    preprocessor.fit(X_train)

    # Candidate Models
    models = {
        'Gradient Boosting': GradientBoostingClassifier(
            n_estimators=120,
            learning_rate=0.08,
            max_depth=4,
            subsample=0.9,
            random_state=42
        ),
        'Random Forest': RandomForestClassifier(
            n_estimators=150,
            max_depth=10,
            min_samples_split=4,
            class_weight='balanced',
            random_state=42
        ),
        'Logistic Regression': LogisticRegression(
            max_iter=1000,
            C=1.0,
            class_weight='balanced',
            random_state=42
        ),
        'Decision Tree': DecisionTreeClassifier(
            max_depth=6,
            min_samples_split=6,
            class_weight='balanced',
            random_state=42
        )
    }

    comparison_results = {}
    fitted_pipelines = {}

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for name, clf in models.items():
        print(f"\n--- Training & Cross-Validating: {name} ---")
        pipe = Pipeline(steps=[
            ('preprocessor', build_preprocessor()),
            ('classifier', clf)
        ])

        # 5-Fold Stratified Cross Validation
        cv_scores = cross_validate(
            pipe,
            X_train,
            y_train,
            cv=cv,
            scoring=['accuracy', 'precision', 'recall', 'f1', 'roc_auc'],
            return_train_score=False
        )

        # Fit on whole train set and evaluate on test set
        pipe.fit(X_train, y_train)
        fitted_pipelines[name] = pipe

        y_pred = pipe.predict(X_test)
        y_prob = pipe.predict_proba(X_test)[:, 1]

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        auc = float(roc_auc_score(y_test, y_prob))

        cm = confusion_matrix(y_test, y_pred).tolist()
        report = classification_report(y_test, y_pred, output_dict=True)

        comparison_results[name] = {
            'model_name': name,
            'test_accuracy': round(acc, 4),
            'test_precision': round(prec, 4),
            'test_recall': round(rec, 4),
            'test_f1': round(f1, 4),
            'test_roc_auc': round(auc, 4),
            'cv_accuracy_mean': round(float(cv_scores['test_accuracy'].mean()), 4),
            'cv_accuracy_std': round(float(cv_scores['test_accuracy'].std()), 4),
            'cv_f1_mean': round(float(cv_scores['test_f1'].mean()), 4),
            'cv_f1_std': round(float(cv_scores['test_f1'].std()), 4),
            'cv_recall_mean': round(float(cv_scores['test_recall'].mean()), 4),
            'cv_precision_mean': round(float(cv_scores['test_precision'].mean()), 4),
            'cv_roc_auc_mean': round(float(cv_scores['test_roc_auc'].mean()), 4),
            'confusion_matrix': cm,
            'classification_report': report
        }

        print(f"Test Accuracy:  {acc:.4f} | Recall: {rec:.4f} | Precision: {prec:.4f} | F1: {f1:.4f} | AUC: {auc:.4f}")
        print(f"CV 5-Fold F1:   {cv_scores['test_f1'].mean():.4f} (+/- {cv_scores['test_f1'].std():.4f})")
        print(f"Confusion Matrix: {cm}")

    # Determine best model based on combined F1 and ROC-AUC
    best_model_name = max(
        comparison_results.keys(),
        key=lambda k: (comparison_results[k]['test_f1'] + comparison_results[k]['test_roc_auc'])
    )
    print(f"\n==========================================")
    print(f"BEST PERFORMING MODEL: {best_model_name}")
    print(f"==========================================")

    best_pipeline = fitted_pipelines[best_model_name]
    best_classifier = best_pipeline.named_steps['classifier']
    fitted_preprocessor = best_pipeline.named_steps['preprocessor']

    # Extract feature importances
    cat_encoder = fitted_preprocessor.named_transformers_['cat']
    cat_feature_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    transformed_feature_names = NUMERICAL_FEATURES + cat_feature_names

    feature_importances = []
    if hasattr(best_classifier, 'feature_importances_'):
        raw_importances = best_classifier.feature_importances_
        for name, score in zip(transformed_feature_names, raw_importances):
            feature_importances.append({
                'feature': name,
                'importance': round(float(score), 5),
                'percentage': round(float(score) * 100, 2)
            })
        feature_importances.sort(key=lambda x: x['importance'], reverse=True)
    elif hasattr(best_classifier, 'coef_'):
        raw_coefs = np.abs(best_classifier.coef_[0])
        norm_coefs = raw_coefs / raw_coefs.sum()
        for name, score in zip(transformed_feature_names, norm_coefs):
            feature_importances.append({
                'feature': name,
                'importance': round(float(score), 5),
                'percentage': round(float(score) * 100, 2)
            })
        feature_importances.sort(key=lambda x: x['importance'], reverse=True)

    # Save artifacts
    models_dir = os.path.join(backend_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)

    model_file = os.path.join(models_dir, 'depression_model.joblib')
    preproc_file = os.path.join(models_dir, 'preprocessing_pipeline.joblib')
    full_pipe_file = os.path.join(models_dir, 'full_pipeline.joblib')
    metrics_file = os.path.join(models_dir, 'model_metrics.json')
    features_file = os.path.join(models_dir, 'feature_importance.json')
    eda_summary_file = os.path.join(models_dir, 'eda_summary.json')

    joblib.dump(best_classifier, model_file)
    joblib.dump(fitted_preprocessor, preproc_file)
    joblib.dump(best_pipeline, full_pipe_file)
    print(f"Saved best model to: {model_file}")
    print(f"Saved preprocessor to: {preproc_file}")
    print(f"Saved full pipeline to: {full_pipe_file}")

    # Build comprehensive metrics JSON
    metrics_payload = {
        'best_model': best_model_name,
        'summary': comparison_results[best_model_name],
        'comparison': comparison_results,
        'dataset_split': {
            'total_samples': len(df),
            'train_samples': len(X_train),
            'test_samples': len(X_test),
            'train_positives': int(y_train.sum()),
            'train_negatives': int((y_train == 0).sum()),
            'test_positives': int(y_test.sum()),
            'test_negatives': int((y_test == 0).sum()),
        },
        'limitations': [
            "This model provides statistical risk assessment based on survey patterns, NOT a medical or clinical diagnosis.",
            "Predictions are derived from student population survey data in Bangladesh and may not generalize identically to all demographics.",
            "Health condition was self-reported or clinically classified into categorical buckets (Good, Normal, Abnormal, Critical), which has dominant predictive power in this dataset.",
            "Class imbalance (~27% positive) requires tracking Recall and F1-score alongside Accuracy."
        ]
    }

    with open(metrics_file, 'w', encoding='utf-8') as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"Saved model metrics to: {metrics_file}")

    with open(features_file, 'w', encoding='utf-8') as f:
        json.dump({
            'model_name': best_model_name,
            'features': feature_importances,
            'top_10': feature_importances[:10]
        }, f, indent=2)
    print(f"Saved feature importance to: {features_file}")

    # Generate and save pre-computed EDA summary for fast API responses
    eda_payload = generate_eda_payload(df)
    with open(eda_summary_file, 'w', encoding='utf-8') as f:
        json.dump(eda_payload, f, indent=2)
    print(f"Saved EDA summary to: {eda_summary_file}")

    print("\nTraining and pipeline generation completed successfully!")

def generate_eda_payload(df):
    """
    Computes statistical summaries, cross-tabulations, and distribution charts for the EDA dashboard.
    """
    total_records = len(df)
    depressed_count = int((df['Depression'] == 'Yes').sum())
    non_depressed_count = int((df['Depression'] == 'No').sum())

    # Overall target distribution
    target_distribution = [
        {'name': 'Not Depressed', 'value': non_depressed_count, 'percentage': round(non_depressed_count / total_records * 100, 2)},
        {'name': 'Depressed', 'value': depressed_count, 'percentage': round(depressed_count / total_records * 100, 2)}
    ]

    # Gender breakdown
    gender_ct = pd.crosstab(df['Gender'], df['Depression'])
    gender_chart = []
    for g in gender_ct.index:
        no_cnt = int(gender_ct.loc[g].get('No', 0))
        yes_cnt = int(gender_ct.loc[g].get('Yes', 0))
        tot = no_cnt + yes_cnt
        gender_chart.append({
            'gender': g,
            'not_depressed': no_cnt,
            'depressed': yes_cnt,
            'total': tot,
            'depression_rate': round(yes_cnt / tot * 100, 2) if tot > 0 else 0
        })

    # Age breakdown
    age_ct = pd.crosstab(df['Age'], df['Depression'])
    age_chart = []
    for age in sorted(age_ct.index):
        no_cnt = int(age_ct.loc[age].get('No', 0))
        yes_cnt = int(age_ct.loc[age].get('Yes', 0))
        tot = no_cnt + yes_cnt
        age_chart.append({
            'age': int(age),
            'not_depressed': no_cnt,
            'depressed': yes_cnt,
            'total': tot,
            'depression_rate': round(yes_cnt / tot * 100, 2) if tot > 0 else 0
        })

    # Health Condition breakdown
    health_ct = pd.crosstab(df['Health_condition'], df['Depression'])
    health_order = ['Good', 'Normal', 'Abnormal', 'Critical']
    health_chart = []
    for h in health_order:
        if h in health_ct.index:
            no_cnt = int(health_ct.loc[h].get('No', 0))
            yes_cnt = int(health_ct.loc[h].get('Yes', 0))
            tot = no_cnt + yes_cnt
            health_chart.append({
                'condition': h,
                'not_depressed': no_cnt,
                'depressed': yes_cnt,
                'total': tot,
                'depression_rate': round(yes_cnt / tot * 100, 2) if tot > 0 else 0
            })

    # Relationship Status breakdown
    rel_ct = pd.crosstab(df['Relationship_status'], df['Depression'])
    rel_chart = []
    for r in rel_ct.index:
        no_cnt = int(rel_ct.loc[r].get('No', 0))
        yes_cnt = int(rel_ct.loc[r].get('Yes', 0))
        tot = no_cnt + yes_cnt
        rel_chart.append({
            'status': r,
            'not_depressed': no_cnt,
            'depressed': yes_cnt,
            'total': tot,
            'depression_rate': round(yes_cnt / tot * 100, 2) if tot > 0 else 0
        })

    # Friend Circle breakdown
    fc_ct = pd.crosstab(df['friend_circle'], df['Depression'])
    friend_chart = []
    for fc in fc_ct.index:
        no_cnt = int(fc_ct.loc[fc].get('No', 0))
        yes_cnt = int(fc_ct.loc[fc].get('Yes', 0))
        tot = no_cnt + yes_cnt
        friend_chart.append({
            'has_friends': fc,
            'not_depressed': no_cnt,
            'depressed': yes_cnt,
            'total': tot,
            'depression_rate': round(yes_cnt / tot * 100, 2) if tot > 0 else 0
        })

    # Family Background breakdown
    fb_ct = pd.crosstab(df['Family_background'], df['Depression'])
    fb_chart = []
    for fb in fb_ct.index:
        no_cnt = int(fb_ct.loc[fb].get('No', 0))
        yes_cnt = int(fb_ct.loc[fb].get('Yes', 0))
        tot = no_cnt + yes_cnt
        fb_chart.append({
            'background': fb,
            'not_depressed': no_cnt,
            'depressed': yes_cnt,
            'total': tot,
            'depression_rate': round(yes_cnt / tot * 100, 2) if tot > 0 else 0
        })

    # Living Style breakdown
    ls_ct = pd.crosstab(df['Living_style'], df['Depression'])
    living_chart = []
    for ls in ls_ct.index:
        no_cnt = int(ls_ct.loc[ls].get('No', 0))
        yes_cnt = int(ls_ct.loc[ls].get('Yes', 0))
        tot = no_cnt + yes_cnt
        living_chart.append({
            'living_style': ls,
            'not_depressed': no_cnt,
            'depressed': yes_cnt,
            'total': tot,
            'depression_rate': round(yes_cnt / tot * 100, 2) if tot > 0 else 0
        })

    # Home Division breakdown
    div_ct = pd.crosstab(df['Home_division'], df['Depression'])
    division_chart = []
    for d in div_ct.index:
        no_cnt = int(div_ct.loc[d].get('No', 0))
        yes_cnt = int(div_ct.loc[d].get('Yes', 0))
        tot = no_cnt + yes_cnt
        division_chart.append({
            'division': d,
            'not_depressed': no_cnt,
            'depressed': yes_cnt,
            'total': tot,
            'depression_rate': round(yes_cnt / tot * 100, 2) if tot > 0 else 0
        })
    division_chart.sort(key=lambda x: x['depression_rate'], reverse=True)

    # CGPA bands
    df_copy = df.copy()
    bins = [2.0, 2.5, 3.0, 3.5, 3.75, 4.01]
    labels = ['2.00 - 2.49', '2.50 - 2.99', '3.00 - 3.49', '3.50 - 3.74', '3.75 - 4.00']
    df_copy['cgpa_band'] = pd.cut(df_copy['CGPA'], bins=bins, labels=labels, right=False)
    cgpa_ct = pd.crosstab(df_copy['cgpa_band'].astype(str), df_copy['Depression'])
    cgpa_chart = []
    for b in labels:
        if b in cgpa_ct.index:
            no_cnt = int(cgpa_ct.loc[b].get('No', 0))
            yes_cnt = int(cgpa_ct.loc[b].get('Yes', 0))
            tot = no_cnt + yes_cnt
            cgpa_chart.append({
                'band': b,
                'not_depressed': no_cnt,
                'depressed': yes_cnt,
                'total': tot,
                'depression_rate': round(yes_cnt / tot * 100, 2) if tot > 0 else 0
            })

    # Semester progression
    sem_ct = pd.crosstab(df['Current_semester'], df['Depression'])
    semester_chart = []
    for s in sorted(sem_ct.index):
        no_cnt = int(sem_ct.loc[s].get('No', 0))
        yes_cnt = int(sem_ct.loc[s].get('Yes', 0))
        tot = no_cnt + yes_cnt
        semester_chart.append({
            'semester': int(s),
            'not_depressed': no_cnt,
            'depressed': yes_cnt,
            'total': tot,
            'depression_rate': round(yes_cnt / tot * 100, 2) if tot > 0 else 0
        })

    # Correlation Matrix of all numerical features (Raw + Engineered)
    df_enriched = add_engineered_features(df)
    df_num = df_enriched[NUMERICAL_FEATURES].copy()
    df_num['Depression'] = (df['Depression'] == 'Yes').astype(int)
    corr = df_num.corr().round(4)
    corr_matrix = {
        'columns': list(corr.columns),
        'data': corr.values.tolist()
    }

    # Numerical Summary Statistics
    num_summary = {}
    for col in NUMERICAL_FEATURES:
        num_summary[col] = {
            'mean': round(float(df_enriched[col].mean()), 2),
            'median': round(float(df_enriched[col].median()), 2),
            'std': round(float(df_enriched[col].std()), 2),
            'min': round(float(df_enriched[col].min()), 2),
            'max': round(float(df_enriched[col].max()), 2),
            'q25': round(float(df_enriched[col].quantile(0.25)), 2),
            'q75': round(float(df_enriched[col].quantile(0.75)), 2)
        }

    return {
        'total_records': total_records,
        'depressed_count': depressed_count,
        'non_depressed_count': non_depressed_count,
        'overall_depression_rate': round(depressed_count / total_records * 100, 2),
        'target_distribution': target_distribution,
        'gender_chart': gender_chart,
        'age_chart': age_chart,
        'health_chart': health_chart,
        'relationship_chart': rel_chart,
        'friend_chart': friend_chart,
        'family_chart': fb_chart,
        'living_chart': living_chart,
        'division_chart': division_chart,
        'cgpa_chart': cgpa_chart,
        'semester_chart': semester_chart,
        'correlation_matrix': corr_matrix,
        'numerical_summary': num_summary,
        'categorical_options': CATEGORICAL_OPTIONS,
        'numerical_constraints': {
            k: {**v, 'type': v['type'].__name__}
            for k, v in NUMERICAL_CONSTRAINTS.items()
        }
    }

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
import argparse
import json
import os
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, average_precision_score, classification_report
import joblib


CLASS_LABEL = 'conv_label'


def load_features(path: str) -> pd.DataFrame:
    df = pd.read_parquet(path)
    # Ensure numeric dtypes for model inputs
    for c in df.columns:
        if c == 'session_id':
            continue
        if df[c].dtype == 'bool':
            df[c] = df[c].astype(int)
    return df


def split_X_y(df: pd.DataFrame):
    y = df[CLASS_LABEL].astype(int)
    X = df.drop(columns=['session_id', CLASS_LABEL], errors='ignore')
    X = X.fillna(0)
    return X, y


def train_rf(X, y, seed=42):
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=seed, stratify=y)
    clf = RandomForestClassifier(n_estimators=200, max_depth=None, random_state=seed, n_jobs=-1, class_weight='balanced')
    clf.fit(Xtr, ytr)
    proba = clf.predict_proba(Xte)[:, 1]
    auc = roc_auc_score(yte, proba)
    ap = average_precision_score(yte, proba)
    return clf, {'rf_auc': float(auc), 'rf_ap': float(ap)}


def train_iso(X, seed=42):
    iso = IsolationForest(n_estimators=200, contamination='auto', random_state=seed)
    iso.fit(X)
    scores = -iso.score_samples(X)
    return iso, scores


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--features', required=True)
    ap.add_argument('--model_out', required=True)
    args = ap.parse_args()

    Path(args.model_out).mkdir(parents=True, exist_ok=True)

    df = load_features(args.features)
    X, y = split_X_y(df)

    rf, rf_metrics = train_rf(X, y)
    iso, iso_scores = train_iso(X)

    # Persist models
    rf_path = os.path.join(args.model_out, 'session_conversion_rf.joblib')
    iso_path = os.path.join(args.model_out, 'session_isoforest.joblib')
    joblib.dump(rf, rf_path)
    joblib.dump(iso, iso_path)

    # Attach anomaly score and save
    out_df = df.copy()
    out_df['anomaly_score'] = iso_scores
    feats_out = os.path.join(args.model_out, 'feats_with_anomaly.parquet')
    out_df.to_parquet(feats_out, index=False)

    # Metrics
    metrics = {
        **rf_metrics,
        'n_sessions': int(len(df)),
        'n_positive': int(df[CLASS_LABEL].sum()),
        'feature_columns': [c for c in df.columns if c not in ('session_id', CLASS_LABEL)],
    }
    with open(os.path.join(args.model_out, 'metrics.json'), 'w', encoding='utf-8') as f:
        json.dump(metrics, f, indent=2)

    print('Saved:')
    print(' ', rf_path)
    print(' ', iso_path)
    print(' ', feats_out)
    print(' ', os.path.join(args.model_out, 'metrics.json'))


if __name__ == '__main__':
    main()

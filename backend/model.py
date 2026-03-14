"""
BehaviorGuard — ML Model (XGBoost)
Handles training, persistence, prediction, and SHAP explainability.
"""

import os
import pickle
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional

import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import shap

from synthetic_data import generate_dataset
from features import FEATURE_NAMES, features_to_array

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model_artifacts", "xgboost_model.pkl")
EXPLAINER_PATH = os.path.join(os.path.dirname(__file__), "model_artifacts", "shap_explainer.pkl")


class BehaviorGuardModel:
    def __init__(self):
        self.model: Optional[xgb.XGBClassifier] = None
        self.explainer: Optional[shap.TreeExplainer] = None
        self._load_or_train()

    def _load_or_train(self):
        """Load model from disk if it exists, otherwise train from scratch."""
        if os.path.exists(MODEL_PATH):
            print("[BehaviorGuard] Loading pre-trained model...")
            with open(MODEL_PATH, "rb") as f:
                self.model = pickle.load(f)
            if os.path.exists(EXPLAINER_PATH):
                with open(EXPLAINER_PATH, "rb") as f:
                    self.explainer = pickle.load(f)
            print("[BehaviorGuard] Model loaded successfully.")
        else:
            print("[BehaviorGuard] No pre-trained model found. Training from scratch...")
            self.train()

    def train(self, n_human: int = 600, n_bot: int = 600, n_sophisticated: int = 150):
        """
        Generate synthetic data, train XGBoost, save model and SHAP explainer.
        """
        print("[BehaviorGuard] Generating synthetic training data...")
        X, y = generate_dataset(n_human, n_bot, n_sophisticated)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        print("[BehaviorGuard] Training XGBoost classifier...")
        self.model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        )

        self.model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False,
        )

        # Evaluate
        y_pred = self.model.predict(X_test)
        y_prob = self.model.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, y_prob)
        report = classification_report(y_test, y_pred, target_names=["bot", "human"])
        print(f"\n[BehaviorGuard] Evaluation Results:\n{report}")
        print(f"[BehaviorGuard] ROC-AUC: {auc:.4f}")

        # Build SHAP explainer
        print("[BehaviorGuard] Building SHAP explainer...")
        self.explainer = shap.TreeExplainer(self.model)

        # Save artifacts
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self.model, f)
        with open(EXPLAINER_PATH, "wb") as f:
            pickle.dump(self.explainer, f)
        print(f"[BehaviorGuard] Model saved to {MODEL_PATH}")

    def predict(self, features: Dict[str, float]) -> Dict:
        """
        Run inference on an engineered feature dict.
        Returns score (0.0–1.0, higher = more human), verdict, confidence level.
        """
        if self.model is None:
            raise RuntimeError("Model not loaded. Call train() first.")

        feature_arr = np.array([features_to_array(features)])
        df = pd.DataFrame(feature_arr, columns=FEATURE_NAMES)

        prob = self.model.predict_proba(df)[0]
        human_score = float(prob[1])  # probability of class 1 (human)

        verdict = "human" if human_score >= 0.5 else "bot"

        prob = human_score if verdict == "human" else (1.0 - human_score)

        if prob >= 0.80:
            confidence_level = "high"
        elif prob >= 0.60:
            confidence_level = "medium"
        else:
            confidence_level = "low"

        return {
            "score": round(human_score, 4),
            "verdict": verdict,
            "confidence_level": confidence_level,
        }

    def explain(self, features: Dict[str, float]) -> List[Dict]:
        """
        Return SHAP-style feature contributions for the given features.
        Returns top features sorted by absolute contribution (descending).
        """
        if self.explainer is None:
            return []

        feature_arr = np.array([features_to_array(features)])
        df = pd.DataFrame(feature_arr, columns=FEATURE_NAMES)

        shap_values = self.explainer.shap_values(df)

        # shap_values shape: (2, 1, n_features) for binary classification
        # Take class 1 (human) shap values
        if isinstance(shap_values, list):
            vals = shap_values[1][0]
        else:
            vals = shap_values[0]

        contributions = [
            {"feature": FEATURE_NAMES[i], "value": round(float(vals[i]), 4)}
            for i in range(len(FEATURE_NAMES))
        ]

        # Sort by absolute contribution, descending
        contributions.sort(key=lambda x: abs(x["value"]), reverse=True)
        return contributions[:6]  # top 6


# Singleton instance — loaded once at import time
_model_instance: Optional[BehaviorGuardModel] = None


def get_model() -> BehaviorGuardModel:
    global _model_instance
    if _model_instance is None:
        _model_instance = BehaviorGuardModel()
    return _model_instance


if __name__ == "__main__":
    print("=== BehaviorGuard Model Training ===")
    m = BehaviorGuardModel()
    # Quick sanity check prediction
    test_features = {
        "mouse_event_count": 350.0,
        "mouse_avg_speed": 0.9,
        "mouse_jitter_index": 22.0,
        "mouse_path_curvature": 0.72,
        "mouse_pause_count": 7.0,
        "keystroke_count": 18.0,
        "avg_keystroke_gap_ms": 210.0,
        "keystroke_rhythm_entropy": 3.1,
        "backspace_ratio": 0.08,
        "typing_speed_wpm": 55.0,
        "scroll_event_count": 5.0,
        "scroll_direction_changes": 2.0,
        "time_to_first_interaction_ms": 2100.0,
        "form_fill_duration_ms": 12000.0,
        "timezone_language_match": 1.0,
        "headless_browser_score": 0.02,
        "screen_resolution_common": 1.0,
        "hardware_concurrency": 8.0,
    }
    result = m.predict(test_features)
    shap_vals = m.explain(test_features)
    print(f"\nTest prediction (human session): {result}")
    print(f"SHAP values: {shap_vals}")

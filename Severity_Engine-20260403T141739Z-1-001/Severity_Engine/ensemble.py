"""
ensemble.py
"""
import numpy as np
import optuna
from sklearn.metrics import log_loss
import joblib

optuna.logging.set_verbosity(optuna.logging.WARNING)


def fit_ensemble_weights(
    probs_xgb:   np.ndarray,   # shape (n_val, 8)
    probs_lgbm:  np.ndarray,
    y_val:       np.ndarray,
    n_trials:    int = 300,
    seed:        int = 42,
) -> dict:
    """
    Optimises blending weights for XGBoost and LightGBM.
    """

    def objective(trial):
        w1 = trial.suggest_float("w_xgb",   0.0, 1.0)
        w2 = trial.suggest_float("w_lgbm",  0.0, 1.0)
        total = w1 + w2 + 1e-9
        w1, w2 = w1/total, w2/total

        blended = w1 * probs_xgb + w2 * probs_lgbm
        blended = np.clip(blended, 1e-9, 1 - 1e-9)
        blended /= blended.sum(axis=1, keepdims=True)
        return log_loss(y_val, blended)

    study = optuna.create_study(
        direction="minimize",
        sampler=optuna.samplers.TPESampler(seed=seed),
    )
    study.optimize(objective, n_trials=n_trials, show_progress_bar=True)

    bp = study.best_params
    total = bp["w_xgb"] + bp["w_lgbm"] + 1e-9
    weights = {
        "w_xgb":    bp["w_xgb"]    / total,
        "w_lgbm":   bp["w_lgbm"]   / total,
    }
    print(f"Ensemble weights (XGB+LGBM): {weights}")
    print(f"Best ensemble log-loss: {study.best_value:.4f}")
    joblib.dump(weights, "ensemble_weights.joblib")
    return weights


def ensemble_predict(
    X: np.ndarray,
    model_xgb,
    model_lgbm,
    weights: dict,
) -> tuple[np.ndarray, np.ndarray]:
    """Returns (predicted_class, probability_matrix)."""
    p_xgb   = model_xgb.predict_proba(X)
    p_lgbm  = model_lgbm.predict_proba(X)

    blended = (weights["w_xgb"]  * p_xgb  +
               weights["w_lgbm"] * p_lgbm)
    blended = np.clip(blended, 1e-9, 1 - 1e-9)
    blended /= blended.sum(axis=1, keepdims=True)

    predicted_class = np.argmax(blended, axis=1)
    return predicted_class, blended


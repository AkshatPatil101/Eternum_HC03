"""
train_xgboost.py
"""
import numpy as np
import optuna
import xgboost as xgb
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import log_loss
import joblib

optuna.logging.set_verbosity(optuna.logging.WARNING)


def train_xgboost(X_train, y_train, n_trials: int = 50,
                  seed: int = 42) -> xgb.XGBClassifier:
    """
    Optimises multi-class log-loss with Optuna TPE sampler.
    Returns the best retrained model.
    """
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)

    def objective(trial):
        params = dict(
            n_estimators      = trial.suggest_int("n_estimators", 200, 1200),
            max_depth         = trial.suggest_int("max_depth", 3, 10),
            learning_rate     = trial.suggest_float("learning_rate", 1e-3, 0.3, log=True),
            subsample         = trial.suggest_float("subsample", 0.5, 1.0),
            colsample_bytree  = trial.suggest_float("colsample_bytree", 0.4, 1.0),
            colsample_bylevel = trial.suggest_float("colsample_bylevel", 0.4, 1.0),
            min_child_weight  = trial.suggest_int("min_child_weight", 1, 20),
            gamma             = trial.suggest_float("gamma", 0, 5),
            reg_alpha         = trial.suggest_float("reg_alpha", 1e-4, 10, log=True),
            reg_lambda        = trial.suggest_float("reg_lambda", 1e-4, 10, log=True),
            tree_method       = "hist",
            device            = "cuda",
            objective         = "multi:softprob",
            eval_metric       = "mlogloss",
            random_state      = seed,
            n_jobs            = -1,
        )
        losses = []
        for tr_idx, va_idx in cv.split(X_train, y_train):
            m = xgb.XGBClassifier(**params)
            m.fit(X_train[tr_idx], y_train[tr_idx],
                  eval_set=[(X_train[va_idx], y_train[va_idx])],
                  verbose=False)
            prob = m.predict_proba(X_train[va_idx])
            losses.append(log_loss(y_train[va_idx], prob))
        return np.mean(losses)

    study = optuna.create_study(
        direction="minimize",
        sampler=optuna.samplers.TPESampler(seed=seed),
        pruner=optuna.pruners.MedianPruner(n_startup_trials=10)
    )
    study.optimize(objective, n_trials=n_trials, show_progress_bar=True)

    best_params = study.best_params
    best_params.update(dict(
        objective="multi:softprob",
        eval_metric="mlogloss",
        random_state=seed,
        n_jobs=-1,
    ))
    final_model = xgb.XGBClassifier(**best_params)
    final_model.fit(X_train, y_train)
    joblib.dump(final_model, "model_xgboost.joblib")
    print(f"XGBoost best mlogloss: {study.best_value:.4f}")
    return final_model

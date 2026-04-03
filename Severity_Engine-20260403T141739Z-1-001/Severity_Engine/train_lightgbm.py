"""
train_lightgbm.py
"""
import numpy as np
import optuna
import lightgbm as lgb
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import log_loss
import joblib

optuna.logging.set_verbosity(optuna.logging.WARNING)


def train_lightgbm(X_train, y_train, n_trials: int = 50,
                   seed: int = 42) -> lgb.LGBMClassifier:
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)

    def objective(trial):
        params = dict(
            n_estimators      = trial.suggest_int("n_estimators", 200, 1500),
            num_leaves        = trial.suggest_int("num_leaves", 20, 300),
            max_depth         = trial.suggest_int("max_depth", -1, 15),
            learning_rate     = trial.suggest_float("learning_rate", 1e-3, 0.3, log=True),
            min_child_samples = trial.suggest_int("min_child_samples", 5, 100),
            subsample         = trial.suggest_float("subsample", 0.5, 1.0),
            colsample_bytree  = trial.suggest_float("colsample_bytree", 0.4, 1.0),
            reg_alpha         = trial.suggest_float("reg_alpha", 1e-4, 10, log=True),
            reg_lambda        = trial.suggest_float("reg_lambda", 1e-4, 10, log=True),
            min_split_gain    = trial.suggest_float("min_split_gain", 0, 1),
            device            = "gpu",
            objective         = "multiclass",
            metric            = "multi_logloss",
            verbose           = -1,
            random_state      = seed,
            n_jobs            = -1,
        )
        losses = []
        for tr_idx, va_idx in cv.split(X_train, y_train):
            m = lgb.LGBMClassifier(**params)
            m.fit(X_train[tr_idx], y_train[tr_idx],
                  eval_set=[(X_train[va_idx], y_train[va_idx])],
                  callbacks=[lgb.early_stopping(50, verbose=False)])
            prob = m.predict_proba(X_train[va_idx])
            losses.append(log_loss(y_train[va_idx], prob))
        return np.mean(losses)

    study = optuna.create_study(
        direction="minimize",
        sampler=optuna.samplers.TPESampler(seed=seed),
        pruner=optuna.pruners.HyperbandPruner()
    )
    study.optimize(objective, n_trials=n_trials, show_progress_bar=True)

    best_params = study.best_params
    best_params.update(dict(
        objective="multiclass", metric="multi_logloss",
        verbose=-1, random_state=seed, n_jobs=-1
    ))
    final_model = lgb.LGBMClassifier(**best_params)
    final_model.fit(X_train, y_train)
    joblib.dump(final_model, "model_lightgbm.joblib")
    print(f"LightGBM best multi_logloss: {study.best_value:.4f}")
    return final_model

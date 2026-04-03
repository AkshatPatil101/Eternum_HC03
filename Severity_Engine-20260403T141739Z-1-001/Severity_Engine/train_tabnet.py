"""
train_tabnet.py
"""
import numpy as np
import torch
import torch.nn.functional as F
import optuna
from pytorch_tabnet.tab_model import TabNetClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import log_loss
import joblib

optuna.logging.set_verbosity(optuna.logging.WARNING)

N_CLASSES = 8


class FocalLoss(torch.nn.Module):
    """Multi-class focal loss to handle class imbalance."""
    def __init__(self, gamma: float = 2.0, reduction: str = "mean"):
        super().__init__()
        self.gamma     = gamma
        self.reduction = reduction

    def forward(self, logits: torch.Tensor,
                targets: torch.Tensor) -> torch.Tensor:
        ce   = F.cross_entropy(logits, targets, reduction="none")
        p_t  = torch.exp(-ce)
        loss = (1 - p_t) ** self.gamma * ce
        return loss.mean() if self.reduction == "mean" else loss.sum()


def tabnet_objective(trial, X_train, y_train, seed):
    params = dict(
        n_d            = trial.suggest_int("n_d", 8, 64),
        n_a            = trial.suggest_int("n_a", 8, 64),
        n_steps        = trial.suggest_int("n_steps", 3, 10),
        gamma          = trial.suggest_float("gamma", 1.0, 2.0),
        n_independent  = trial.suggest_int("n_independent", 1, 5),
        n_shared       = trial.suggest_int("n_shared", 1, 5),
        momentum       = trial.suggest_float("momentum", 0.01, 0.4),
        mask_type      = trial.suggest_categorical("mask_type",
                                                   ["sparsemax", "entmax"]),
        lambda_sparse  = trial.suggest_float("lambda_sparse", 1e-6, 1e-3,
                                              log=True),
    )
    lr     = trial.suggest_float("lr", 1e-4, 1e-2, log=True)
    gamma_fl = trial.suggest_float("focal_gamma", 1.0, 3.0)
    focal  = FocalLoss(gamma=gamma_fl)

    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=seed)
    losses = []
    for tr_idx, va_idx in cv.split(X_train, y_train):
        model = TabNetClassifier(
            **params,
            optimizer_fn=torch.optim.Adam,
            optimizer_params={"lr": lr},
            scheduler_fn=torch.optim.lr_scheduler.CosineAnnealingLR,
            scheduler_params={"T_max": 100},
            seed=seed,
            verbose=0,
            device_name="cuda",
        )
        model.fit(
            X_train[tr_idx].astype(np.float32),
            y_train[tr_idx],
            eval_set=[(X_train[va_idx].astype(np.float32),
                       y_train[va_idx])],
            eval_metric=["logloss"],
            max_epochs=200,
            patience=20,
            loss_fn=focal,
            batch_size=1024,
            virtual_batch_size=256,
        )
        prob = model.predict_proba(X_train[va_idx].astype(np.float32))
        losses.append(log_loss(y_train[va_idx], prob))
    return np.mean(losses)


def train_tabnet(X_train, y_train, n_trials: int = 2,
                 seed: int = 42) -> TabNetClassifier:
    study = optuna.create_study(
        direction="minimize",
        sampler=optuna.samplers.TPESampler(seed=seed)
    )
    study.optimize(
        lambda t: tabnet_objective(t, X_train, y_train, seed),
        n_trials=n_trials,
        show_progress_bar=True
    )

    bp = study.best_params
    f_gamma = bp.pop("focal_gamma")
    focal = FocalLoss(gamma=f_gamma)
    lr    = bp.pop("lr")
    final = TabNetClassifier(
        **bp,
        optimizer_fn=torch.optim.Adam,
        optimizer_params={"lr": lr},
        seed=seed, verbose=0,
        device_name="cuda",
    )
    final.fit(
        X_train.astype(np.float32), y_train,
        max_epochs=300, patience=30,
        loss_fn=focal, batch_size=1024, virtual_batch_size=256
    )
    final.save_model("model_tabnet")
    print(f"TabNet best log-loss: {study.best_value:.4f}")
    return final


if __name__ == "__main__":
    import os
    import sys
    import pandas as pd
    import joblib
    from sklearn.model_selection import train_test_split

    SEED = 42
    print("🚀 Starting Standalone TabNet GPU Training...")
    
    # Label Config (In-lined for standalone reliability)
    CARE_NEED_COLS = [
        "need_icu", "need_ventilator", "need_ot",
        "need_cardiologist", "need_neurosurgeon", "need_blood_bank",
        "need_cath_lab", "need_toxicology", "need_obstetrician", "need_ct_scan",
    ]

    def extract_labels(df: pd.DataFrame):
        y_type = df["emergency_type_label"].values.astype(int)
        return y_type

    # 1. Load data
    if not os.path.exists("triage_dataset.parquet"):
        print("❌ Error: triage_dataset.parquet not found. Run synthetic_data_generator.py first.")
        sys.exit(1)
        
    df = pd.read_parquet("triage_dataset.parquet")
    y_type = extract_labels(df)
    
    # 2. Feature Engineering
    if not os.path.exists("feature_engineer.joblib"):
        print("❌ Error: feature_engineer.joblib not found. Run train_pipeline.py first (data-gen part).")
        sys.exit(1)
        
    fe = joblib.load("feature_engineer.joblib")
    X = fe.transform(df)
    
    # 3. Train/Test Split (matching pipeline)
    X_tr, _, y_tr_type, _, = train_test_split(
        X, y_type, test_size=0.2, random_state=SEED, stratify=y_type
    )
    
    # 4. Train with GPU (2 trials as requested)
    train_tabnet(X_tr, y_tr_type, n_trials=2, seed=SEED)


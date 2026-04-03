import pandas as pd
df = pd.read_parquet('triage_dataset_v2.parquet')
print('=== Severity by Emergency Type ===')
for etype in sorted(df['emergency_type'].unique()):
    sub = df[df['emergency_type']==etype]
    crit = len(sub[sub.severity_tier=="CRITICAL"])
    urg = len(sub[sub.severity_tier=="URGENT"])
    stab = len(sub[sub.severity_tier=="STABLE"])
    print(f'{etype:22s} | mean={sub.severity_score.mean():.1f} | std={sub.severity_score.std():.1f} | min={sub.severity_score.min():.0f} | max={sub.severity_score.max():.0f} | CRIT={crit:4d} | URG={urg:4d} | STAB={stab:4d}')

total_c = len(df[df.severity_tier=="CRITICAL"])
total_u = len(df[df.severity_tier=="URGENT"])
total_s = len(df[df.severity_tier=="STABLE"])
print(f'\nOverall: CRITICAL={total_c}, URGENT={total_u}, STABLE={total_s}')
print(f'\nTop 15 most severe cases:')
print(df.nlargest(15, 'severity_score')[['emergency_type','age','hr','bp_sys','spo2','gcs','rr','temp','severity_score','severity_tier']].to_string())
print(f'\nBottom 10 least severe:')
print(df.nsmallest(10, 'severity_score')[['emergency_type','age','hr','bp_sys','spo2','gcs','rr','severity_score','severity_tier']].to_string())

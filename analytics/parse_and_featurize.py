#!/usr/bin/env python3
import argparse
import json
import os
import glob
import math
from datetime import datetime
from collections import defaultdict, Counter

import pandas as pd


def resolve_infile(path_like: str) -> str:
    # Support a virtual path like logs/latest.ndjson by resolving to newest file
    if os.path.basename(path_like) == 'latest.ndjson':
        log_dir = os.path.dirname(path_like) or 'logs'
        candidates = sorted(glob.glob(os.path.join(log_dir, '*.ndjson')))
        if not candidates:
            raise FileNotFoundError(f"No NDJSON logs found in {log_dir}")
        return candidates[-1]
    return path_like


def parse_ndjson(path: str):
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except Exception:
                # skip malformed lines
                continue


def is_conversion(evt: dict) -> bool:
    # Heuristic conversion: any write or create_picklist/auth_ok etc.
    e = (evt.get('event') or '').lower()
    path = (evt.get('path') or '').lower()
    method = (evt.get('method') or '').upper()
    if e in {'create_picklist', 'auth_ok'}:
        return True
    if 'goods_write' in e or 'bins_write' in e or 'shares_write' in e:
        return True
    if method in {'POST', 'PUT', 'PATCH', 'DELETE'}:
        return True
    if '/api/picklist/create' in path:
        return True
    return False


def build_session_features(events):
    # Aggregate by session_id
    by_sess = defaultdict(list)
    for ev in events:
        sid = ev.get('session_id') or 'unknown'
        by_sess[sid].append(ev)

    rows = []
    for sid, evs in by_sess.items():
        evs_sorted = sorted(evs, key=lambda x: x.get('ts', ''))
        ts_first = evs_sorted[0].get('ts')
        ts_last = evs_sorted[-1].get('ts')
        t_first = pd.to_datetime(ts_first, errors='coerce')
        t_last = pd.to_datetime(ts_last, errors='coerce')
        dur_sec = max(0.0, (t_last - t_first).total_seconds()) if pd.notnull(t_first) and pd.notnull(t_last) else 0.0

        methods = Counter((ev.get('method') or '').upper() for ev in evs)
        statuses = Counter(int(ev.get('status') or 0) for ev in evs)
        events_names = Counter((ev.get('event') or '').lower() for ev in evs)
        paths = Counter((ev.get('path') or '').lower() for ev in evs)
        avg_latency = sum(float(ev.get('latency_ms') or 0.0) for ev in evs) / max(1, len(evs))

        conv = any(is_conversion(ev) for ev in evs)

        row = {
            'session_id': sid,
            'n_events': len(evs),
            'n_get': methods.get('GET', 0),
            'n_post': methods.get('POST', 0),
            'n_put': methods.get('PUT', 0),
            'n_delete': methods.get('DELETE', 0),
            'n_status_2xx': sum(c for s, c in statuses.items() if 200 <= s < 300),
            'n_status_4xx': sum(c for s, c in statuses.items() if 400 <= s < 500),
            'n_status_5xx': sum(c for s, c in statuses.items() if 500 <= s < 600),
            'avg_latency_ms': avg_latency,
            'uniq_paths': len(paths),
            'dur_sec': dur_sec,
            'conv_label': int(bool(conv)),
        }
        # Top few event counts as columns
        for name in ['page_view', 'search', 'goods_read', 'goods_write', 'bins_read', 'bins_write', 'shares_read', 'shares_write', 'audit_read']:
            row[f'evt_{name}'] = events_names.get(name, 0)
        rows.append(row)
    return pd.DataFrame(rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--infile', required=True, help='Path to NDJSON log or logs/latest.ndjson')
    ap.add_argument('--outfile', required=True, help='Output parquet path')
    args = ap.parse_args()

    infile = resolve_infile(args.infile)
    events = list(parse_ndjson(infile))
    if not events:
        raise SystemExit('No events to process')
    df = build_session_features(events)
    os.makedirs(os.path.dirname(args.outfile) or '.', exist_ok=True)
    df.to_parquet(args.outfile, index=False)
    print(f"Wrote features: {args.outfile} with {len(df)} sessions")


if __name__ == '__main__':
    main()

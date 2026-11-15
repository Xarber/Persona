#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
import gzip
import json
import re
import sys
from datetime import date
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return json.loads((ROOT / path).read_text())


def require(condition, message):
    if not condition:
        raise ValueError(message)


def verify_path(path):
    resolved = (ROOT / path).resolve()
    require(resolved.is_relative_to(ROOT) and resolved.is_file(), f'Missing evidence: {path}')


def main():
    manifest = read('uads.json')
    schema = read('config/uads-schema.json')
    Draft202012Validator.check_schema(schema)
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(manifest)
    registry = read('config/uads-requirements.json')
    ids = {entry['id'] for entry in registry}
    require(len(ids) == len(registry), 'Duplicate registry identifiers')
    requirements = {entry['id']: entry for entry in manifest['requirements']}
    require(len(requirements) == len(manifest['requirements']), 'Duplicate manifest identifiers')
    require(ids == requirements.keys(), 'Manifest and registry declarations differ')
    exceptions = {entry['id']: entry for entry in manifest['exceptions']}
    require(len(exceptions) == len(manifest['exceptions']), 'Duplicate exceptions')
    waived = {key for key, item in requirements.items() if item['state'] == 'Waived'}
    require(exceptions.keys() == waived, 'Waived requirements must match approved exceptions')
    for key, entry in requirements.items():
        if entry['state'] == 'Passed':
            require(bool(entry['evidence']), f'{key}: passing state requires evidence')
        require((entry['state'] == 'Not Applicable') == (entry['applicability'] == 'not-applicable'),
                f'{key}: inconsistent applicability')
        require((key in waived) == (entry['applicability'] == 'approved-exception'),
                f'{key}: inconsistent exception')
        for path in entry['evidence']:
            verify_path(path)
    for entry in exceptions.values():
        require(date.fromisoformat(entry['approvedOn']) <= date.today() <=
                date.fromisoformat(entry['reviewOn']), 'Invalid or expired exception dates')
    for path in manifest['quality'].values():
        verify_path(path)
    if '--bundle' in sys.argv:
        dist = ROOT / 'studio/dist'
        source = (dist / 'index.html').read_text()
        entries = re.findall(r'<script[^>]+src="/assets/([^"]+\.js)"', source)
        require(bool(entries), 'No built entry script found')
        size = sum(len(gzip.compress((dist / 'assets' / name).read_bytes())) for name in set(entries))
        limit = read(manifest['quality']['budgets'])['maxEntryJsGzipBytes']
        require(size <= limit, f'Gzip entry scripts: {size} bytes exceeds {limit}')
        print(f'Gzip entry scripts: {size}/{limit} bytes (excludes dynamically loaded chunks)')
    print(f'UADS structure valid: {len(ids)} declarations. Functional evidence reviewed separately.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        sys.exit(f'UADS validation failed: {error}')

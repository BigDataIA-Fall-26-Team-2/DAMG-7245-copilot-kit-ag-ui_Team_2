#!/usr/bin/env python3
"""Run locally: securely enter the deployment API key without logging it."""
import getpass
import json
from pathlib import Path
import re
import subprocess

root = Path(__file__).resolve().parent.parent
state = root / '.deploy'
host = (state / 'host').read_text().strip()
lock = json.loads((root / 'claude-lock.json').read_text())['resources']
agent = lock['./agents/financial-assistant.md']
environment = lock['./environments/financial-assistant.yaml']
key = getpass.getpass('Anthropic API key (hidden): ').strip()
if not re.fullmatch(r'sk-ant-[A-Za-z0-9_-]+', key):
    raise SystemExit('Expected an Anthropic API key; no changes made.')
values = {'ANTHROPIC_API_KEY': key, 'ANTHROPIC_AGENT_ID': agent['id'],
          'ANTHROPIC_AGENT_VERSION': str(agent['version']),
          'ANTHROPIC_ENVIRONMENT_ID': environment['id']}
config = ''.join(f'{name}={json.dumps(value)}\n' for name, value in values.items())
subprocess.run(['ssh', '-i', str(state / 'ec2-demo'),
    '-o', 'UserKnownHostsFile=.deploy/known_hosts',
    '-o', 'StrictHostKeyChecking=yes', f'ubuntu@{host}',
    "sudo sh -c 'umask 077; cat > /etc/finance/app.env' && sudo systemctl restart finance"],
    input=config, text=True, check=True, cwd=root)
print('Key configured on EC2 and finance service restarted. No key saved locally.')

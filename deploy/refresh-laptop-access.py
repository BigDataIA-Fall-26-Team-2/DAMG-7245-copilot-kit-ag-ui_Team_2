#!/usr/bin/env python3
"""Run on the presentation network to replace the demo's SSH and HTTPS source IP."""
import json
from pathlib import Path
import subprocess
from urllib.request import urlopen
import ipaddress

root = Path(__file__).resolve().parent.parent
sg = (root / '.deploy/security-group-id').read_text().strip()
base = ['aws', '--profile', 'lantern', '--region', 'us-east-1', 'ec2']
with urlopen('https://checkip.amazonaws.com', timeout=10) as response:
    ip = str(ipaddress.IPv4Address(response.read().decode().strip()))
rules = json.loads(subprocess.check_output(base + ['describe-security-group-rules',
    '--filters', f'Name=group-id,Values={sg}', '--output', 'json']))['SecurityGroupRules']
# Authorize/revoke are supported by the demo account; ModifySecurityGroupRules
# is not. Add the new address first so an interrupted update cannot lock us out.
for port in (22, 443):
    matches = [r for r in rules if not r['IsEgress'] and r.get('FromPort') == port and r.get('ToPort') == port]
    if not matches or any(r.get('IpProtocol') != 'tcp' or not r.get('CidrIpv4', '').endswith('/32') for r in matches):
        raise SystemExit(f'Unexpected access rules for port {port}; review manually.')
    if not any(r['CidrIpv4'] == ip + '/32' for r in matches):
        subprocess.run(base + ['authorize-security-group-ingress', '--group-id', sg,
            '--protocol', 'tcp', '--port', str(port), '--cidr', ip + '/32'], check=True)
    for rule in matches:
        if rule['CidrIpv4'] != ip + '/32':
            subprocess.run(base + ['revoke-security-group-ingress', '--group-id', sg,
                '--protocol', 'tcp', '--port', str(port), '--cidr', rule['CidrIpv4']], check=True)
print('SSH and HTTPS access restricted to your current public IP.')
print('Open https://' + (root / '.deploy/host').read_text().strip())

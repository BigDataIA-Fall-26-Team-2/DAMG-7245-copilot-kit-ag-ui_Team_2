#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
HOST=$(cat .deploy/host)
echo 'Keep this terminal open. Open http://localhost:8788 in your browser.'
exec ssh -i .deploy/ec2-demo -o UserKnownHostsFile=.deploy/known_hosts \
  -o StrictHostKeyChecking=yes -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  -N -L 127.0.0.1:8788:127.0.0.1:8787 "ubuntu@$HOST"

#!/bin/bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl xz-utils
cd /tmp
curl --fail --silent --show-error --location https://nodejs.org/dist/v22.23.5/node-v22.23.5-linux-x64.tar.xz -o node-linux.tar.xz
echo 'cdeb8670a0c81f51b4dc4ac61919f9b1ad917b304bf8221eb939570663d240f8  node-linux.tar.xz' | sha256sum -c -
tar -xJf node-linux.tar.xz -C /usr/local --strip-components=1
id finance >/dev/null 2>&1 || useradd --system --create-home --home-dir /opt/finance --shell /usr/sbin/nologin finance
install -d -o finance -g finance /opt/finance/app
install -d -m 700 /etc/finance

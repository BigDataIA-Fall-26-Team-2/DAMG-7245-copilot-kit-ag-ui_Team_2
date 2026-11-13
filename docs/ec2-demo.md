# EC2 demo deployment

The demo runs on a dedicated EC2 instance in the `lantern` account, region `us-east-1`. It uses Ubuntu 24.04, Node 22, a t3.small instance (standard CPU credits), and a 16 GiB encrypted gp3 root disk. This is a billed AWS resource; stop it after the demo when it is no longer needed. Storage remains billed while stopped.

The deployment starts from main commit `e60cc86`, with deployment scripts and a mid-stream Explain-button fix on `feature/ec2-deployment`. Frontend assets were built locally and uploaded with a Git archive of the reviewed source. Linux production dependencies are installed on the instance with `npm ci --omit=dev`. No local node_modules, login credentials, or .env files are included in the archive.

## How access works

Open **https://107.22.124.221** directly. Browser → Nginx HTTPS on EC2 → Node on port 8787 → Claude Managed Agents. No SSH tunnel is needed for normal use.

The security group restricts SSH (22) and HTTPS (443) to the presentation laptop's current public IPv4 address. Port 80 is reachable for ACME certificate validation and redirects other requests to HTTPS; it does not proxy the application. Port 8787 is not publicly allowed. CORS permits the HTTPS URL and optional tunnel origins, but is not an authentication mechanism.

A trusted Let's Encrypt IP-address certificate expires November 20, 2026. A systemd timer checks renewal twice daily and reloads Nginx after renewal. The service uses an IP-specific short-lived certificate; if the EC2 public IP changes after stopping/starting, the certificate and Nginx configuration must be updated. Leave the instance running through the demo.

## Local setup files

- `deploy/bootstrap-ubuntu.sh`: instance bootstrap, installs a checksum-verified Node binary and creates the service account.
- `deploy/finance.service`: systemd service; starts on boot and restarts on process failure.
- `deploy/configure-key.py`: hidden terminal prompt; sends an Anthropic API key and existing agent/environment IDs over SSH to `/etc/finance/app.env`. The directory is root-only and the file mode is 600. No key is printed or written locally.
- `deploy/nginx-finance.conf`: HTTPS proxy with response buffering disabled for streaming.
- `deploy/finance-cert-renew.*`: certificate renewal service and timer.
- `deploy/tunnel.sh`: optional SSH tunnel fallback at localhost:8788.
- `deploy/refresh-laptop-access.py`: replaces the SSH and HTTPS rules with your current public IPv4 address when changing networks.
- `.deploy/`: ignored local instance metadata, SSH key and pinned host key. Keep this directory on the presentation laptop; never commit or share its private key.

## Start the demo

Open **https://107.22.124.221**. If changing networks (for example, home to campus), first run this from the project folder on your Mac:

```sh
python3 deploy/refresh-laptop-access.py
```

The script uses the existing `lantern` AWS profile to replace the two laptop-specific source-IP rules. It does not open the app to everyone. Other networks cannot access the app unless their access is explicitly configured.

The EC2 service retains the API key and starts on reboot; you do not need to enter the key each day. To initially configure or rotate it, run `python3 deploy/configure-key.py` and enter it at the hidden prompt. Keys must belong to the workspace containing the deployed managed agent and environment.

## Demo checks

1. Click Compare stocks and savings; verify a six-month chart appears.
2. Change the horizon to twelve months and adjust a contribution.
3. Click Explain my current scenario; verify the response uses the changed values.
4. Ask for a savings goal: $3,000 target, $500 saved, $250/month. Expect ten months.
5. Verify the service remains active after closing the SSH administration session.

## Operations

Use the ignored `.deploy/host` and `.deploy/instance-id` files to find the current host and instance. Connect with the project key and pinned host key:

```sh
ssh -i .deploy/ec2-demo -o UserKnownHostsFile=.deploy/known_hosts ubuntu@$(cat .deploy/host)
# On EC2:
sudo systemctl status finance
sudo journalctl -u finance -n 50 --no-pager
sudo systemctl restart finance
```

Restarting the app loses its in-memory session mapping. Start a fresh chat afterward. Do not print `/etc/finance/app.env` while recording or screen sharing.

After the demo, stop the instance with the selected account:

```sh
aws ec2 stop-instances --profile lantern --region us-east-1 --instance-ids "$(cat .deploy/instance-id)"
```

A stop/start can change the public IPv4 address. Refresh `.deploy/host` from EC2 and verify/preserve the instance's host key before reconnecting. Keep the working local app as a fallback if campus networking blocks SSH. The optional tunnel uses `bash deploy/tunnel.sh`. Shared access from arbitrary networks would require application authentication before broadening HTTPS access.

## Verification status

Instance, production dependencies, root-only API-key file, automatic startup, direct HTTPS, and certificate renewal timer are configured. Direct-HTTPS browser checks passed: initial six-month comparison; twelve-month projection with $325/month; explanation matching $9,170.99 HYSA and $9,575.67 upside balances; and a $3,000 savings goal with $500 saved and $250/month showing ten months. Explain became available after both chat and explanation runs. The SSH tunnel was closed and direct HTTPS still returned HTTP 200.

Certificate renewal dry-run passed; Nginx configuration validation passed. The credential directory/file permissions were verified as root-owned 700/600. The frontend fix, which reconciles run status for cards mounted mid-stream, passed all 18 tests, typechecks and the production build. The network-change helper passed its current-IP check; revoke permission was verified via AWS dry-run. A subsequent EC2 stop/start was verified: both services started automatically, the new public IP was configured, and its certificate renewal dry-run passed. A real network-change test has not been performed.

## Recreating the HTTPS layer

After bootstrap and application installation, install Nginx and a current Certbot in a Python virtual environment. Serve `/var/www/acme` under `/.well-known/acme-challenge/` on port 80. Obtain an IP-address certificate with Certbot's `--preferred-profile shortlived --webroot --webroot-path /var/www/acme --ip-address <IP>` options. Configure `deploy/nginx-finance.conf` with that IP and certificate paths. Install the two `finance-cert-renew` units, then enable the timer. Validate with `nginx -t` and `certbot renew --dry-run --no-random-sleep-on-renew` before relying on renewal. This follows [Let's Encrypt's IP-certificate instructions](https://letsencrypt.org/2026/03/11/shorter-certs-certbot).

## Restart recovery

The instance was restarted and changed from `54.83.165.208` to `107.22.124.221`. The SSH host key was verified unchanged before updating the ignored local host files. A new trusted IP certificate was issued, Nginx and allowed origins were updated, and the released IP’s renewal configuration was moved out of the active renewal directory. Use the new URL above; the old IP no longer belongs to this instance.

Post-restart browser smoke test passed at the new HTTPS URL: six-month comparison, change to twelve months and $325/month, then Explain returned $9,170.99 HYSA and $9,575.67 stock upside. The button re-enabled when the response completed. HTTP redirects to the new HTTPS URL, and all three systemd units are active and enabled.

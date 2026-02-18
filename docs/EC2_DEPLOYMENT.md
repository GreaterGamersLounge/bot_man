# EC2 Deployment Guide for Bot_Man

This guide walks through setting up Bot_Man on a minimal AWS EC2 instance with automatic deployments via GitHub Actions.

## Cost Breakdown

| Resource | Monthly Cost |
|----------|-------------|
| t4g.nano (2 vCPU, 0.5GB RAM) | ~$3.07 |
| Public IPv4 address | ~$3.65 |
| 8GB gp3 EBS volume | ~$0.64 |
| **Total** | **~$7.36/mo** |

> **Note:** If you're still in the t4g.small free tier period (until Dec 31, 2026), use t4g.small instead — the instance cost is $0, so total would be ~$4.29/mo.

---

## Prerequisites

- AWS account with access to the same VPC as your RDS instance
- GitHub repository with Actions enabled
- Discord bot token and client ID

---

## Step 1: Launch EC2 Instance

### Via AWS Console

1. Go to **EC2 > Launch Instance**

2. **Name:** `botman-prod`

3. **AMI:** Amazon Linux 2023 (arm64)
   - Search for "Amazon Linux 2023"
   - Select the ARM64 version (for Graviton/t4g)

4. **Instance type:** `t4g.nano`
   - Or `t4g.small` if still in free tier period

5. **Key pair:** Create new or select existing
   - Save the `.pem` file securely — you'll need it for GitHub Actions

6. **Network settings:**
   - **VPC:** Select the same VPC as your RDS instance
   - **Subnet:** Select a public subnet
   - **Auto-assign public IP:** Enable
   - **Security group:** Create new with these rules:

   | Type | Port | Source | Description |
   |------|------|--------|-------------|
   | SSH | 22 | Your IP (or 0.0.0.0/0 if needed) | SSH access |
   | All traffic | All | sg-xxxxx (RDS security group) | Allow RDS access |

7. **Storage:** 8 GB gp3 (default is fine)

8. **Launch instance**

### Via AWS CLI (Alternative)

```bash
# Create security group
aws ec2 create-security-group \
  --group-name botman-sg \
  --description "Bot_Man security group" \
  --vpc-id vpc-xxxxx

# Add SSH rule
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

# Launch instance
aws ec2 run-instances \
  --image-id ami-0c101f26f147fa7fd \
  --instance-type t4g.nano \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --associate-public-ip-address \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":8,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=botman-prod}]'
```

---

## Step 2: Configure RDS Security Group

Your RDS instance needs to accept connections from the EC2 instance.

1. Go to **RDS > Databases > your-database > Connectivity & security**
2. Click on the **VPC security group**
3. **Edit inbound rules** > Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: The EC2 security group (sg-xxxxx) or EC2 private IP

---

## Step 3: Set Up EC2 Instance

### SSH into the instance

```bash
ssh -i your-key.pem ec2-user@<EC2-PUBLIC-IP>
```

### Run setup script

```bash
# Update system and install Node.js + PM2
sudo dnf update -y

# Install Node.js 22
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs git

# Install PM2
sudo npm install -g pm2

# Create directories
mkdir -p ~/logs ~/bot_man
```

### Clone repository

```bash
cd ~
git clone https://github.com/GreaterGamersLounge/bot_man.git
cd bot_man
```

### Create environment file

```bash
nano .env
```

Add your environment variables:

```env
# Discord
BOTMAN_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here

# Database (use your RDS endpoint)
DATABASE_URL=postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/botman

# Environment
NODE_ENV=production
```

### Install and build

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

# Deploy Discord slash commands
npm run deploy-commands
```

### Start with PM2

```bash
# Start processes
pm2 start ecosystem.config.cjs

# Verify they're running
pm2 status

# Save process list
pm2 save

# Enable auto-start on reboot
pm2 startup
# Run the command that PM2 outputs (sudo env PATH=... pm2 startup ...)
```

### Verify bot is working

```bash
# Check logs
pm2 logs bot --lines 50

# Check status
pm2 status
```

---

## Step 4: Set Up GitHub Actions Auto-Deploy

### Add repository secrets

Go to your GitHub repo > **Settings > Secrets and variables > Actions** > **New repository secret**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `EC2_HOST` | Your EC2 public IP address |
| `EC2_SSH_KEY` | Contents of your `.pem` private key file |

### Test deployment

1. Push any change to the `master` branch
2. Go to **Actions** tab in GitHub
3. Watch the deployment run
4. Check EC2: `pm2 logs` should show the restart

---

## Step 5: (Optional) Set Up Elastic IP

To avoid IP changes if you stop/start the instance:

```bash
# Allocate Elastic IP
aws ec2 allocate-address --domain vpc

# Associate with instance
aws ec2 associate-address \
  --instance-id i-xxxxx \
  --allocation-id eipalloc-xxxxx
```

Update the `EC2_HOST` GitHub secret if the IP changes.

---

## Monitoring & Maintenance

### Useful PM2 commands

```bash
pm2 status          # View process status
pm2 logs            # View all logs
pm2 logs bot        # View bot logs only
pm2 monit           # Real-time monitoring
pm2 restart all     # Restart all processes
pm2 reload all      # Zero-downtime restart
```

### Check disk space

```bash
df -h
```

### View system resources

```bash
htop  # Install with: sudo dnf install htop
free -m
```

### Manual deployment (if needed)

```bash
cd ~/bot_man
git pull origin master
npm ci
npx prisma generate
npm run build
npm run deploy-commands
pm2 restart ecosystem.config.cjs
```

---

## Troubleshooting

### Bot not starting

```bash
# Check PM2 logs for errors
pm2 logs bot --err --lines 100

# Check if environment variables are loaded
pm2 env 0
```

### Database connection issues

```bash
# Test connection from EC2
psql "postgresql://user:pass@your-rds-endpoint:5432/dbname"

# If psql not installed
sudo dnf install postgresql15
```

### GitHub Actions failing

1. Check the Actions tab for error logs
2. Verify `EC2_HOST` is correct (IP may change after stop/start)
3. Verify `EC2_SSH_KEY` has the full key including headers
4. Check EC2 security group allows SSH from GitHub's IP ranges

### Out of memory

The t4g.nano has only 512MB RAM. If you see OOM kills:

```bash
# Check memory usage
free -m

# Add swap space (temporary fix)
sudo dd if=/dev/zero of=/swapfile bs=128M count=4
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
```

Or upgrade to `t4g.micro` (1GB RAM, ~$6.13/mo) or `t4g.small` (2GB RAM, ~$12.26/mo).

---

## Security Recommendations

1. **Restrict SSH access** to your IP only (not 0.0.0.0/0)
2. **Use AWS Systems Manager Session Manager** instead of SSH (no open port 22 needed)
3. **Rotate your bot token** if you suspect it's compromised
4. **Keep Node.js updated**: `sudo dnf update nodejs`
5. **Enable CloudWatch** basic monitoring (free)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS VPC                                  │
│                                                                  │
│   ┌─────────────────────┐        ┌─────────────────────┐        │
│   │  EC2 t4g.nano       │        │  RDS PostgreSQL     │        │
│   │  ┌───────────────┐  │        │  (existing)         │        │
│   │  │ PM2           │  │        │                     │        │
│   │  │ ├─ bot        │──┼────────┼──▶ Port 5432       │        │
│   │  │ └─ worker     │  │        │                     │        │
│   │  └───────────────┘  │        └─────────────────────┘        │
│   │                     │                                        │
│   │  Public IP ◀────────┼─── GitHub Actions (SSH deploy)        │
│   └─────────────────────┘                                        │
│                                                                  │
│   Cost: ~$7.36/mo (t4g.nano) or ~$4.29/mo (t4g.small free tier) │
└─────────────────────────────────────────────────────────────────┘

         │
         │ Discord Gateway (WebSocket)
         ▼
┌─────────────────┐
│  Discord API    │
└─────────────────┘
```

---

## Quick Reference

| Task | Command |
|------|---------|
| SSH into server | `ssh -i key.pem ec2-user@<IP>` |
| View bot logs | `pm2 logs bot` |
| Restart bot | `pm2 restart bot` |
| Check status | `pm2 status` |
| Manual deploy | `cd ~/bot_man && git pull && npm ci && npm run build && pm2 restart all` |
| Check memory | `free -m` |
| Check disk | `df -h` |

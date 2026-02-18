#!/bin/bash
# =============================================================================
# EC2 Initial Setup Script for Bot_Man
#
# Run this ONCE on a fresh Amazon Linux 2023 EC2 instance (t4g.nano)
#
# Usage:
#   curl -s https://raw.githubusercontent.com/GreaterGamersLounge/bot_man/master/scripts/ec2-setup.sh | bash
#
# Or copy this script to the server and run:
#   chmod +x ec2-setup.sh && ./ec2-setup.sh
# =============================================================================

set -e  # Exit on error

echo "=========================================="
echo "  Bot_Man EC2 Setup Script"
echo "=========================================="

# Update system
echo "📦 Updating system packages..."
sudo dnf update -y

# Install Node.js 22 (LTS)
echo "📦 Installing Node.js 22..."
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install git (should already be installed, but just in case)
sudo dnf install -y git

# Create directories
echo "📁 Creating directories..."
mkdir -p /home/ec2-user/logs
mkdir -p /home/ec2-user/bot_man

# Clone the repository (or set up for manual clone)
echo ""
echo "=========================================="
echo "  Manual Steps Required"
echo "=========================================="
echo ""
echo "1. Clone the repository:"
echo "   cd /home/ec2-user"
echo "   git clone https://github.com/GreaterGamersLounge/bot_man.git"
echo ""
echo "2. Create environment file:"
echo "   cd bot_man"
echo "   nano .env"
echo ""
echo "   Add these variables:"
echo "   ----------------------------------------"
echo "   BOTMAN_BOT_TOKEN=your_bot_token"
echo "   DISCORD_CLIENT_ID=your_client_id"
echo "   DATABASE_URL=postgresql://user:pass@your-rds-endpoint:5432/dbname"
echo "   NODE_ENV=production"
echo "   ----------------------------------------"
echo ""
echo "3. Install dependencies and build:"
echo "   npm ci"
echo "   npx prisma generate"
echo "   npx prisma migrate deploy"
echo "   npm run build"
echo ""
echo "4. Start PM2:"
echo "   pm2 start ecosystem.config.cjs"
echo "   pm2 save"
echo "   pm2 startup"
echo "   (Run the command PM2 outputs to enable auto-start on boot)"
echo ""
echo "5. Set up GitHub Actions secrets in your repo:"
echo "   - EC2_HOST: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'your-ec2-public-ip')"
echo "   - EC2_SSH_KEY: (paste your private key)"
echo ""
echo "=========================================="
echo "  Setup script complete!"
echo "=========================================="

# Bot_Man TypeScript Procfile
# For deployment platforms like Heroku, Railway, Render

# Main bot process
bot: npm run start:bot

# Background job worker
worker: npm run start:worker

# Database migrations (run on release/deploy)
release: npx prisma migrate deploy

web: bundle exec rails server -p $PORT & sidekiq & bin/rake discord:bot & wait -n
release: bin/rake db:migrate
# bot: bin/rake discord:bot


query = <<~SQL
  select discord_users.name, count(*) from invites
  join discord_users on invites.inviter_uid = discord_users.uid
  where server_uid = '168911139839672320'
  group by discord_users.name
  order by count(*) desc
SQL
result = ActiveRecord::Base.connection.exec_query(query).to_a


query = <<~SQL
  select discord_users.name, count(*) from invite_discord_users idu
  join invites on idu.invite_id = invites.id
  join discord_users on invites.inviter_uid = discord_users.uid
  where invites.server_uid = '168911139839672320'
  group by discord_users.name
  order by count(*) desc
SQL
result = ActiveRecord::Base.connection.exec_query(query).to_a

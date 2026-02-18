-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "discord_users" (
    "uid" BIGINT NOT NULL,
    "name" TEXT,
    "discriminator" TEXT,
    "avatar_url" TEXT,
    "bot_account" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discord_users_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "events" (
    "id" BIGSERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_discord_users" (
    "id" BIGSERIAL NOT NULL,
    "invite_id" BIGINT,
    "discord_user_uid" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invite_discord_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invites" (
    "id" BIGSERIAL NOT NULL,
    "server_uid" BIGINT NOT NULL,
    "inviter_uid" BIGINT NOT NULL,
    "deleter_uid" BIGINT,
    "code" TEXT NOT NULL,
    "channel_uid" TEXT NOT NULL,
    "uses" INTEGER NOT NULL,
    "max_uses" INTEGER,
    "active" BOOLEAN NOT NULL,
    "temporary" BOOLEAN NOT NULL,
    "expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" BIGSERIAL NOT NULL,
    "server_uid" BIGINT,
    "quoter_uid" BIGINT,
    "quotee_uid" BIGINT,
    "quote" TEXT,
    "message_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reaction_roles" (
    "id" BIGSERIAL NOT NULL,
    "message_id" BIGINT NOT NULL,
    "reaction" TEXT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reaction_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servers" (
    "id" BIGSERIAL NOT NULL,
    "uid" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "icon_id" TEXT NOT NULL,
    "owner_uid" BIGINT NOT NULL,
    "region_id" TEXT NOT NULL,
    "afk_channel_uid" BIGINT,
    "system_channel_uid" BIGINT,
    "large" BOOLEAN NOT NULL,
    "afk_timeout" BIGINT,
    "verification_level" TEXT NOT NULL,
    "member_count" BIGINT NOT NULL,
    "creation_time" TIMESTAMP(3) NOT NULL,
    "bot_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_voice_channels" (
    "id" BIGSERIAL NOT NULL,
    "server_uid" BIGINT NOT NULL,
    "creator_uid" BIGINT NOT NULL,
    "channel_uid" BIGINT NOT NULL,
    "is_jump_channel" BOOLEAN NOT NULL,
    "active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temporary_voice_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "encrypted_password" TEXT NOT NULL DEFAULT '',
    "reset_password_token" TEXT,
    "reset_password_sent_at" TIMESTAMP(3),
    "remember_created_at" TIMESTAMP(3),
    "sign_in_count" INTEGER NOT NULL DEFAULT 0,
    "current_sign_in_at" TIMESTAMP(3),
    "last_sign_in_at" TIMESTAMP(3),
    "current_sign_in_ip" INET,
    "last_sign_in_ip" INET,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "unlock_token" TEXT,
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "discord_uid" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_reset_password_token_key" ON "users"("reset_password_token");

-- AddForeignKey
ALTER TABLE "invite_discord_users" ADD CONSTRAINT "invite_discord_users_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_discord_users" ADD CONSTRAINT "invite_discord_users_discord_user_uid_fkey" FOREIGN KEY ("discord_user_uid") REFERENCES "discord_users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

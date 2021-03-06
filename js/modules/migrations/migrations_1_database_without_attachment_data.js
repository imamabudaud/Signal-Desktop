const { last } = require('lodash');

const db = require('../database');
const settings = require('../settings');
const { runMigrations } = require('./run_migrations');

// IMPORTANT: Add new migrations that need to traverse entire database, e.g.
// messages store, below. Whenever we need this, we need to force attachment
// migration on startup:
const migrations = [
  // {
  //   version: 0,
  //   migrate(transaction, next) {
  //     next();
  //   },
  // },
];

exports.run = async ({ Backbone, database } = {}) => {
  const { canRun } = await exports.getStatus({ database });
  if (!canRun) {
    throw new Error(
      'Cannot run migrations on database without attachment data'
    );
  }

  await runMigrations({ Backbone, database });
};

exports.getStatus = async ({ database } = {}) => {
  const connection = await db.open(database.id, database.version);
  const isAttachmentMigrationComplete = await settings.isAttachmentMigrationComplete(
    connection
  );
  const hasMigrations = migrations.length > 0;

  const canRun = isAttachmentMigrationComplete && hasMigrations;
  return {
    isAttachmentMigrationComplete,
    hasMigrations,
    canRun,
  };
};

exports.getLatestVersion = () => {
  const lastMigration = last(migrations);
  if (!lastMigration) {
    return null;
  }

  return lastMigration.version;
};

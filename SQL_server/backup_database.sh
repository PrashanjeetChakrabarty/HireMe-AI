#!/bin/bash

# This script takes a backup of the SQL Server database and saves it in the backups folder next to this script.
# Every run creates a new file with a timestamp, so older backups are never deleted.

DB_NAME="ResumeScreeningDB"
# The password is NOT stored in this file. Set it first in the terminal:
#   export SA_PASSWORD='your-local-sa-password'
SA_PASSWORD="${SA_PASSWORD:?Set SA_PASSWORD first (see the comment above)}"
SQLCMD="/opt/homebrew/opt/mssql-tools18/bin/sqlcmd"
BACKUP_DIR="$(cd "$(dirname "$0")" && pwd)/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE_NAME="${DB_NAME}_${TIMESTAMP}.bak"

echo "Starting backup: $BACKUP_FILE_NAME"

# Step 1: send the backup command from the Mac straight to SQL Server
# (The backup file is created inside the container, in /var/opt/mssql/data/)
"$SQLCMD" -S localhost,1433 -U sa -P "$SA_PASSWORD" -C -Q \
  "BACKUP DATABASE $DB_NAME TO DISK = N'/var/opt/mssql/data/${BACKUP_FILE_NAME}' WITH FORMAT;"

# Step 2: copy the file from the container to the Mac
docker cp sqlserver:/var/opt/mssql/data/${BACKUP_FILE_NAME} "$BACKUP_DIR/${BACKUP_FILE_NAME}"

echo "Backup saved to: $BACKUP_DIR/${BACKUP_FILE_NAME}"
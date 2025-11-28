#!/bin/bash

##############################################################################
# Firestore Backup Script
# Automates database backups with retention policy
##############################################################################

set -e

# Configuration
PROJECT_ID="${FIREBASE_PROJECT_ID:-coinbox-connect}"
BACKUP_BUCKET="${BACKUP_BUCKET:-gs://coinbox-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="firestore-backup-${TIMESTAMP}"
RETENTION_DAYS=30

# Colors for output
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== CoinBox Firestore Backup ===${NC}"
echo "Project: $PROJECT_ID"
echo "Bucket: $BACKUP_BUCKET"
echo "Backup name: $BACKUP_NAME"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI not found. Please install Google Cloud SDK.${NC}"
    exit 1
fi

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}Error: Not authenticated with gcloud. Run 'gcloud auth login'${NC}"
    exit 1
fi

# Set the project
echo -e "${YELLOW}Setting project to $PROJECT_ID...${NC}"
gcloud config set project "$PROJECT_ID"

# Create backup
echo -e "${YELLOW}Creating Firestore backup...${NC}"
gcloud firestore export "$BACKUP_BUCKET/$BACKUP_NAME" \
    --async \
    --project="$PROJECT_ID" \
    2>&1 | tee backup.log

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup initiated successfully${NC}"
    echo "Backup location: $BACKUP_BUCKET/$BACKUP_NAME"
    
    # Log backup to file
    echo "$TIMESTAMP | $BACKUP_NAME | SUCCESS" >> backup-history.log
else
    echo -e "${RED}✗ Backup failed${NC}"
    echo "$TIMESTAMP | $BACKUP_NAME | FAILED" >> backup-history.log
    exit 1
fi

# Clean up old backups (retention policy)
echo -e "${YELLOW}Cleaning up old backups (retention: $RETENTION_DAYS days)...${NC}"
CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)

gsutil ls "$BACKUP_BUCKET/" | grep "firestore-backup-" | while read backup; do
    # Extract date from backup name (format: firestore-backup-YYYYMMDD_HHMMSS)
    BACKUP_DATE=$(echo "$backup" | sed -n 's/.*firestore-backup-\([0-9]\{8\}\).*/\1/p')
    
    if [ ! -z "$BACKUP_DATE" ] && [ "$BACKUP_DATE" -lt "$CUTOFF_DATE" ]; then
        echo "Deleting old backup: $backup"
        gsutil -m rm -r "$backup" || echo "Warning: Failed to delete $backup"
    fi
done

echo -e "${GREEN}✓ Backup process completed${NC}"
echo ""
echo "To restore this backup, run:"
echo "  gcloud firestore import $BACKUP_BUCKET/$BACKUP_NAME"

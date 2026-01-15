
#!/bin/bash
GITLAB_URL="https://lab.tnsicn.org"
PROJECT_PATH="Tristen/tns-mail-portal-pro"
PERSONAL_ACCESS_TOKEN="<YOUR_TOKEN>"
BRANCH="premium-dashboard"

REMOTE_URL="https://${PERSONAL_ACCESS_TOKEN}@${GITLAB_URL#https://}/${PROJECT_PATH}.git"

cd "$(dirname "$0")/tns-mail-portal-pro-premium" || { echo "Project folder not found"; exit 1; }

git init
 git config user.email "devnull@tns.local"
 git config user.name  "TNS Portal Auto"

git add .
 git commit -m "feat: premium dashboard (React Router, Query, domain tabs)"

git branch -M "$BRANCH"
 git remote add origin "$REMOTE_URL" 2>/dev/null || git remote set-url origin "$REMOTE_URL"

git push -u origin "$BRANCH"

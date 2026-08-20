#!/bin/bash
# FairwayConnect Deploy Script (FWC-SOP-002 compliant)
# Usage: ./deploy.sh [test|live]

set -e

ENV=${1:-test}

if [[ "$ENV" != "test" && "$ENV" != "live" ]]; then
  echo "❌ Usage: ./deploy.sh [test|live]"
  exit 1
fi

# Derive version info from Git
APP_VERSION=$(git describe --tags --always)
GIT_COMMIT=$(git rev-parse --short HEAD)
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# LIVE DEPLOYMENT GUARDRAIL: Require exact tag (no -N-g suffix)
if [[ "$ENV" == "live" ]]; then
  # Check if current commit is exactly on a tag
  if ! git describe --exact-match HEAD &>/dev/null; then
    echo "❌ LIVE DEPLOY BLOCKED: Current commit is not tagged"
    echo "   Commit: $GIT_COMMIT"
    echo "   Version: $APP_VERSION"
    echo ""
    echo "FWC-SOP-002: All LIVE deploys must be from tagged releases."
    echo ""
    echo "To fix:"
    echo "  1. git tag -a v1.0.X -m 'Release notes'"
    echo "  2. git push --tags"
    echo "  3. ./deploy.sh live"
    exit 1
  fi
  echo "✅ Tag verification passed: $APP_VERSION"
fi

# Map environment to Fly app name
if [[ "$ENV" == "live" ]]; then
  FLY_APP="fairwayconnect-live"
  NEXT_PUBLIC_ENV="live"
else
  FLY_APP="fairwayconnect-test"
  NEXT_PUBLIC_ENV="test"
fi

echo "📦 Building FairwayConnect for $ENV"
echo "   Version: $APP_VERSION"
echo "   Commit:  $GIT_COMMIT"
echo "   Built:   $BUILD_TIME"
echo "   App:     $FLY_APP"
echo ""

# Deploy with build args
fly deploy \
  --app "$FLY_APP" \
  --build-arg APP_VERSION="$APP_VERSION" \
  --build-arg GIT_COMMIT="$GIT_COMMIT" \
  --build-arg BUILD_TIME="$BUILD_TIME" \
  --build-arg NEXT_PUBLIC_ENV="$NEXT_PUBLIC_ENV"

echo ""
echo "✅ Deployed to $ENV"
echo ""
echo "🔍 Verifying /version endpoint..."
sleep 3

# Verify deployment
DEPLOYED_VERSION=$(curl -s "https://$FLY_APP.fly.dev/api/version")
echo "$DEPLOYED_VERSION" | jq .

# Extract values for comparison
DEPLOYED_COMMIT=$(echo "$DEPLOYED_VERSION" | jq -r '.commit')
DEPLOYED_ENV=$(echo "$DEPLOYED_VERSION" | jq -r '.env')

# Verify
if [[ "$DEPLOYED_COMMIT" == "$GIT_COMMIT" ]] && [[ "$DEPLOYED_ENV" == "$NEXT_PUBLIC_ENV" ]]; then
  echo ""
  echo "✅ VERIFICATION PASSED"
  echo "   Deployed commit matches Git HEAD"
  echo "   Environment matches target"
else
  echo ""
  echo "❌ VERIFICATION FAILED"
  echo "   Expected commit: $GIT_COMMIT, got: $DEPLOYED_COMMIT"
  echo "   Expected env: $NEXT_PUBLIC_ENV, got: $DEPLOYED_ENV"
  exit 1
fi

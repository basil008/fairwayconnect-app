#!/bin/bash
# Deploy FairwayConnect to Fly.io
# Run this script to upload the Self-Service Plan to production

echo "🚀 Deploying FairwayConnect to Fly.io..."
echo ""
echo "This will deploy:"
echo "  - Self-Service Implementation Plan (FINAL)"
echo "  - Updated downloads page"
echo ""

cd ~/.openclaw/workspace/fairwayconnect-macmini-fresh

# Deploy
fly deploy --app fairwayconnect-live

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📥 Self-Service Plan will be available at:"
echo "https://fairwayconnect-live.fly.dev/downloads/FAIRWAYCONNECT-SELF-SERVICE-PLAN-FINAL-7May2026.md"
echo ""
echo "📄 Downloads page:"
echo "https://fairwayconnect-live.fly.dev/downloads"

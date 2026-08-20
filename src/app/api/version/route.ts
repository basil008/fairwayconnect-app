import { NextResponse } from 'next/server';

export async function GET() {
  // Version info injected at build time via Dockerfile ARGs
  const version = process.env.APP_VERSION || 'dev';
  const commit = process.env.GIT_COMMIT || 'unknown';
  const built = process.env.BUILD_TIME || new Date().toISOString();
  const env = process.env.NEXT_PUBLIC_ENV || 'unknown';

  return NextResponse.json({
    version,
    commit,
    built,
    env,
  });
}

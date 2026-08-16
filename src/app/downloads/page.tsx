export default function DownloadsPage() {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ color: '#1a1a1a', fontSize: '32px', marginBottom: '10px' }}>📥 Downloads</h1>
        <p style={{ color: '#666', fontSize: '16px', marginBottom: '40px' }}>
          Ltec Connect & FairwayConnect System Backups + Strategic Plans
        </p>

        {/* FairwayConnect Plans Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            color: '#333', 
            fontSize: '24px', 
            marginBottom: '20px',
            borderBottom: '2px solid #10b981',
            paddingBottom: '10px'
          }}>
            🏌️ FairwayConnect - Strategic Plans
          </h2>

          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{
              padding: '20px',
              background: '#f0fdf4',
              borderRadius: '10px',
              borderLeft: '4px solid #10b981'
            }}>
              <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: '5px', fontSize: '16px' }}>
                📋 Self-Service Implementation Plan (FINAL)
              </div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                Complete technical specification for multi-tenant SaaS transformation
              </div>
              <div style={{ color: '#999', fontSize: '12px', marginBottom: '15px' }}>
                36 KB | 12-week roadmap | 5 phases | 462 hours | Updated: 7 May 2026
              </div>
              <a 
                href="/downloads/FAIRWAYCONNECT-SELF-SERVICE-PLAN-FINAL-7May2026.md" 
                download
                style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-block'
                }}
              >
                📥 Download Plan
              </a>
            </div>
          </div>
        </div>

        {/* Ltec Connect Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            color: '#333', 
            fontSize: '24px', 
            marginBottom: '20px',
            borderBottom: '2px solid #667eea',
            paddingBottom: '10px'
          }}>
            ⚡ Ltec Connect - Integrated CRM/ERP System
          </h2>

          <div style={{ display: 'grid', gap: '15px' }}>
            {/* Source Code Split Files */}
            <div style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '10px',
              border: '2px solid transparent'
            }}>
              <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: '5px', fontSize: '16px' }}>
                💾 Ltec Connect Complete Source Code (Split Files)
              </div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                Full Next.js application - split into 5 parts for easy download (632 MB uncompressed)
              </div>
              <div style={{ color: '#999', fontSize: '12px', marginBottom: '15px' }}>
                215 MB total (5 files: 50MB+50MB+50MB+50MB+15MB)
              </div>
              <a 
                href="/downloads/REASSEMBLE-INSTRUCTIONS.txt" 
                download
                style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-block'
                }}
              >
                📄 Download Instructions
              </a>
            </div>

            {/* Download All Parts */}
            <div style={{
              padding: '20px',
              background: '#e3f2fd',
              borderRadius: '10px',
              borderLeft: '4px solid #2196f3'
            }}>
              <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: '15px', fontSize: '16px' }}>
                📦 Download All 5 Parts:
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <a href="/downloads/LtecConnect-Source-Part-aa" download style={{
                  background: '#2196f3', color: 'white', padding: '8px 16px', 
                  borderRadius: '5px', textDecoration: 'none', fontSize: '14px'
                }}>Part 1 (50MB)</a>
                <a href="/downloads/LtecConnect-Source-Part-ab" download style={{
                  background: '#2196f3', color: 'white', padding: '8px 16px', 
                  borderRadius: '5px', textDecoration: 'none', fontSize: '14px'
                }}>Part 2 (50MB)</a>
                <a href="/downloads/LtecConnect-Source-Part-ac" download style={{
                  background: '#2196f3', color: 'white', padding: '8px 16px', 
                  borderRadius: '5px', textDecoration: 'none', fontSize: '14px'
                }}>Part 3 (50MB)</a>
                <a href="/downloads/LtecConnect-Source-Part-ad" download style={{
                  background: '#2196f3', color: 'white', padding: '8px 16px', 
                  borderRadius: '5px', textDecoration: 'none', fontSize: '14px'
                }}>Part 4 (50MB)</a>
                <a href="/downloads/LtecConnect-Source-Part-ae" download style={{
                  background: '#2196f3', color: 'white', padding: '8px 16px', 
                  borderRadius: '5px', textDecoration: 'none', fontSize: '14px'
                }}>Part 5 (15MB)</a>
              </div>
              <div style={{ color: '#666', fontSize: '12px', marginTop: '10px' }}>
                ⚠️ Download all 5 parts, then reassemble using instructions above
              </div>
            </div>

            {/* Database Backup */}
            <div style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '10px'
            }}>
              <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: '5px', fontSize: '16px' }}>
                📦 Ltec Connect Backup (Database + Manifest)
              </div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                Production database + backup documentation
              </div>
              <div style={{ color: '#999', fontSize: '12px', marginBottom: '10px' }}>51 KB (compressed)</div>
              <a 
                href="/downloads/LtecConnect-Backup-24April2026.tar.gz" 
                download
                style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-block'
                }}
              >
                Download
              </a>
            </div>

            {/* Manifest */}
            <div style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '10px'
            }}>
              <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: '5px', fontSize: '16px' }}>
                📄 Ltec Connect Backup Manifest
              </div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                Detailed documentation, restore instructions, system architecture
              </div>
              <div style={{ color: '#999', fontSize: '12px', marginBottom: '10px' }}>11 KB (Markdown)</div>
              <a 
                href="/downloads/LtecConnect-Backup-Manifest-24April2026.md" 
                download
                style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-block'
                }}
              >
                Download
              </a>
            </div>
          </div>
        </div>

        {/* ResourceConnect Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            color: '#333', 
            fontSize: '24px', 
            marginBottom: '20px',
            borderBottom: '2px solid #667eea',
            paddingBottom: '10px'
          }}>
            🎯 ResourceConnect - Requirements & Planning
          </h2>

          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>📋 Requirements Review (28 April 2026)</div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                Complete requirements analysis based on Excel tracker and product proposal
              </div>
              <div style={{ color: '#999', fontSize: '12px', marginBottom: '10px' }}>20 KB</div>
              <a href="/files/RESOURCECONNECT-REQUIREMENTS-REVIEW-28April2026.docx" download style={{
                background: '#667eea', color: 'white', padding: '10px 20px',
                borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-block'
              }}>Download</a>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>🚀 Proto-MVP Plan - MOBILE-FIRST (28 April 2026)</div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                4-6 week development plan with mobile-first UI from Day 1 (APPROVED)
              </div>
              <div style={{ color: '#999', fontSize: '12px', marginBottom: '10px' }}>22 KB</div>
              <a href="/files/RESOURCECONNECT-PROTO-MVP-MOBILE-FIRST-28April2026.docx" download style={{
                background: '#667eea', color: 'white', padding: '10px 20px',
                borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-block'
              }}>Download</a>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>🚀 Proto-MVP Plan - Original (28 April 2026)</div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                4-6 week development plan (desktop-first version for reference)
              </div>
              <div style={{ color: '#999', fontSize: '12px', marginBottom: '10px' }}>21 KB</div>
              <a href="/files/RESOURCECONNECT-PROTO-MVP-PLAN-28April2026.docx" download style={{
                background: '#999', color: 'white', padding: '10px 20px',
                borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-block'
              }}>Download</a>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>📄 Product Proposal (27 April 2026)</div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                Generic ResourceConnect product proposal for investors
              </div>
              <div style={{ color: '#999', fontSize: '12px', marginBottom: '10px' }}>28 KB</div>
              <a href="/downloads/ResourceConnect-Product-Proposal-FINAL-27April2026.docx" download style={{
                background: '#667eea', color: 'white', padding: '10px 20px',
                borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-block'
              }}>Download</a>
            </div>
          </div>
        </div>

        {/* LtecConnect Mobile CRM Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            color: '#333', 
            fontSize: '24px', 
            marginBottom: '20px',
            borderBottom: '2px solid #667eea',
            paddingBottom: '10px'
          }}>
            📱 LtecConnect Mobile CRM - Friday Demo Ready
          </h2>

          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ padding: '20px', background: '#e3f2fd', borderRadius: '10px', borderLeft: '4px solid #2196f3' }}>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>⭐ MOBILE-CRM-READY-SUMMARY-29April2026.docx</div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Executive summary - Test results, demo flow, Friday checklist (RECOMMENDED)</div>
              <div style={{ color: '#999', fontSize: '12px', marginTop: '5px' }}>15 KB (Word document)</div>
              <a href="/downloads/MOBILE-CRM-READY-SUMMARY-29April2026.docx" download style={{
                background: '#2196f3',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-block',
                marginTop: '10px'
              }}>Download</a>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>📄 FRIDAY-DEMO-QUICK-REF.docx</div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>1-page quick reference card - Print and keep in pocket!</div>
              <div style={{ color: '#999', fontSize: '12px', marginTop: '5px' }}>12 KB (Word document)</div>
              <a href="/downloads/FRIDAY-DEMO-QUICK-REF.docx" download style={{
                background: '#667eea',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-block',
                marginTop: '10px'
              }}>Download</a>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>📊 LT-CONNECT-DEMO-001-Sales-Review-Talking-Points.docx</div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Detailed demo script with Q&A preparation</div>
              <div style={{ color: '#999', fontSize: '12px', marginTop: '5px' }}>16 KB (Word document)</div>
              <a href="/downloads/LT-CONNECT-DEMO-001-Sales-Review-Talking-Points.docx" download style={{
                background: '#667eea',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-block',
                marginTop: '10px'
              }}>Download</a>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>🔧 MOBILE-CRM-DAY4-DEPLOYED-29April2026.docx</div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Complete technical deployment report (31 files)</div>
              <div style={{ color: '#999', fontSize: '12px', marginTop: '5px' }}>17 KB (Word document)</div>
              <a href="/downloads/MOBILE-CRM-DAY4-DEPLOYED-29April2026.docx" download style={{
                background: '#667eea',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-block',
                marginTop: '10px'
              }}>Download</a>
            </div>

            <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '10px', borderLeft: '4px solid #4caf50' }}>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>✅ TEST-REPORT-DAY5-29April2026.docx</div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Day 5 test results - 15/15 tests passed (100%) - READY FOR PRODUCTION</div>
              <div style={{ color: '#999', fontSize: '12px', marginTop: '5px' }}>16 KB (Word document)</div>
              <a href="/downloads/TEST-REPORT-DAY5-29April2026.docx" download style={{
                background: '#4caf50',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-block',
                marginTop: '10px'
              }}>Download</a>
            </div>
          </div>
        </div>

        {/* FairwayConnect Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            color: '#333', 
            fontSize: '24px', 
            marginBottom: '20px',
            borderBottom: '2px solid #667eea',
            paddingBottom: '10px'
          }}>
            ⛳ FairwayConnect - Golf Society Platform
          </h2>

          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>📊 FairwayConnect Business Plan</div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                Go-to-market strategy, revenue model, market analysis
              </div>
              <div style={{ color: '#999', fontSize: '12px', marginBottom: '10px' }}>28 KB</div>
              <a href="/downloads/FairwayConnect-Business-Plan.docx" download style={{
                background: '#667eea', color: 'white', padding: '10px 20px',
                borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-block'
              }}>Download</a>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>🔧 Configurator Specification</div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                Technical specification for self-service society setup
              </div>
              <div style={{ color: '#999', fontSize: '12px', marginBottom: '10px' }}>49 KB</div>
              <a href="/downloads/FairwayConnect-Configurator-Specification.docx" download style={{
                background: '#667eea', color: 'white', padding: '10px 20px',
                borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-block'
              }}>Download</a>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>📖 Admin User Manual</div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                Complete guide for society organizers (56 pages)
              </div>
              <div style={{ color: '#999', fontSize: '12px', marginBottom: '10px' }}>32 KB</div>
              <a href="/downloads/FairwayConnect-Admin-Manual.docx" download style={{
                background: '#667eea', color: 'white', padding: '10px 20px',
                borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-block'
              }}>Download</a>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>📋 Quick Reference Card</div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                One-page cheat sheet for event day operations
              </div>
              <div style={{ color: '#999', fontSize: '12px', marginBottom: '10px' }}>13 KB</div>
              <a href="/downloads/FairwayConnect-Quick-Reference.docx" download style={{
                background: '#667eea', color: 'white', padding: '10px 20px',
                borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-block'
              }}>Download</a>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: '#fff3cd',
          borderLeft: '4px solid #ffc107',
          padding: '15px',
          borderRadius: '5px'
        }}>
          <strong style={{ color: '#856404' }}>ℹ️ How to Download Source Code:</strong>
          <ol style={{ marginTop: '10px', paddingLeft: '20px', color: '#856404' }}>
            <li>Download the <strong>REASSEMBLE-INSTRUCTIONS.txt</strong> file first</li>
            <li>Download all 5 parts (Part 1-5)</li>
            <li>Follow the instructions to reassemble on Windows or Mac</li>
            <li>Extract and deploy!</li>
          </ol>
          <div style={{ marginTop: '10px', color: '#856404' }}>
            <strong>For Windows Users:</strong> Use the <code>copy /b</code> command shown in the instructions
          </div>
        </div>
      </div>
    </div>
  );
}

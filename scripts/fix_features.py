import sys

file_path = "b:\\Проекты\\НоваяГлава\\CHATPLUS\\portal\\src\\components\\StructuredLandingPage.astro"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start = content.find("  /* ── FEATURES")
end = content.find("  /* ── INTEGRATIONS ── */")

new_css = """  /* ── FEATURES (BENTO GRID) ── */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
  .feature-card {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 2.2rem 2rem;
    background: rgba(255, 255, 255, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 28px;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.05);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
  }
  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 48px rgba(99, 102, 241, 0.12);
    background: rgba(255, 255, 255, 0.9);
  }
  /* Bento sizing overrides */
  .feature-card:nth-child(1) { 
    grid-column: span 2; 
    grid-row: span 2; 
    background: linear-gradient(160deg, #f8fafc, #eff6ff); 
  }
  .feature-card:nth-child(1) .feature-title { font-size: 1.75rem; }
  .feature-card:nth-child(1) .feature-icon-wrap { width: 56px; height: 56px; }
  .feature-card:nth-child(1) .feature-icon { width: 26px; height: 26px; }
  
  .feature-card:nth-child(4n) { grid-column: span 2; }
  .feature-card:nth-child(7n) { grid-column: span 3; }
  
  @media (max-width: 992px) {
    .features-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .feature-card:nth-child(1), .feature-card:nth-child(4n), .feature-card:nth-child(7n) { grid-column: span 2; }
  }
  @media (max-width: 600px) {
    .features-grid { grid-template-columns: 1fr; }
    .feature-card:nth-child(n) { grid-column: span 1; grid-row: auto; }
    .feature-card:nth-child(1) .feature-title { font-size: 1.25rem; }
  }

  .feature-icon-wrap {
    flex-shrink: 0;
    width: 44px; height: 44px;
    border-radius: 14px;
    background: linear-gradient(135deg, #eef2ff, #ddd6fe);
    color: #4f46e5;
    display: flex; align-items: center; justify-content: center;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.85);
  }
  .feature-icon { width: 20px; height: 20px; }
  .feature-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-bottom: 0.4rem; letter-spacing: -0.01em; }
  .feature-card .card-text-sm {
    font-size: 0.95rem;
    line-height: 1.6;
    color: #475569;
  }

"""

if start != -1 and end != -1:
    new_content = content[:start] + new_css + content[end:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("SUCCESS: Features block replaced.")
else:
    print("ERROR: Could not find Features block.")

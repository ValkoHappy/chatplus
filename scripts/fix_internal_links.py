import sys

file_path = "b:\\Проекты\\НоваяГлава\\CHATPLUS\\portal\\src\\components\\StructuredLandingPage.astro"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start = content.find("  /* ── INTERNAL LINKS ── */")
end = content.find("  /* ── FINAL CTA ── */")

# Sometimes the CSS might have different structure.
css_end = content.find(".cta-section", start)
if css_end != -1:
    # Need to find just the block before the next major CSS section if "FINAL CTA" isn't a comment.
    # From lines 1030 to 1090.
    end = content.find("  /* ── FINAL CTA", start)

new_css = """  /* ── INTERNAL LINKS (PREMIUM GRID) ── */
  .links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.25rem;
  }
  .link-card {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.2rem;
    min-height: 96px;
    padding: 1.25rem 1.5rem;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 22px;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }
  .link-card::before {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    width: 120%; height: 120%;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.05), transparent 70%);
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
    transition: transform 0.4s ease, opacity 0.4s ease;
    pointer-events: none;
    z-index: 0;
  }
  .link-card:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 1);
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 0 20px 40px rgba(99, 102, 241, 0.1);
  }
  .link-card:hover::before {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  .link-icon-wrap {
    position: relative;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(238, 242, 255, 0.6), rgba(221, 214, 254, 0.6));
    color: #4f46e5;
    flex-shrink: 0;
    z-index: 1;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .link-card:hover .link-icon-wrap {
    background: linear-gradient(135deg, #eef2ff, #ddd6fe);
    transform: scale(1.1) rotate(-5deg);
    box-shadow: 0 8px 16px rgba(99, 102, 241, 0.15);
  }
  .link-icon {
    width: 24px;
    height: 24px;
    transition: transform 0.3s ease;
  }
  .link-card-inner {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
    z-index: 1;
  }
  .link-label { font-size: 1.05rem; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; }
  .link-desc  {
    font-size: 0.85rem;
    color: #475569;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.55;
  }
  .link-arrow {
    flex-shrink: 0;
    color: #cbd5e1;
    z-index: 1;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.3s ease;
  }
  .link-card:hover .link-arrow {
    transform: translateX(4px);
    color: #4f46e5;
  }

"""

if start != -1 and end != -1:
    content = content[:start] + new_css + content[end:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS: Internal Links block replaced.")
else:
    print(f"ERROR: Could not find block. Start={start}, End={end}")

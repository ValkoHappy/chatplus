import sys

file_path = "b:\\Проекты\\НоваяГлава\\CHATPLUS\\portal\\src\\components\\StructuredLandingPage.astro"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start = content.find("  /* ── PROBLEMS")
end = content.find("  /* ── SOLUTION STEPS ── */")

new_css = """  /* ── PROBLEMS (DARK MODE) ── */
  .problems-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    gap: 1.25rem;
  }
  .problem-card {
    display: flex;
    gap: 1.15rem;
    align-items: flex-start;
    padding: 1.5rem;
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(51, 65, 85, 0.6);
    border-radius: 20px;
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 10px 30px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  }
  .problem-card:hover {
    background: rgba(30, 41, 59, 0.7);
    border-color: rgba(99, 102, 241, 0.5);
    transform: translateY(-4px);
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(99, 102, 241, 0.2);
  }
  .problem-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
    border: 1px solid rgba(129, 140, 248, 0.3);
    font-size: 0.9rem;
    font-weight: 800;
    color: #e0e7ff;
    letter-spacing: 0.05em;
    flex-shrink: 0;
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
    transition: all 0.3s ease;
  }
  .problem-card:hover .problem-num {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(168, 85, 247, 0.4));
    box-shadow: 0 0 25px rgba(99, 102, 241, 0.5);
    border-color: rgba(129, 140, 248, 0.6);
  }
  .text-white { color: #f8fafc; }
  .text-soft { color: #94a3b8; font-size: 0.95rem; line-height: 1.7; }
  
  .problem-summary {
    margin-top: 2.5rem;
    font-size: 1.05rem;
    font-weight: 600;
    color: #e2e8f0;
    padding: 1.5rem 2rem;
    background: linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(30, 41, 59, 0.4) 100%);
    border-left: 4px solid #818cf8;
    border-radius: 0 16px 16px 0;
    backdrop-filter: blur(8px);
  }
"""

if start != -1 and end != -1:
    new_content = content[:start] + new_css + content[end:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("SUCCESS: Target block correctly replaced.")
else:
    print("ERROR: Could not find block boundaries.")

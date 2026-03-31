import sys

file_path = "b:\\Проекты\\НоваяГлава\\CHATPLUS\\portal\\src\\components\\StructuredLandingPage.astro"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start = content.find("  /* ── HERO ── */")
end = content.find("  /* ── PROBLEMS (DARK MODE)")

if start == -1: start = content.find("  /* ── HERO")
if end == -1: end = content.find("  /* ── PROBLEMS")

new_css = """  /* ── HERO (PREMIUM GLOW) ── */
  .hero-section {
    position: relative;
    overflow: hidden;
    padding: clamp(3rem, 6vw, 5rem) 0 clamp(2.5rem, 5vw, 4rem);
    background: #ffffff;
  }
  .hero-bg-dots {
    position: absolute; inset: 0;
    background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
    background-size: 32px 32px;
    opacity: 0.4;
    pointer-events: none;
    z-index: 0;
  }
  .hero-bg-dots::before {
    content: '';
    position: absolute;
    top: -15%; left: -10%;
    width: 60%; height: 70%;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
    filter: blur(60px);
    animation: float 8s infinite alternate ease-in-out;
  }
  .hero-bg-dots::after {
    content: '';
    position: absolute;
    bottom: -15%; right: -5%;
    width: 70%; height: 80%;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%);
    filter: blur(80px);
    animation: float 12s infinite alternate-reverse ease-in-out;
  }
  .hero-grid {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: center;
    z-index: 1;
  }
  .hero-inner {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
  .hero-visual {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 0.5rem;
    position: relative;
  }
  .hero-visual::before {
    content: '';
    position: absolute;
    inset: 8% 0 auto 12%;
    height: 72%;
    border-radius: 32px;
    background: radial-gradient(circle, rgba(99, 102, 241, .25), transparent 68%);
    filter: blur(30px);
    pointer-events: none;
  }
  .hero-h1 {
    font-size: clamp(2.2rem, 4vw, 3.5rem);
    font-weight: 800;
    color: #0f172a;
    line-height: 1.12;
    letter-spacing: -0.03em;
  }
  .hero-subtitle {
    font-size: clamp(1rem, 1.5vw, 1.15rem);
    color: #475569;
    line-height: 1.8;
    max-width: 90%;
  }
  .hero-ctas {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }
  .hero-trust {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    list-style: none;
    padding: 0; margin: 1rem 0 0 0;
  }
  .trust-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.9rem;
    color: #334155;
    font-weight: 500;
  }
  .trust-check {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: white;
    flex-shrink: 0;
    box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
  }

"""

if start != -1 and end != -1:
    content = content[:start] + new_css + content[end:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS: Hero block replaced.")
else:
    print("ERROR: Could not find Hero block. Start:", start, "End:", end)

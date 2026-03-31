import sys

file_path = "b:\\Проекты\\НоваяГлава\\CHATPLUS\\portal\\src\\components\\StructuredLandingPage.astro"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace HTML
old_html = """  <!-- SOLUTION STEPS -->
  {page.solution_title && (
    <section class="section section-tinted" id="solution">
      <div class="container">
        <div class="section-header reveal">
          <h2 class="section-title">{page.solution_title}</h2>
          {page.solution_intro && <p class="section-intro">{page.solution_intro}</p>}
        </div>
        {page.solution_steps && page.solution_steps.length > 0 && (
          <div class="steps-list">
            {page.solution_steps.map((item, i) => (
              <article class="step-item reveal">
                <div class="step-num-wrap">
                  <div class="step-num">{i + 1}</div>
                  {i < (page.solution_steps?.length ?? 0) - 1 && <div class="step-line"></div>}
                </div>
                <div class="step-body">
                  <h3 class="step-title">{item.title}</h3>
                  <p class="card-text">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )}"""

new_html = """  <!-- SOLUTION STEPS -->
  {page.solution_title && (
    <section class="section section-tinted" id="solution">
      <div class="container steps-container">
        <div class="steps-left-sticky">
          <div class="section-header reveal">
            <h2 class="section-title">{page.solution_title}</h2>
            {page.solution_intro && <p class="section-intro">{page.solution_intro}</p>}
          </div>
        </div>
        <div class="steps-right-scroll">
          {page.solution_steps && page.solution_steps.length > 0 && (
            <div class="steps-list">
              {page.solution_steps.map((item, i) => (
                <article class="step-item reveal">
                  <div class="step-num-wrap">
                    <div class="step-num">{i + 1}</div>
                    {i < (page.solution_steps?.length ?? 0) - 1 && <div class="step-line"></div>}
                  </div>
                  <div class="step-body">
                    <h3 class="step-title">{item.title}</h3>
                    <p class="card-text">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )}"""

# We can replace the HTML directly since it's just a string, but we need to normalize newlines.
content = content.replace(old_html.replace('\\r\\n', '\\n'), new_html).replace(old_html.replace('\\n', '\\r\\n'), new_html)

# Now standard start/end index for CSS
start = content.find("  /* ── SOLUTION STEPS")
end = content.find("  /* ── FEATURES")

new_css = """  /* ── SOLUTION STEPS (STICKY SCROLL) ── */
  .steps-container {
    display: flex;
    gap: 4rem;
    align-items: flex-start;
  }
  .steps-left-sticky {
    flex: 0 0 38%;
    position: sticky;
    top: 120px;
    padding-bottom: 2rem;
  }
  .steps-right-scroll {
    flex: 1;
  }
  @media (max-width: 992px) {
    .steps-container { flex-direction: column; gap: 2rem; }
    .steps-left-sticky { position: static; flex: none; width: 100%; top: auto; padding-bottom: 0; }
  }

  .steps-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .step-item {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
  }
  .step-num-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }
  .step-num {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 1rem;
    flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(99,102,241,.3);
  }
  .step-line {
    width: 2px;
    flex: 1;
    min-height: 28px;
    background: linear-gradient(to bottom, #d8b4fe, #e2e8f0);
    margin: 8px 0;
  }
  .step-body {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    background: rgba(255,255,255,.8);
    border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, .03);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    flex: 1;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .step-item:hover .step-body {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(99, 102, 241, 0.08);
  }
  .step-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 0.6rem;
  }
  .step-item:last-child .step-body { margin-bottom: 0; }

"""

if start != -1 and end != -1:
    content = content[:start] + new_css + content[end:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS: Steps block replaced.")
else:
    print("ERROR: Could not find Steps block.")

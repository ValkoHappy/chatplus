import sys

file_path = "b:\\Проекты\\НоваяГлава\\CHATPLUS\\portal\\src\\components\\StructuredLandingPage.astro"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace HTML
old_html = """  <!-- INTEGRATIONS -->
  {page.integrations_title && (
    <section class="section section-tinted">
      <div class="container">
        <div class="section-header reveal">
          <h2 class="section-title">{page.integrations_title}</h2>
        </div>
        {page.integration_blocks && page.integration_blocks.length > 0 && (
          <div class="integrations-grid">
            {page.integration_blocks.map((item, i) => {
              const icons = ['lucide:plug', 'lucide:database', 'lucide:calendar-days', 'lucide:webhook', 'lucide:bot', 'lucide:briefcase-business'];
              const icon = icons[i % icons.length];
              return (
                <article class="integration-card reveal delay-2">
                  <div class="integration-head">
                    <div class="integration-icon-wrap">
                      <Icon name={icon} class="integration-icon" />
                    </div>
                    <h3 class="integration-label">{item.label}</h3>
                  </div>
                  <p class="card-text-sm">{item.text}</p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  )}"""

new_html = """  <!-- INTEGRATIONS -->
  {page.integrations_title && (
    <section class="section section-tinted overflow-hidden">
      <div class="container">
        <div class="section-header reveal text-center">
          <h2 class="section-title">{page.integrations_title}</h2>
        </div>
        {page.integration_blocks && page.integration_blocks.length > 0 && (
          <div class="integrations-cloud reveal delay-1">
            {page.integration_blocks.map((item, i) => {
              const icons = ['lucide:plug', 'lucide:database', 'lucide:calendar-days', 'lucide:webhook', 'lucide:bot', 'lucide:briefcase-business'];
              const icon = icons[i % icons.length];
              return (
                <div class="integration-pill">
                  <div class="integration-icon-wrap">
                    <Icon name={icon} class="integration-icon" />
                  </div>
                  <span class="integration-label">{item.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  )}"""

content = content.replace(old_html.replace('\\r\\n', '\\n'), new_html).replace(old_html.replace('\\n', '\\r\\n'), new_html)

# Now standard start/end index for CSS
start = content.find("  /* ── INTEGRATIONS ── */")
end = content.find("  /* ── ROI ── */")

new_css = """  /* ── INTEGRATIONS (LOGO CLOUD) ── */
  .overflow-hidden { overflow: hidden; }
  .text-center { text-align: center; }
  .text-center .section-intro { margin: 0.75rem auto 0; }
  
  .integrations-cloud {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem 1.25rem;
    padding: 1rem 0 2rem;
    max-width: 900px;
    margin: 0 auto;
  }
  .integration-pill {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 1.2rem;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 999px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease;
  }
  .integration-pill:hover {
    transform: translateY(-3px) scale(1.04);
    box-shadow: 0 12px 24px rgba(99, 102, 241, 0.12);
    border-color: rgba(129, 140, 248, 0.6);
  }
  .integration-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #eef2ff, #ddd6fe);
    color: #4f46e5;
  }
  .integration-icon {
    width: 16px;
    height: 16px;
  }
  .integration-label {
    font-size: 0.95rem;
    font-weight: 700;
    color: #1e293b;
    letter-spacing: -0.01em;
  }

"""

if start != -1 and end != -1:
    content = content[:start] + new_css + content[end:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS: Integrations block replaced.")
else:
    print("ERROR: Could not find Integrations block.")

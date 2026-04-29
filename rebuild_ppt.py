import re
html = open(r'c:\Users\ayyub\.gemini\antigravity\scratch\NewProject\cauchy_ppt\index.html','r',encoding='utf-8').read()

# Replace slide 1 with cleaner version
new_slide1 = '''    <!-- SLIDE 1 - Title -->
    <section class="slide active" id="slide-1" role="region" aria-label="Title">
        <div class="slide-bg title-bg"><canvas id="particles-canvas"></canvas></div>
        <div class="slide-content title-slide">
            <div class="animate-in" style="--delay:0"><div class="perma-badge">Complex Analysis Presentation</div></div>
            <h1 class="animate-in hero-title" style="--delay:1">Cauchy Integral<br><span class="gradient-text-hero">Theorem</span></h1>
            <p class="animate-in subtitle" style="--delay:2"><em>Understanding Analytic Functions & Contour Integration</em></p>
            <div class="animate-in meta-row" style="--delay:3">
                <span class="tag">B.Tech Mathematics</span>
                <span class="divider">&middot;</span>
                <span>SRM Institute of Science and Technology</span>
            </div>
        </div>
    </section>'''

# New slide 2 - Team
new_slide2 = '''
    <!-- SLIDE 2 - Team -->
    <section class="slide" id="slide-2" role="region" aria-label="Team">
        <div class="slide-bg bg-subtle-geo"></div>
        <div class="slide-content" style="text-align:center;">
            <div class="animate-in" style="--delay:0;display:flex;align-items:center;justify-content:center;gap:60px;flex-wrap:wrap;">
                <div style="position:relative;width:220px;height:220px;flex-shrink:0;">
                    <svg viewBox="0 0 220 220" style="position:absolute;inset:0;width:100%;height:100%;">
                        <line x1="110" y1="110" x2="110" y2="30" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
                        <line x1="110" y1="110" x2="185" y2="70" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
                        <line x1="110" y1="110" x2="185" y2="160" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
                        <line x1="110" y1="110" x2="35" y2="160" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
                        <line x1="110" y1="110" x2="35" y2="70" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
                    </svg>
                    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#2997FF,#BF5AF2);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;box-shadow:0 0 40px rgba(41,151,255,0.4);">TEAM</div>
                    <div style="position:absolute;top:5px;left:50%;transform:translateX(-50%);width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">M</div>
                    <div style="position:absolute;top:45px;right:10px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">T</div>
                    <div style="position:absolute;bottom:35px;right:10px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">S</div>
                    <div style="position:absolute;bottom:35px;left:10px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">Y</div>
                    <div style="position:absolute;top:45px;left:10px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">K</div>
                </div>
                <div style="text-align:left;">
                    <p style="color:#2997FF;font-size:13px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:8px;" class="animate-in" data-delay="0">Presented By</p>
                    <h2 style="font-size:48px;font-weight:800;margin-bottom:30px;" class="animate-in" data-delay="1">Our <span style="color:#2997FF;">Group</span></h2>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px 40px;margin-bottom:30px;" class="animate-in" data-delay="2">
                        <div><div style="font-weight:600;font-size:18px;">Member 1</div><div style="color:rgba(255,255,255,0.4);font-size:12px;font-family:monospace;">RA24XXXXXXXXXX</div></div>
                        <div><div style="font-weight:600;font-size:18px;">Member 2</div><div style="color:rgba(255,255,255,0.4);font-size:12px;font-family:monospace;">RA24XXXXXXXXXX</div></div>
                        <div><div style="font-weight:600;font-size:18px;">Member 3</div><div style="color:rgba(255,255,255,0.4);font-size:12px;font-family:monospace;">RA24XXXXXXXXXX</div></div>
                        <div><div style="font-weight:600;font-size:18px;">Member 4</div><div style="color:rgba(255,255,255,0.4);font-size:12px;font-family:monospace;">RA24XXXXXXXXXX</div></div>
                    </div>
                    <div class="animate-in" data-delay="3" style="color:rgba(255,255,255,0.6);font-size:15px;">Under the guidance of <strong style="color:white;">Dr. [Guide Name]</strong><br><span style="font-size:13px;">(Professor, Mathematics Department)</span></div>
                </div>
            </div>
        </div>
    </section>'''

# Read current file
lines = html.split('\\n')

# Find and replace slide-1 section
s1_start = html.find('<!-- SLIDE 1')
s1_end = html.find('<!-- SLIDE 2')

# Find old slide 11 (takeaways) and 12 (thank you)
s11_start = html.find('<!-- SLIDE 11')
s12_start = html.find('<!-- SLIDE 12')
s12_end = html.find('<script src=')

# Build new slide 11 (simpler), 12 (conclusion+ref), 13 (thank you)
new_slide11 = '''
    <!-- SLIDE 11 - Simple Summary -->
    <section class="slide" id="slide-11" role="region" aria-label="Summary">
        <div class="slide-bg bg-warm-connect"></div>
        <div class="slide-content perma-slide" style="flex-direction:column;">
            <div class="perma-content" style="text-align:center;max-width:900px;margin:0 auto;">
                <h2 class="animate-in slide-heading" style="--delay:0">What We <span class="gradient-text-warm">Learned</span></h2>
                <div class="staircase-visual animate-in" style="--delay:1;margin:30px auto;width:80%;">
                    <div class="stair stair-1" style="background:rgba(41,151,255,0.2);"><span>If a function has no breaks or sharp points inside a closed path, its integral is zero</span></div>
                    <div class="stair stair-2" style="background:rgba(191,90,242,0.2);"><span>We can find the value of a function at any inside point using only its boundary values</span></div>
                    <div class="stair stair-3"><span>The path you take does not matter &mdash; only the function matters</span></div>
                    <div class="stair stair-4"><span>This idea helps solve very hard real-world math problems easily</span></div>
                    <div class="stair stair-5" style="font-size:16px;"><span>Used in Physics, Engineering, Signal Processing &amp; Quantum Mechanics</span></div>
                </div>
            </div>
        </div>
    </section>'''

new_slide12 = '''
    <!-- SLIDE 12 - Conclusion & References -->
    <section class="slide" id="slide-12" role="region" aria-label="Conclusion">
        <div class="slide-bg bg-deep"></div>
        <div class="slide-content" style="text-align:center;">
            <p class="animate-in section-label" style="--delay:0">Wrapping Up</p>
            <h2 class="animate-in slide-heading" style="--delay:1"><span class="gradient-text-gold">Conclusion</span> & References</h2>
            <div class="animate-in" style="--delay:2;max-width:800px;margin:0 auto;">
                <p style="text-align:justify;line-height:1.7;color:rgba(255,255,255,0.8);font-size:clamp(14px,1.5vw,19px);margin-bottom:30px;">The Cauchy Integral Theorem is a cornerstone of complex analysis. It shows that analytic functions have very special behavior &mdash; their integrals over closed paths are always zero. This one result leads to the Cauchy Integral Formula, Residue Theorem, Taylor Series, and Laurent Series. It is used across mathematics, physics, and engineering to solve problems that would otherwise be extremely difficult.</p>
            </div>
            <div class="corporate-apps animate-in" style="--delay:3;max-width:700px;margin:0 auto;">
                <h3>References</h3>
                <div style="text-align:left;padding:10px 0;">
                    <p style="color:rgba(255,255,255,0.7);font-size:15px;margin-bottom:8px;">1. Kreyszig, E. &mdash; <em>Advanced Engineering Mathematics</em> (10th Ed.)</p>
                    <p style="color:rgba(255,255,255,0.7);font-size:15px;margin-bottom:8px;">2. Churchill, R.V. &amp; Brown, J.W. &mdash; <em>Complex Variables and Applications</em></p>
                    <p style="color:rgba(255,255,255,0.7);font-size:15px;">3. Class lecture notes on Complex Analysis</p>
                </div>
            </div>
        </div>
    </section>'''

new_slide13 = '''
    <!-- SLIDE 13 - Thank You -->
    <section class="slide" id="slide-13" role="region" aria-label="Thank You">
        <div class="slide-bg bg-sunrise"><canvas id="confetti-canvas"></canvas></div>
        <div class="slide-content title-slide">
            <h2 class="animate-in hero-title conclusion-title" style="--delay:1">Thank You</h2>
            <div class="animate-in" style="--delay:2">
                <p style="text-align:center;line-height:1.6;margin:0 auto 40px auto;max-width:700px;color:rgba(255,255,255,0.85);font-size:clamp(16px,1.8vw,24px);">
                    <span style="color:var(--gold);font-size:110%;">Questions &amp; Discussion Welcome</span>
                </p>
            </div>
            <div class="animate-in credits-block conclusion-credits" style="--delay:4">
                <div class="credits-row">
                    <div class="credit-item"><span class="credit-name">Complex Analysis</span><span class="credit-id">SRM Institute of Science and Technology</span></div>
                </div>
            </div>
        </div>
    </section>
'''

# Reconstruct
new_html = html[:s1_start] + new_slide1 + new_slide2 + html[s1_end:s11_start] + new_slide11 + new_slide12 + new_slide13 + '    ' + html[s12_end:]

# Renumber slides 3-10 to 3-10 (they stay same), old 3->3 etc
# But we inserted slide 2, so old slides 2-10 become 3-11
# Let's fix numbering
for old in range(10, 1, -1):
    new_html = new_html.replace(f'id=\"slide-{old}\"', f'id=\"slide-{old+1}\"')
    new_html = new_html.replace(f'SLIDE {old} ', f'SLIDE {old+1} ')

# Fix slide counter text
new_html = new_html.replace('1 / 12', '1 / 13')

# Write
with open(r'c:\\Users\\ayyub\\.gemini\\antigravity\\scratch\\NewProject\\cauchy_ppt\\index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print('Done! 13 slides created.')

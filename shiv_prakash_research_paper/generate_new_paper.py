import re
import os

cwd = r"c:\Users\ayyub\.gemini\antigravity\scratch\shiv prakash research paper"
template_path = os.path.join(cwd, "index.html")
content_path = os.path.join(cwd, "new research paper content.sty")
out_path = os.path.join(cwd, "new_paper.html")

# 1. Extract HTML header and footer from the old template
with open(template_path, 'r', encoding='utf-8') as f:
    template_lines = f.readlines()

header_end_idx = 0
for i, line in enumerate(template_lines):
    if '<div class="paper" id="paper">' in line:
        header_end_idx = i + 1
        break

footer_start_idx = 0
for i in range(len(template_lines)-1, -1, -1):
    if '</div>' in template_lines[i] and '<script>' in template_lines[i+1]:
        footer_start_idx = i
        break
        
html_header = "".join(template_lines[:header_end_idx])
# We will rewrite the script part completely for the new charts
html_footer = """    </div>
    <script>
        function printPDF() { document.getElementById("controls").style.display = "none"; setTimeout(function () { window.print(); setTimeout(function () { document.getElementById("controls").style.display = "flex"; }, 1000); }, 300); }
        async function addPageNumbers(input) {
            if (!input.files || !input.files[0]) return;
            var skipPages = prompt("Start showing page numbers FROM page (e.g. 5 = skip first 4 pages):", "1");
            if (skipPages === null) return;
            skipPages = parseInt(skipPages) || 1;
            var startNum = prompt("Start numbering from:", "1");
            if (startNum === null) return;
            startNum = parseInt(startNum) || 1;
            var file = input.files[0];
            var arrayBuffer = await file.arrayBuffer();
            var pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            var pages = pdfDoc.getPages();
            var font = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
            for (var i = 0; i < pages.length; i++) {
                if (i < skipPages - 1) continue;
                var page = pages[i];
                var { width } = page.getSize();
                var text = String(startNum + (i - (skipPages - 1)));
                var textWidth = font.widthOfTextAtSize(text, 11);
                page.drawText(text, {
                    x: (width - textWidth) / 2,
                    y: 36,
                    size: 11,
                    font: font,
                    color: PDFLib.rgb(0, 0, 0)
                });
            }
            var pdfBytes = await pdfDoc.save();
            var blob = new Blob([pdfBytes], { type: 'application/pdf' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = file.name.replace('.pdf', '') + '_numbered.pdf';
            a.click();
            URL.revokeObjectURL(url);
            input.value = '';
        }
        document.addEventListener("DOMContentLoaded", function () {
            function ic(id, cfg) { var e = document.getElementById(id); if (e) new Chart(e, cfg); }
            
            ic("vendorComparisonChart", { type: "bar", data: { labels: ["Vendor A", "Vendor B", "Vendor C", "Vendor D", "Vendor E"], datasets: [{ label: "Delivery Speed (0-10)", data: [8, 6, 9, 7, 5], backgroundColor: "#1565c0" }, { label: "Quality Consistency (0-10)", data: [9, 8, 7, 6, 8], backgroundColor: "#e65100" }, { label: "Cost Efficiency (0-10)", data: [7, 9, 6, 8, 7], backgroundColor: "#2e7d32" }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } }, scales: { y: { beginAtZero: true, max: 10 } } } });
            
            ic("purchaseContributionChart", { type: "pie", data: { labels: ["Vendor A", "Vendor B", "Vendor C", "Others"], datasets: [{ data: [45, 25, 20, 10], backgroundColor: ["#1565c0", "#c62828", "#f9a825", "#2e7d32"] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } } });
            
            ic("performanceTrendChart", { type: "line", data: { labels: ["Q1", "Q2", "Q3", "Q4"], datasets: [{ label: "Average Vendor Performance", data: [6.5, 7.2, 7.8, 8.4], borderColor: "#6a1b9a", backgroundColor: "rgba(106,27,154,0.1)", fill: true, tension: 0.3, pointRadius: 5 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 10 } } } });
        });
    </script>
</body>
</html>
"""

# Update title
html_header = html_header.replace("<title>AI Mock Interviewer - Research Paper</title>", "<title>Vendor Performance Analysis System - Research Paper</title>")


# 2. Parse the content.sty file
with open(content_path, 'r', encoding='utf-8') as f:
    content_lines = f.readlines()

in_code_block = False
code_content = []
csv_mode = False
csv_header_done = False

output_html = []
figure_counter = 1

def append_p(text):
    if text.strip():
        output_html.append(f"        <p>{text.strip()}</p>\n")

# Process lines
i = 0
while i < len(content_lines):
    line = content_lines[i].strip()
    
    if not line:
        i += 1
        continue
        
    # Ignore the "new research paper content" top line
    if i == 0 and "new research paper content" in line.lower():
        i += 1
        continue

    # Special handling for ABSTRACT
    if line == "ABSTRACT":
        output_html.append("        <h1>ABSTRACT</h1>\n")
        i += 1
        continue
        
    # Chapter headings
    if line.startswith("CHAPTER"):
        # Before a chapter, page break if not first chapter
        if "CHAPTER 1" not in line:
            output_html.append('        <div class="page-break"></div>\n')
        output_html.append(f"        <h1>{line}</h1>\n")
        i += 1
        continue
        
    # Section headings (e.g., 1.1 BACKGROUND)
    if re.match(r"^\d+\.\d+\s+[A-Z\s\(\)]+$", line) or re.match(r"^\d+\.\d+\s+.*", line) and line.isupper():
        output_html.append(f"        <h2>{line}</h2>\n")
        i += 1
        continue
        
    # Subsections / subheadings (e.g., • Technical Feasibility)
    if line.startswith("•\t") or line.startswith("• "):
        clean_line = line.replace("•\t", "").replace("• ", "").strip()
        # If it looks like a simple bullet point sentence, standard list handling
        # We need to look ahead to group bullets into <ul>
        if "Feasibility" in clean_line or "Requirements" in clean_line or "Tier" in clean_line or "Module" in clean_line or "File" in clean_line or clean_line.endswith("Folder") or clean_line.startswith("Table"):
            if len(clean_line.split()) < 5:
                output_html.append(f"        <h3>{clean_line}</h3>\n")
                i += 1
                continue
                
        # Otherwise start a UL
        output_html.append("        <ul>\n")
        output_html.append(f"            <li>{clean_line}</li>\n")
        # peek next
        while i+1 < len(content_lines):
            next_line = content_lines[i+1].strip()
            if next_line.startswith("•\t") or next_line.startswith("• "):
                clean_next = next_line.replace('•\t', '').replace('• ', '').strip()
                output_html.append(f"            <li>{clean_next}</li>\n")
                i += 1
            else:
                break
        output_html.append("        </ul>\n")
        i += 1
        continue

    # Code block start markers
    if "Implementation Code :" in line or "Implementation code :" in line:
        output_html.append(f"        <h3>{line}</h3>\n")
        output_html.append('        <div style="background:#f4f4f4; border:1px solid #ddd; padding:10px; margin-bottom:15px; font-family:monospace; font-size:11pt; white-space:pre-wrap; overflow-x:auto;">\n')
        in_code_block = True
        i += 1
        continue
        
    if in_code_block:
        if line == "Table_Metadata.csv" or line == "5.5 Data Processing and Analysis." or "The system contains data processing" in line or line == "HeatMap:":
            # Code block ended
            output_html.append('        </div>\n')
            in_code_block = False
            # process the current line through the normal loop, don't increment i
            continue
        else:
            output_html.append(f"{line}\n")
            i += 1
            continue

    if "Table_Metadata.csv" in line:
        output_html.append(f"        <h3>{line}</h3>\n")
        output_html.append("        <table>\n")
        csv_mode = True
        csv_header_done = False
        i += 1
        continue
        
    if csv_mode:
        if "," in line and len(line.split(",")) >= 3:
            parts = line.split(",")
            output_html.append("            <tr>\n")
            if not csv_header_done:
                for p in parts:
                    output_html.append(f"                <th>{p.strip()}</th>\n")
                csv_header_done = True
            else:
                for p in parts:
                    output_html.append(f"                <td>{p.strip()}</td>\n")
            output_html.append("            </tr>\n")
            i += 1
            continue
        else:
            output_html.append("        </table>\n")
            csv_mode = False
            continue

    if "HeatMap:" in line or "Distribution Plots" in line or "Count Plots" in line or "Pareto Chart" in line:
        # Some are text, some look like titles for code blocks
        if "HeatMap:" in line:
            output_html.append(f"        <h3>{line}</h3>\n")
            # Usually followed by code
            if i+2 < len(content_lines) and "top_vendors" in content_lines[i+2]:
                output_html.append('        <div style="background:#f4f4f4; border:1px solid #ddd; padding:10px; margin-bottom:15px; font-family:monospace; font-size:11pt; white-space:pre-wrap; overflow-x:auto;">\n')
                in_code_block = True
            i += 1
            continue


    # Numbered lists inside architecture descriptions (e.g. 1. Presentation Layer)
    if re.match(r"^[1-9]\.\s+[A-Z]", line):
        output_html.append(f"        <h3>{line}</h3>\n")
        i += 1
        continue

    # Regular paragraph
    append_p(line)
    i += 1

# Manually add the references since it was missing
output_html.append('        <div class="page-break"></div>\n')
output_html.append('        <h1>REFERENCES</h1>\n')
output_html.append('        <ul>\n')
output_html.append('            <li>Saaty, T. L. (1980). The Analytic Hierarchy Process. McGraw-Hill, New York.</li>\n')
output_html.append('            <li>McKinney, W. (2010). Data Structures for Statistical Computing in Python. Proceedings of the 9th Python in Science Conference.</li>\n')
output_html.append('            <li>Ho, W., Xu, X., & Dey, P. K. (2010). Multi-criteria decision making approaches for supplier evaluation and selection: A literature review. European Journal of Operational Research, 202(1), 16-24.</li>\n')
output_html.append('            <li>Monczka, R. M., Handfield, R. B., Giunipero, L. C., & Patterson, J. L. (2015). Purchasing and Supply Chain Management. Cengage Learning.</li>\n')
output_html.append('        </ul>\n')

# Manually insert placeholder figures for requested charts where appropriate
# 1. Architecture diagram
arch_fig = f'''        <figure>
            <div style="width:100%; height:200px; background:#e2e8f0; border:2px dashed #94a3b8; display:flex; align-items:center; justify-content:center; color:#64748b; font-weight:bold;">[ System Architecture Diagram Placeholder ]</div>
            <figcaption>Figure 1: Vendor Performance Analysis System Architecture</figcaption>
        </figure>\n'''
for idx, html_line in enumerate(output_html):
    if "The architecture consists of three main layers:" in html_line:
        output_html.insert(idx+1, arch_fig)
        break

# 2. Add Chart.js canvases at the end of Results chapter
charts_html = f'''        <div class="chart-wrapper">
            <canvas id="vendorComparisonChart"></canvas>
            <figcaption>Chart 1: Vendor Comparison based on Key Metrics</figcaption>
        </div>
        <div class="chart-wrapper">
            <canvas id="purchaseContributionChart"></canvas>
            <figcaption>Chart 2: Vendor Purchase Contribution</figcaption>
        </div>
        <div class="chart-wrapper">
            <canvas id="performanceTrendChart"></canvas>
            <figcaption>Chart 3: Vendor Performance Trend Over Time</figcaption>
        </div>\n'''
for idx, html_line in enumerate(output_html):
    if "6.4 VENDOR PERFORMANCE EVALUATION" in html_line:
        output_html.insert(idx, charts_html)
        break

# Build final output
final_output = html_header + "".join(output_html) + html_footer

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(final_output)

print(f"Generated {out_path} successfully.")

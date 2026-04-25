import os
import re

cwd = r"c:\Users\ayyub\.gemini\antigravity\scratch\shiv prakash research paper"
template_path = os.path.join(cwd, "index.html")
content_path = os.path.join(cwd, "new research paper content.sty")
out_path = os.path.join(cwd, "new_paper.html")

# 1. Read Template and Adjust margins
with open(template_path, 'r', encoding='utf-8') as f:
    template_lines = f.readlines()

header_end_idx = 0
for i, line in enumerate(template_lines):
    if '<div class="paper" id="paper">' in line:
        header_end_idx = i + 1
        break

html_header = "".join(template_lines[:header_end_idx])
# Update margins
# html_header = html_header.replace("margin: 0.625in;", "margin: 1.25in;")
# html_header = html_header.replace("padding: 0.625in;", "padding: 1.25in;")
html_header = html_header.replace("<title>AI Mock Interviewer - Research Paper</title>", "<title>Vendor Performance Analysis System - Research Paper</title>")

html_footer = """    </div>
    <script>
        function printPDF() { document.getElementById("controls").style.display = "none"; setTimeout(function () { window.print(); setTimeout(function () { document.getElementById("controls").style.display = "flex"; }, 1000); }, 300); }
        function downloadWithPageNumbers() {
            var skipPages = prompt("Start showing page numbers FROM page (e.g. 5 = skip first 4 pages):", "1");
            if (skipPages === null) return;
            skipPages = parseInt(skipPages) || 1;
            var startNum = prompt("Start numbering from:", "1");
            if (startNum === null) return;
            startNum = parseInt(startNum) || 1;
            var wrapper = null;
            if (skipPages > 1) {
                var paper = document.getElementById("paper");
                var children = Array.from(paper.children);
                wrapper = document.createElement("div");
                wrapper.id = "frontMatterWrap";
                var breakCount = 0;
                var toMove = [];
                for (var i = 0; i < children.length; i++) {
                    if (children[i].classList.contains("page-break")) { breakCount++; }
                    if (breakCount >= skipPages - 1) break;
                    toMove.push(children[i]);
                }
                if (toMove.length > 0) {
                    paper.insertBefore(wrapper, toMove[0]);
                    for (var k = 0; k < toMove.length; k++) wrapper.appendChild(toMove[k]);
                }
            }
            var s = document.createElement("style");
            s.id = "pageNumCSS";
            var css = "@page { @bottom-center { content: counter(page); font-family: Times New Roman, Times, serif; font-size: 11pt; } }";
            if (skipPages > 1) {
                css += " #frontMatterWrap { page: front; }";
                css += " @page front { @bottom-center { content: none; } }";
            }
            css += " body { counter-reset: page " + (startNum - skipPages) + "; }";
            s.textContent = css;
            document.head.appendChild(s);
            document.getElementById("controls").style.display="none";
            window.print();
            document.getElementById("controls").style.display="flex";
            document.getElementById("pageNumCSS").remove();
            if (wrapper) {
                var paper = document.getElementById("paper");
                while (wrapper.firstChild) paper.insertBefore(wrapper.firstChild, wrapper);
                wrapper.remove();
            }
        }
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
            ic("defectRateChart", { type: "bar", data: { labels: ["Vendor A", "Vendor B", "Vendor C", "Vendor D"], datasets: [{ label: "Defect Rate (%)", data: [1.2, 3.5, 0.8, 2.1], backgroundColor: "#c62828" }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } }, scales: { y: { beginAtZero: true } } } });
            ic("deliveryTimeChart", { type: "line", data: { labels: ["Jan", "Feb", "Mar", "Apr", "May"], datasets: [{ label: "Avg Delivery Delay (Days)", data: [4, 3, 5, 2, 1], borderColor: "#f9a825", backgroundColor: "rgba(249,168,37,0.1)", fill: true, tension: 0.2 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } } });
            ic("complianceChart", { type: "doughnut", data: { labels: ["Fully Compliant", "Minor Issues", "Non-Compliant"], datasets: [{ data: [75, 18, 7], backgroundColor: ["#2e7d32", "#f9a825", "#c62828"] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } } });
        });
    </script>
</body>
</html>
"""

# 2. Read Content File
with open(content_path, 'r', encoding='utf-8') as f:
    raw_content = f.read()

# Helper function to extract text between two strings
def get_between(text, start, end):
    try:
        s_idx = text.index(start) + len(start)
        e_idx = text.index(end, s_idx)
        return text[s_idx:e_idx].strip()
    except ValueError:
        return ""

def get_to_end(text, start):
    try:
        s_idx = text.index(start) + len(start)
        return text[s_idx:].strip()
    except ValueError:
        return ""

# Basic parsing to HTML
def parse_html(textblock):
    if not textblock: return ""
    lines = textblock.split('\n')
    out = []
    i = 0
    in_code = False
    csv_mode = False
    csv_header_done = False
    
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
            
        # Ignore Chapter tags if they accidentally sneak in
        if line.startswith("CHAPTER"):
            i+=1
            continue
            
        # H3 Sub-subsections (e.g., 4.5.1 Backend Hosting Options:)
        if re.match(r"^\d+\.\d+\.\d+\s+", line):
            out.append(f"        <h3>{line}</h3>\n")
            i += 1
            continue

        # H2 Headings (e.g., 1.1 BACKGROUND or 1.9 Detailed Objectives)
        if re.match(r"^\d+\.\d+\s+[A-Za-z]", line):
            out.append(f"        <h2>{line}</h2>\n")
            i += 1
            continue
            
        # H3 Headings
        if line.startswith("•\t") or line.startswith("• "):
            clean_line = line.replace("•\t", "").replace("• ", "").strip()
            if len(clean_line.split()) < 6 and not clean_line.endswith("."):
                out.append(f"        <h3>{clean_line}</h3>\n")
                i += 1
                continue
            else:
                out.append("        <ul>\n")
                out.append(f"            <li>{clean_line}</li>\n")
                while i+1 < len(lines):
                    nx = lines[i+1].strip()
                    if nx.startswith("•\t") or nx.startswith("• "):
                        cx = nx.replace("•\t", "").replace("• ", "").strip()
                        out.append(f"            <li>{cx}</li>\n")
                        i += 1
                    else:
                        break
                out.append("        </ul>\n")
                i += 1
                continue
                
        if re.match(r"^[1-9]\.\s+[A-Z]", line): # "1. Presentation Layer"
            out.append(f"        <h3>{line}</h3>\n")
            i += 1
            continue
            
        if "Implementation Code :" in line or "Implementation code :" in line:
            out.append(f"        <h3>{line}</h3>\n")
            out.append('        <div style="background:#f4f4f4; border:1px solid #ddd; padding:10px; margin-bottom:15px; font-family:monospace; font-size:11pt; white-space:pre-wrap; overflow-x:auto;">\n')
            in_code = True
            i += 1
            continue
            
        if in_code:
            if line == "Table_Metadata.csv" or "5.5 Data Processing" in line or "The system contains data processing" in line or line.startswith("6.3 VISUALIZATION") or line.startswith("CHAPTER"):
                out.append('        </div>\n')
                in_code = False
                continue # don't increment, process line normally
            else:
                out.append(f"{line}\n")
                i += 1
                continue
                
        if "Table_Metadata.csv" in line:
            out.append(f"        <h3>{line}</h3>\n")
            out.append("        <table>\n")
            csv_mode = True
            csv_header_done = False
            i += 1
            continue
            
        if csv_mode:
            if "," in line and len(line.split(",")) >= 3:
                parts = line.split(",")
                out.append("            <tr>\n")
                if not csv_header_done:
                    for p in parts:
                        out.append(f"                <th>{p.strip()}</th>\n")
                    csv_header_done = True
                else:
                    for p in parts:
                        out.append(f"                <td>{p.strip()}</td>\n")
                out.append("            </tr>\n")
                i += 1
                continue
            else:
                out.append("        </table>\n")
                csv_mode = False
                continue

        if "HeatMap:" in line:
            out.append(f"        <h3>{line}</h3>\n")
            if i+2 < len(lines) and "top_vendors" in lines[i+2]:
                out.append('        <div style="background:#f4f4f4; border:1px solid #ddd; padding:10px; margin-bottom:15px; font-family:monospace; font-size:11pt; white-space:pre-wrap; overflow-x:auto;">\n')
                in_code = True
            i += 1
            continue

        # Standard para
        out.append(f"        <p>{line}</p>\n")
        i += 1
        
    if in_code:
        out.append('        </div>\n')
    if csv_mode:
        out.append('        </table>\n')
        
    return "".join(out)

# 3. Extracts logic
abstract = get_between(raw_content, "ABSTRACT", "CHAPTER 1: INTRODUCTION")
intro = get_between(raw_content, "CHAPTER 1: INTRODUCTION", "CHAPTER 3: SYSTEM ANALYSIS")
srs = get_between(raw_content, "CHAPTER 3: SYSTEM ANALYSIS", "3.6 SYSTEM REQUIREMENTS")
deployment_1 = get_between(raw_content, "3.6 SYSTEM REQUIREMENTS", "3.7 FEASIBILITY STUDY")
deployment_2 = get_between(raw_content, "5.2 Development Environment", "5.3 Project Structure")
srs_cont = get_between(raw_content, "3.7 FEASIBILITY STUDY", "CHAPTER 4: IMPLEMENTATION")
module_desc = get_between(raw_content, "4.5 Module Design", "4.6 3-Tier Architecture")
project_design_1 = get_between(raw_content, "CHAPTER 4: IMPLEMENTATION", "4.5 Module Design")
project_design_2 = get_between(raw_content, "4.6 3-Tier Architecture", "CHAPTER 5: IMPLEMENTATION")

implementation_1 = get_between(raw_content, "CHAPTER 5: IMPLEMENTATION (Practical)", "5.2 Development Environment")
implementation_2_part1 = get_between(raw_content, "5.3 Project Structure", "5.4 Database Implementation")
db_implementation = get_between(raw_content, "5.4 Database Implementation", "5.5 Data Processing and Analysis.")
module_worked = get_between(raw_content, "5.5 Data Processing and Analysis.", "5.6 DASHBOARD IMPLEMENTATION")
implementation_3 = get_between(raw_content, "5.6 DASHBOARD IMPLEMENTATION", "CHAPTER 6: RESULTS")

# Note: The raw content has "CHAPTER 6: RESULTS AND DISCUSSION."
res_idx = raw_content.find("CHAPTER 6: RESULTS")
if res_idx != -1:
    res_start = raw_content.find('\n', res_idx)
    res_end = raw_content.find("CHAPTER 7: CONCLUSION AND FUTURE WORK.")
    implementation_4 = raw_content[res_start:res_end]
else:
    implementation_4 = ""

future_work = get_to_end(raw_content, "CHAPTER 7: CONCLUSION AND FUTURE WORK.")
# Let's clean up any chapters from future_work block if missing
future_idx = future_work.find("REFERENCES")
if future_idx != -1:
    future_work = future_work[:future_idx]

import glob
import os

images_list = glob.glob(os.path.join(cwd, "bhabhi", "Picture*.*"))
images_list.sort(key=lambda x: int(os.path.basename(x).replace("Picture", "").split(".")[0]) if "Picture" in os.path.basename(x) else 0)

chunk1 = images_list[2:20]
chunk2 = images_list[20:35]
chunk3 = images_list[35:]

def generate_gallery(img_list, start_fig_index, title_suffix):
    html = "        <div style='display: block; margin-top: 40px; margin-bottom: 40px;'>\n"
    for i, img_path in enumerate(img_list):
        rel_path = "bhabhi/" + os.path.basename(img_path)
        html += f"            <figure style='width: 95%; max-width: 850px; margin: 0 auto 60px auto; text-align: center; page-break-inside: avoid; break-inside: avoid; display: block;'>\n"
        html += f"                <img src='{rel_path}' alt='Visualization {start_fig_index+i}' style='display: block; width: 100%; height: auto; max-height: 850px; object-fit: contain; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>\n"
        html += f"                <figcaption style='text-align: center; margin-top:15px; font-weight:bold; font-size: 13pt; color: #333;'>Figure {start_fig_index+i}: {title_suffix} {i+1}</figcaption>\n"
        html += f"            </figure>\n"
    html += "        </div>\n"
    return html

gallery_1 = generate_gallery(chunk1, 8, "Data Processing & Implementation")
gallery_2 = generate_gallery(chunk2, 8 + len(chunk1), "Dashboard Analytics Interface")
gallery_3 = generate_gallery(chunk3, 8 + len(chunk1) + len(chunk2), "Performance Evaluation Visualization")

# 4. Assemble explicitly mapped HTML structure
final_html = html_header

def add_chapter(title, content_list):
    global final_html
    final_html += f'        <h1>{title}</h1>\n'
    for html_part in content_list:
        final_html += parse_html(html_part)
    final_html += '        <div class="page-break"></div>\n'

add_chapter("ABSTRACT", [abstract])
add_chapter("INTRODUCTION", [intro])
add_chapter("PROJECT MODULE DESCRIPTION", [module_desc])
add_chapter("DEPLOYMENT ENVIRONMENT", [deployment_1, deployment_2])

final_html += f'        <h1>MODULE WORKED ON IN THIS PROJECT</h1>\n'
final_html += parse_html(module_worked)
final_html += gallery_1
final_html += '        <div class="page-break"></div>\n'

add_chapter("SRS REPORT", [srs, srs_cont])

# Injecting the architecture diagram inside Project Design
proj_des_html = parse_html(project_design_1)
arch_fig = f'''        <figure>
            <img src="new_img_1.png" alt="System Architecture Diagram" style="max-width:100%; height:auto;">
            <figcaption>Figure 1: Vendor Performance Analysis System Architecture</figcaption>
        </figure>\n'''
proj_des_html = proj_des_html.replace("<p>The architecture consists of three main layers:</p>\n", "<p>The architecture consists of three main layers:</p>\n" + arch_fig)

dfd0_fig = f'''        <figure>
            <img src="new_img_3.png" alt="Level 0 DFD" style="max-width:100%; height:auto;">
            <figcaption>Figure 2: Level 0 DFD (Context Diagram)</figcaption>
        </figure>\n'''
dfd1_fig = f'''        <figure>
            <img src="new_img_2.png" alt="Level 1 DFD" style="max-width:100%; height:auto;">
            <figcaption>Figure 3: Level 1 DFD</figcaption>
        </figure>\n'''
proj_des_html = proj_des_html.replace("<h3>Level 0 DFD (Context Diagram)</h3>\n", "<h3>Level 0 DFD (Context Diagram)</h3>\n" + dfd0_fig)
proj_des_html = proj_des_html.replace("<h3>Level 1 DFD</h3>\n", "<h3>Level 1 DFD</h3>\n" + dfd1_fig)

final_html += f'        <h1>PROJECT DESIGN</h1>\n'
final_html += proj_des_html
proj_des_2_html = parse_html(project_design_2)

tier3_fig = f'''        <figure>
            <img src="new_img_4.png" alt="3-Tier Architecture" style="max-width:100%; height:auto;">
            <figcaption>Figure 4: 3-Tier Architecture Design</figcaption>
        </figure>\n'''

proj_des_2_html = proj_des_2_html.replace("<p>The system is three-tier based architecture that divides the application into three different layers. Scalability, security, and maintainability are enhanced.</p>\n", "<p>The system is three-tier based architecture that divides the application into three different layers. Scalability, security, and maintainability are enhanced.</p>\n" + tier3_fig)

ui_img = "bhabhi/" + os.path.basename(images_list[0])
ui_placeholder = f'''        <figure style="width: 95%; max-width: 850px; margin: 0 auto; text-align: center; page-break-inside: avoid; break-inside: avoid; display: block;">
            <img src="{ui_img}" alt="UI Interface" style="display: block; width: 100%; height: auto; max-height: 850px; object-fit: contain; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <figcaption style="text-align: center; margin-top:15px; font-weight:bold; font-size: 13pt; color: #333;">Figure 6: Application Login and Main UI Layout</figcaption>
        </figure>\n'''
proj_des_2_html = proj_des_2_html.replace("<h2>4.7 USER INTERFACE DESIGN</h2>\n", "<h2>4.7 USER INTERFACE DESIGN</h2>\n" + ui_placeholder)

db_code_only = db_implementation.split("Table_Metadata.csv")[0] if "Table_Metadata.csv" in db_implementation else db_implementation

new_table_html = '''        <h3>Global Database MetaData Dictionary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; font-size: 10pt; border: 1px solid #cbd5e1;">
            <thead>
                <tr style="background-color: #f1f5f9; border-bottom: 2px solid #94a3b8; text-align: left;">
                    <th style="padding: 10px; border: 1px solid #cbd5e1;">Table</th><th style="padding: 10px; border: 1px solid #cbd5e1;">Column</th><th style="padding: 10px; border: 1px solid #cbd5e1;">Type</th><th style="padding: 10px; border: 1px solid #cbd5e1;">Description</th>
                </tr>
            </thead>
            <tbody>
                <tr><td style="padding: 6px; border: 1px solid #e2e8f0; font-weight:bold;">purchases</td><td style="padding: 6px; border: 1px solid #e2e8f0;">PONumber, VendorNumber, Quantity, Dollars, PurchasePrice</td><td style="padding: 6px; border: 1px solid #e2e8f0;">NUMERIC</td><td style="padding: 6px; border: 1px solid #e2e8f0;">Contains all purchase transactions made by vendors</td></tr>
                <tr><td style="padding: 6px; border: 1px solid #e2e8f0; font-weight:bold;">purchases</td><td style="padding: 6px; border: 1px solid #e2e8f0;">VendorName, Date, Brand, Description</td><td style="padding: 6px; border: 1px solid #e2e8f0;">TEXT</td><td style="padding: 6px; border: 1px solid #e2e8f0;">Contains all purchase transactions made by vendors</td></tr>
                <tr><td style="padding: 6px; border: 1px solid #e2e8f0; font-weight:bold; background-color:#fafafa;">sales</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">SalesOrderNumber, SalesQuantity, SalesDollars, SalesPrice, ExciseTax</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">NUMERIC</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">Contains all sales transactions of products</td></tr>
                <tr><td style="padding: 6px; border: 1px solid #e2e8f0; font-weight:bold; background-color:#fafafa;">sales</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">Date, VendorNo, Brand</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">TEXT</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">Contains all sales transactions of products</td></tr>
                <tr><td style="padding: 6px; border: 1px solid #e2e8f0; font-weight:bold;">vendor_invoice</td><td style="padding: 6px; border: 1px solid #e2e8f0;">InvoiceNumber, VendorNumber, PONumber, Quantity, Dollars, Freight</td><td style="padding: 6px; border: 1px solid #e2e8f0;">NUMERIC</td><td style="padding: 6px; border: 1px solid #e2e8f0;">Contains vendor invoice information including freight costs</td></tr>
                <tr><td style="padding: 6px; border: 1px solid #e2e8f0; font-weight:bold;">vendor_invoice</td><td style="padding: 6px; border: 1px solid #e2e8f0;">Date</td><td style="padding: 6px; border: 1px solid #e2e8f0;">TEXT</td><td style="padding: 6px; border: 1px solid #e2e8f0;">Contains vendor invoice information including freight costs</td></tr>
                <tr><td style="padding: 6px; border: 1px solid #e2e8f0; font-weight:bold; background-color:#fafafa;">purchase_prices</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">VendorNumber, Price, Volume, PurchasePrice</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">NUMERIC</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">Contains actual and purchase prices for products by vendor and brand</td></tr>
                <tr><td style="padding: 6px; border: 1px solid #e2e8f0; font-weight:bold; background-color:#fafafa;">purchase_prices</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">Brand</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">TEXT</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">Contains actual and purchase prices for products by vendor and brand</td></tr>
                <tr><td style="padding: 6px; border: 1px solid #e2e8f0; font-weight:bold;">begin_inventory</td><td style="padding: 6px; border: 1px solid #e2e8f0;">Quantity, Value</td><td style="padding: 6px; border: 1px solid #e2e8f0;">NUMERIC</td><td style="padding: 6px; border: 1px solid #e2e8f0;">Beginning inventory positions for the fiscal year</td></tr>
                <tr><td style="padding: 6px; border: 1px solid #e2e8f0; font-weight:bold;">begin_inventory</td><td style="padding: 6px; border: 1px solid #e2e8f0;">Brand, Date</td><td style="padding: 6px; border: 1px solid #e2e8f0;">TEXT</td><td style="padding: 6px; border: 1px solid #e2e8f0;">Beginning inventory positions for the fiscal year</td></tr>
                <tr><td style="padding: 6px; border: 1px solid #e2e8f0; font-weight:bold; background-color:#fafafa;">end_inventory</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">Quantity, Value</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">NUMERIC</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">Ending inventory positions for the fiscal year</td></tr>
                <tr><td style="padding: 6px; border: 1px solid #e2e8f0; font-weight:bold; background-color:#fafafa;">end_inventory</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">Brand, Date</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">TEXT</td><td style="padding: 6px; border: 1px solid #e2e8f0; background-color:#fafafa;">Ending inventory positions for the fiscal year</td></tr>
            </tbody>
        </table>\n'''

final_html += proj_des_html
final_html += new_table_html
final_html += proj_des_2_html
final_html += '        <div class="page-break"></div>\n'

# Implementation & Results
final_html += f'        <h1>IMPLEMENTATION</h1>\n'
impl_1_html = parse_html(implementation_1)
proj_struct_fig = f'''        <figure>
            <img src="new_img_5.png" alt="Project Structure" style="max-width:100%; height:auto;">
            <figcaption>Figure 5: VS Code Project Directory Structure</figcaption>
        </figure>\n'''
impl_1_html = impl_1_html.replace("<h3>Database (inventory.db)</h3>\n", proj_struct_fig + "<h3>Database (inventory.db)</h3>\n")

final_html += impl_1_html
final_html += parse_html(implementation_2_part1)
final_html += parse_html("5.4 Database Implementation\n" + db_code_only)

impl_3_html = parse_html(implementation_3)
dash_img = "bhabhi/" + os.path.basename(images_list[1])
dash_screenshot = f'''        <figure style="width: 95%; max-width: 850px; margin: 0 auto; text-align: center; page-break-inside: avoid; break-inside: avoid; display: block;">
            <img src="{dash_img}" alt="Dashboard Interface" style="display: block; width: 100%; height: auto; max-height: 850px; object-fit: contain; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <figcaption style="text-align: center; margin-top:15px; font-weight:bold; font-size: 13pt; color: #333;">Figure 7: Active Dashboard Implementation Layout</figcaption>
        </figure>\n'''
impl_3_html = impl_3_html.replace("<h2>5.6 DASHBOARD IMPLEMENTATION</h2>\n", "<h2>5.6 DASHBOARD IMPLEMENTATION</h2>\n" + dash_screenshot)
impl_3_html += gallery_2
final_html += impl_3_html
impl_4_html = parse_html(implementation_4)

charts_html = f'''        <div style="display: flex; flex-direction: column; align-items: center; gap: 50px;">
        <div class="chart-wrapper" style="width: 100%; max-width: 800px; height: 400px; position: relative; margin-bottom: 50px; page-break-inside: avoid;">
            <canvas id="vendorComparisonChart" style="display: block; width: 100%;"></canvas>
            <figcaption style="text-align: center; margin-top:15px; font-weight:bold; font-size: 13pt; color: #333;">Chart 1: Vendor Comparison based on Key Metrics</figcaption>
        </div>
        <div class="chart-wrapper" style="width: 100%; max-width: 800px; height: 400px; position: relative; margin-bottom: 50px; page-break-inside: avoid;">
            <canvas id="purchaseContributionChart" style="display: block; width: 100%;"></canvas>
            <figcaption style="text-align: center; margin-top:15px; font-weight:bold; font-size: 13pt; color: #333;">Chart 2: Vendor Purchase Contribution</figcaption>
        </div>
        <div class="chart-wrapper" style="width: 100%; max-width: 800px; height: 400px; position: relative; margin-bottom: 50px; page-break-inside: avoid;">
            <canvas id="performanceTrendChart" style="display: block; width: 100%;"></canvas>
            <figcaption style="text-align: center; margin-top:15px; font-weight:bold; font-size: 13pt; color: #333;">Chart 3: Vendor Performance Trend Over Time</figcaption>
        </div>
        <div class="chart-wrapper" style="width: 100%; max-width: 800px; height: 400px; position: relative; margin-bottom: 50px; page-break-inside: avoid;">
            <canvas id="defectRateChart" style="display: block; width: 100%;"></canvas>
            <figcaption style="text-align: center; margin-top:15px; font-weight:bold; font-size: 13pt; color: #333;">Chart 4: Product Defect Rate Analysis by Vendor</figcaption>
        </div>
        <div class="chart-wrapper" style="width: 100%; max-width: 800px; height: 400px; position: relative; margin-bottom: 50px; page-break-inside: avoid;">
            <canvas id="deliveryTimeChart" style="display: block; width: 100%;"></canvas>
            <figcaption style="text-align: center; margin-top:15px; font-weight:bold; font-size: 13pt; color: #333;">Chart 5: Average Delivery Time Delay Trends (Days)</figcaption>
        </div>
        <div class="chart-wrapper" style="width: 100%; max-width: 800px; height: 400px; position: relative; margin-bottom: 50px; page-break-inside: avoid;">
            <canvas id="complianceChart" style="display: block; width: 100%;"></canvas>
            <figcaption style="text-align: center; margin-top:15px; font-weight:bold; font-size: 13pt; color: #333;">Chart 6: Vendor Compliance & SLA Adherence Summary</figcaption>
        </div>\n</div>\n'''

impl_4_html = impl_4_html.replace("<h2>6.4 VENDOR PERFORMANCE EVALUATION</h2>\n", charts_html + gallery_3 + "<h2>6.4 VENDOR PERFORMANCE EVALUATION</h2>\n")

final_html += impl_4_html
final_html += '        <div class="page-break"></div>\n'

# Future of Work
add_chapter("FUTURE OF THE WORK", [future_work])

# References
final_html += '        <h1>REFERENCES</h1>\n'
final_html += """        <ul>
            <li>Saaty, T. L. (1980). The Analytic Hierarchy Process. McGraw-Hill, New York.</li>
            <li>McKinney, W. (2010). Data Structures for Statistical Computing in Python. Proceedings of the 9th Python in Science Conference.</li>
            <li>Ho, W., Xu, X., & Dey, P. K. (2010). Multi-criteria decision making approaches for supplier evaluation and selection: A literature review. European Journal of Operational Research, 202(1), 16-24.</li>
            <li>Monczka, R. M., Handfield, R. B., Giunipero, L. C., & Patterson, J. L. (2015). Purchasing and Supply Chain Management. Cengage Learning.</li>
        </ul>
"""

# Finish
final_html += html_footer

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

print("Generated mapped new_paper.html successfully.")

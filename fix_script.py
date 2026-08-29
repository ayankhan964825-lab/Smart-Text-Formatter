import sys

file_path = r'c:\Users\ayyub\.gemini\antigravity\scratch\NewProject\presentation\script.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

ai_start = content.find("'AIFormatter': {")
detail_start = content.find("const detailContent = {")

if ai_start != -1 and detail_start != -1:
    new_text = """    'AIFormatter': {
        title: 'AIFormatter.js',
        tag: 'AI EXTENSION',
        code: `class AIFormatter {
  async formatText(rawText) {
    // PATH 1: Custom API key -> Direct Gemini call
    // PATH 2: No key -> Server proxy fallback
    
    // const params = this._buildPrompt(rawText);
    // const res = await fetch('/api/format');
    // return validation;
  }

  async fixMermaid(code, err) {
    // Auto-heal broken diagrams
    // using Gemini as validator
  }
}`,
        output: `> Running AIFormatter.formatText()...
[INFO] No custom API key detected. Routing to Proxy mode...
[NETWORK] Fetching https://gemini-proxy/api/format ...
[DEBUG] Awaiting Gemini 2.5 Flash Response...
[NETWORK] 200 OK Response received (240ms).
[PARSE] Validating Semantic JSON structure...
[SUCCESS] Payload integrated successfully. Engine bypass succeeded.`
    },

    'DocxExporter': {
        title: 'DocxExporter.java',
        tag: 'EXPORT MICROSERVICE',
        code: `public class DocxExporter {
    private static final int BUFFER_SIZE = 8192;

    public File export(String htmlContent) throws IOException {
        // Java Buffered I/O for fast export
        try (BufferedOutputStream bos = new BufferedOutputStream(
                new FileOutputStream("document.docx"), BUFFER_SIZE);
             ZipOutputStream zos = new ZipOutputStream(bos)) {
             
            byte[] xmlData = buildOpenXML(htmlContent);
            zos.putNextEntry(new ZipEntry("word/document.xml"));
            zos.write(xmlData);
            zos.closeEntry();
            bos.flush();
        }
        return new File("document.docx");
    }
}`,
        output: `> Running DocxExporter.export(htmlContent)...
[INFO] Resolving relative CSS metrics to OpenXML DPI constraints...
[XML] Opening word/document.xml tree...
[XML] Translating HTML <h1> -> w:pPr w:pStyle="Heading1"
[XML] Translating HTML <p>  -> w:pPr w:pStyle="Normal"
[ZIP] Compressing OpenXML directories via java.util.zip.ZipOutputStream...
[SUCCESS] BufferedOutputStream flushed successfully.
> Output File: document_export.docx`
    },

    'AnalyticsServer': {
        title: 'AnalyticsServer.java',
        tag: 'JAVA 17 ENGINE',
        code: `public class AnalyticsServer {
    private static final Gson gson = new Gson();

    public static void main(String[] args) {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        Javalin app = Javalin.create(config -> {
            config.plugins.enableCors(cors -> { cors.add(it -> it.anyHost()); });
        }).start(port);

        app.post("/analyze", AnalyticsServer::analyzeText);
    }

    private static void analyzeText(Context ctx) {
        // Flesch Kincaid Syllable Math
        // HashMap for Top Keywords
    }
}`,
        output: `> Javalin Server started on port 8080...
[NETWORK] POST /analyze (240ms)
[DEBUG] Running Flesch Kincaid Syllable Math Algorithm...
[DEBUG] Extracted 402 words, 54 sentences, 680 syllables.
[INFO] Flesch Readability Score computed: 65.4 (Standard/Easy)
[DEBUG] Filtering stop-words and building HashMap<String, Integer>...
[INFO] Top 5 keywords extracted.
> JSON response sent successfully.`
    }
};

window.openOOPDModal = function(classId) {
    const data = PIPELINE_DATA[classId];
    if (!data) return;

    let modalOverlay = document.getElementById('oopd-global-modal');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'oopd-global-modal';
        modalOverlay.className = 'oopd-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="oopd-modal">
                <div class="modal-topbar">
                    <div class="modal-title-group">
                        <span class="class-tag" id="oopd-modal-tag"></span>
                        <h3 class="modal-title" id="oopd-modal-title"></h3>
                    </div>
                    <button class="modal-close-btn" onclick="closeOOPDModal()">×</button>
                </div>
                <div class="modal-split">
                    <div class="modal-panel modal-panel-left">
                        <div class="modal-panel-header">Source Code</div>
                        <div class="modal-panel-content">
                            <pre id="oopd-modal-code"></pre>
                        </div>
                    </div>
                    <div class="modal-panel modal-panel-right">
                        <div class="modal-panel-header">Execution Output</div>
                        <div class="modal-panel-content">
                            <pre id="oopd-modal-output"></pre>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeOOPDModal();
        });
    }

    document.getElementById('oopd-modal-tag').textContent = data.tag;
    document.getElementById('oopd-modal-title').textContent = data.title;
    document.getElementById('oopd-modal-code').textContent = data.code;
    document.getElementById('oopd-modal-output').textContent = data.output;

    modalOverlay.style.display = 'flex';
    // trigger reflow
    void modalOverlay.offsetWidth;
    modalOverlay.classList.add('show');
};

window.closeOOPDModal = function() {
    const modalOverlay = document.getElementById('oopd-global-modal');
    if (modalOverlay) {
        modalOverlay.classList.remove('show');
        setTimeout(() => {
            modalOverlay.style.display = 'none';
        }, 300); // match css transition
    }
};

"""
    final_content = content[:ai_start] + new_text + content[detail_start:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(final_content)
    print('SUCCESS')
else:
    print('FAILED TO FIND OFFSETS')

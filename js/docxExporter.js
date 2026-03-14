/**
 * DocxExporter — Generates a TRUE OpenXML .docx file from HTML content.
 * Uses JSZip to create a valid ZIP-based DOCX that opens on ALL devices:
 * Android Google Docs, iOS Pages, macOS Pages, and Desktop MS Word.
 */
const DocxExporter = (() => {
    const EMU_PER_PX = 9525;
    const MAX_IMG_WIDTH_EMU = 5733288; // ~6.27 inches content width on A4

    function esc(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ---- Image handling ----
    let imgCount, imgRels, imgFiles;
    function resetImages() { imgCount = 0; imgRels = []; imgFiles = []; }

    function handleImage(imgEl) {
        const src = imgEl.getAttribute('src') || '';
        const match = src.match(/^data:image\/([\w+]+);base64,(.+)$/);
        if (!match) return '<w:r><w:t>[Image]</w:t></w:r>';
        imgCount++;
        const rId = 'rIdImg' + imgCount;
        const ext = match[1] === 'svg+xml' ? 'png' : (match[1] === 'jpeg' ? 'jpeg' : 'png');
        imgRels.push({ rId, target: 'media/image' + imgCount + '.' + ext });
        imgFiles.push({ path: 'word/media/image' + imgCount + '.' + ext, data: match[2] });
        let w = parseInt(imgEl.getAttribute('width') || imgEl.naturalWidth || 500) || 500;
        let h = parseInt(imgEl.getAttribute('height') || imgEl.naturalHeight || 350) || 350;
        let we = w * EMU_PER_PX, he = h * EMU_PER_PX;
        if (we > MAX_IMG_WIDTH_EMU) { const s = MAX_IMG_WIDTH_EMU / we; we = MAX_IMG_WIDTH_EMU; he = Math.round(he * s); }
        return '<w:r><w:drawing>' +
            '<wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">' +
            '<wp:extent cx="' + we + '" cy="' + he + '"/>' +
            '<wp:docPr id="' + imgCount + '" name="Img' + imgCount + '"/>' +
            '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
            '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
            '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
            '<pic:nvPicPr><pic:cNvPr id="' + imgCount + '" name="image' + imgCount + '.' + ext + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
            '<pic:blipFill><a:blip r:embed="' + rId + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
            '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + we + '" cy="' + he + '"/></a:xfrm>' +
            '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
            '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
    }

    // ---- Inline run extraction ----
    function runs(el) {
        let r = '';
        for (const c of el.childNodes) {
            if (c.nodeType === 3) {
                const t = c.textContent;
                if (t.trim() || t.includes(' ')) r += '<w:r><w:t xml:space="preserve">' + esc(t) + '</w:t></w:r>';
            } else if (c.nodeType === 1) {
                const tg = c.tagName.toLowerCase();
                if (tg === 'b' || tg === 'strong') r += fmtRuns(c, '<w:b/>');
                else if (tg === 'i' || tg === 'em') r += fmtRuns(c, '<w:i/>');
                else if (tg === 'u') r += fmtRuns(c, '<w:u w:val="single"/>');
                else if (tg === 'br') r += '<w:r><w:br/></w:r>';
                else if (tg === 'img') r += handleImage(c);
                else r += runs(c);
            }
        }
        return r;
    }

    function fmtRuns(el, rpr) {
        let r = '';
        for (const c of el.childNodes) {
            if (c.nodeType === 3) {
                const t = c.textContent;
                if (t.trim() || t.includes(' ')) r += '<w:r><w:rPr>' + rpr + '</w:rPr><w:t xml:space="preserve">' + esc(t) + '</w:t></w:r>';
            } else if (c.nodeType === 1) {
                if (c.tagName.toLowerCase() === 'img') r += handleImage(c);
                else r += fmtRuns(c, rpr);
            }
        }
        return r;
    }

    // ---- Block-level DOM to WordML ----
    function toWordML(container) {
        let xml = '';
        function proc(el) {
            if (el.nodeType === 3) {
                const t = el.textContent.trim();
                if (t) xml += '<w:p><w:r><w:t xml:space="preserve">' + esc(t) + '</w:t></w:r></w:p>';
                return;
            }
            if (el.nodeType !== 1) return;
            if (el.style && el.style.display === 'none') return;
            const tg = el.tagName.toLowerCase();

            if (/^h[1-6]$/.test(tg)) {
                xml += '<w:p><w:pPr><w:pStyle w:val="Heading' + tg[1] + '"/><w:keepNext/></w:pPr>' + runs(el) + '</w:p>';
            } else if (tg === 'p') {
                xml += '<w:p>' + runs(el) + '</w:p>';
            } else if (tg === 'ul' || tg === 'ol') {
                const nid = tg === 'ul' ? '1' : '2';
                for (const li of el.children) {
                    if (li.tagName.toLowerCase() === 'li')
                        xml += '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="' + nid + '"/></w:numPr></w:pPr>' + runs(li) + '</w:p>';
                }
            } else if (tg === 'table') {
                xml += '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>';
                ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].forEach(b =>
                    xml += '<w:' + b + ' w:val="single" w:sz="4" w:space="0" w:color="000000"/>');
                xml += '</w:tblBorders></w:tblPr>';
                el.querySelectorAll('tr').forEach(tr => {
                    xml += '<w:tr>';
                    tr.querySelectorAll('th, td').forEach(cell => {
                        xml += '<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p>';
                        if (cell.tagName === 'TH') xml += '<w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">' + esc(cell.textContent) + '</w:t></w:r>';
                        else xml += runs(cell);
                        xml += '</w:p></w:tc>';
                    });
                    xml += '</w:tr>';
                });
                xml += '</w:tbl>';
            } else if (tg === 'img') {
                xml += '<w:p><w:pPr><w:jc w:val="center"/></w:pPr>' + handleImage(el) + '</w:p>';
            } else if (tg === 'br') {
                if (el.style.pageBreakBefore === 'always') xml += '<w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>';
            } else { // div, section, etc — recurse
                for (const ch of el.childNodes) proc(ch);
            }
        }
        for (const ch of container.childNodes) proc(ch);
        return xml;
    }

    // ---- Build full DOCX ZIP ----
    async function generate(htmlElement) {
        resetImages();
        const bodyXml = toWordML(htmlElement);
        const zip = new JSZip();

        // [Content_Types].xml
        zip.file('[Content_Types].xml',
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
            '<Default Extension="xml" ContentType="application/xml"/>' +
            '<Default Extension="png" ContentType="image/png"/>' +
            '<Default Extension="jpeg" ContentType="image/jpeg"/>' +
            '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
            '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
            '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
            '</Types>');

        // _rels/.rels
        zip.file('_rels/.rels',
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
            '</Relationships>');

        // word/_rels/document.xml.rels
        let docRels =
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>';
        imgRels.forEach(r => {
            docRels += '<Relationship Id="' + r.rId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="' + r.target + '"/>';
        });
        docRels += '</Relationships>';
        zip.file('word/_rels/document.xml.rels', docRels);

        // word/styles.xml
        zip.file('word/styles.xml',
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/>' +
            '<w:pPr><w:spacing w:after="240" w:line="360" w:lineRule="auto"/></w:pPr>' +
            '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="22"/></w:rPr></w:style>' +
            [1,2,3,4,5,6].map(n => {
                const sz = [48,36,28,24,22,20][n-1];
                return '<w:style w:type="paragraph" w:styleId="Heading' + n + '"><w:name w:val="heading ' + n + '"/>' +
                    '<w:basedOn w:val="Normal"/><w:next w:val="Normal"/>' +
                    '<w:pPr><w:keepNext/><w:spacing w:before="360" w:after="120"/></w:pPr>' +
                    '<w:rPr><w:b/><w:sz w:val="' + sz + '"/></w:rPr></w:style>';
            }).join('') +
            '</w:styles>');

        // word/numbering.xml (bullet + numbered lists)
        zip.file('word/numbering.xml',
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            '<w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="\u2022"/><w:lvlJc w:val="left"/>' +
            '<w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl></w:abstractNum>' +
            '<w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/>' +
            '<w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>' +
            '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>' +
            '<w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>' +
            '</w:numbering>');

        // word/document.xml
        zip.file('word/document.xml',
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
            '<w:body>' + bodyXml +
            '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
            '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>' +
            '</w:sectPr></w:body></w:document>');

        // Add image binary files
        imgFiles.forEach(f => {
            zip.file(f.path, f.data, { base64: true });
        });

        return await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            compression: 'DEFLATE'
        });
    }

    return { generate };
})();

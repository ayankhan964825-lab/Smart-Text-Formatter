// exportPptx.js — EVS Pure Editable PPTX (No screenshots, 100% native)
document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('export-pptx-btn');
    const overlay = document.getElementById('export-overlay');
    const pctLabel = document.getElementById('export-pct');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', async () => {
        if (typeof PptxGenJS === 'undefined') { alert('PptxGenJS not loaded.'); return; }
        try {
            overlay.style.display = 'flex';
            const pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_16x9';
            pptx.author = 'EVS Team';
            pptx.title = 'Solid Waste Management';

            const F='Segoe UI', FM='Consolas';
            const W='FFFFFF',W80='CCCCCC',W70='B3B3B3',W60='999999',W50='808080',W40='666666',W30='4D4D4D',W20='333333';
            const BLU='2997FF',PUR='BF5AF2',PNK='FF375F',ORG='FF9F0A',GRN='30D158',TEA='5AC8FA',GLD='FFD60A',RSE='FF6B8A';
            const BG1='0A0A1A',BG2='0D0E1A',BG3='0E1117',BG4='111118';
            const TR={type:'fade',speed:'fast'};

            function lbl(s,t,o={}){s.addText(t.toUpperCase(),{x:o.x||0.5,y:o.y||0.55,w:o.w||9,h:0.3,fontSize:11,fontFace:F,color:o.c||BLU,bold:true,charSpacing:3,align:o.a||'center'});}
            function hd(s,parts,o={}){s.addText(parts.map(p=>({text:p.t,options:{fontSize:o.fs||36,fontFace:F,bold:true,color:p.c||W}})),{x:o.x||0.5,y:o.y||0.95,w:o.w||9,h:o.h||0.7,align:o.a||'center',valign:'middle'});}
            function bd(s,t,o={}){s.addText(t,{x:o.x||1.5,y:o.y||1.85,w:o.w||7,h:o.h||0.7,fontSize:o.fs||14,fontFace:F,color:o.c||W70,align:o.a||'center',valign:'top',lineSpacingMultiple:1.4});}
            function crd(s,x,y,w,h,o={}){s.addShape(pptx.ShapeType.roundRect,{x,y,w,h,fill:{color:W,transparency:95},line:{color:W,width:0.5,transparency:90},rectRadius:0.15});if(o.tc)s.addShape(pptx.ShapeType.line,{x:x+0.12,y,w:w-0.24,h:0,line:{color:o.tc,width:3}});}

            // ── SLIDE 1: TITLE ──
            pctLabel.innerText='Slide 1/14...';await new Promise(r=>setTimeout(r,20));
            {const s=pptx.addSlide();s.background={fill:BG1};s.transition=TR;
             s.addText('ENVIRONMENTAL SCIENCE',{x:3,y:0.7,w:4,h:0.42,fontSize:10,fontFace:F,color:W60,bold:true,charSpacing:4,align:'center'});
             s.addText([{text:'Solid Waste\n',options:{fontSize:56,fontFace:F,bold:true,color:W}},{text:'Management',options:{fontSize:56,fontFace:F,bold:true,color:PUR}}],{x:0.5,y:1.4,w:9,h:1.9,align:'center',valign:'middle'});
             s.addText('The Comprehensive Process from Source to Disposal',{x:1.5,y:3.4,w:7,h:0.5,fontSize:20,fontFace:F,color:W70,align:'center'});
             s.addText('System Lifecycle · 21CYM101T',{x:2.6,y:4.15,w:4.8,h:0.42,fontSize:11,fontFace:F,color:BLU,bold:true,align:'center'});}

            // ── SLIDE 2: AUTHORS ──
            pctLabel.innerText='Slide 2/14...';await new Promise(r=>setTimeout(r,20));
            {const s=pptx.addSlide();s.background={fill:BG2};s.transition=TR;
             s.addShape(pptx.ShapeType.ellipse,{x:1.2,y:1.8,w:2,h:2,fill:{color:TEA,transparency:85},line:{color:TEA,width:1,transparency:70}});
             s.addText('TEAM',{x:1.2,y:1.8,w:2,h:2,fontSize:22,fontFace:F,color:W,bold:true,align:'center',valign:'middle'});
             lbl(s,'Presented By',{x:4,w:5.5,a:'left',c:BLU});
             hd(s,[{t:'Our '},{t:'Group',c:TEA}],{x:4,y:1.0,w:5.5,a:'left'});
             const m=[{n:'Mohd Ayan Khan',id:'RA2511003030020'},{n:'Dhairya Agrawal',id:'RA2511003030019'},{n:'Swapneel Mohanty',id:'RA2511003030023'},{n:'Hrishikesh',id:'RA2511003030021'},{n:'Sudha Sharma',id:'RA2511003030024'}];
             m.forEach((v,i)=>{const col=i%2,row=Math.floor(i/2),mx=4+col*2.8,my=1.85+row*0.9;
               s.addText(v.n,{x:mx,y:my,w:2.6,h:0.35,fontSize:14,fontFace:F,color:W80,align:'left'});
               s.addText(v.id,{x:mx,y:my+0.3,w:2.6,h:0.25,fontSize:10,fontFace:FM,color:W30,align:'left'});});
             s.addText([{text:'Under the guidance of ',options:{fontSize:13,fontFace:F,color:W50}},{text:'Dr. Yogendra Bhaskar',options:{fontSize:13,fontFace:F,color:W,bold:true}}],{x:4,y:4.2,w:5.5,h:0.6,align:'center'});}

            // ── SLIDE 3: PIPELINE ──
            pctLabel.innerText='Slide 3/14...';await new Promise(r=>setTimeout(r,20));
            {const s=pptx.addSlide();s.background={fill:BG3};s.transition=TR;
             lbl(s,'Lifecycle Agenda');hd(s,[{t:'The '},{t:'6 Steps',c:PUR},{t:' of Management'}]);
             const steps=[{i:'🏠',l:'1. Generation'},{i:'🗑️',l:'2. Segregation'},{i:'🚛',l:'3. Collection'},{i:'🛣️',l:'4. Transport'},{i:'♻️',l:'5. Processing'},{i:'🏔️',l:'6. Disposal'}];
             steps.forEach((st,i)=>{const sx=0.25+i*1.6,sy=2.3;crd(s,sx,sy,1.4,1.1);
               s.addText(st.i,{x:sx,y:sy+0.1,w:1.4,h:0.4,fontSize:20,align:'center'});
               s.addText(st.l,{x:sx,y:sy+0.55,w:1.4,h:0.35,fontSize:9,fontFace:F,color:W,bold:true,align:'center'});
               if(i<5)s.addText('→',{x:sx+1.4,y:sy+0.3,w:0.2,h:0.4,fontSize:16,color:W40,align:'center'});});}

            // ── SLIDE 4: WHAT IS SOLID WASTE ──
            pctLabel.innerText='Slide 4/14...';await new Promise(r=>setTimeout(r,20));
            {const s=pptx.addSlide();s.background={fill:BG4};s.transition=TR;
             s.addText('🗑️',{x:0.5,y:1.2,w:3,h:2.5,fontSize:100,align:'center',valign:'middle'});
             lbl(s,'Introduction',{x:4,w:5.5,a:'left'});
             hd(s,[{t:'What is '},{t:'Solid Waste?',c:ORG}],{x:4,w:5.5,a:'left'});
             bd(s,'Solid material, non-liquid, and non-gaseous waste generated from domestic, commercial, industrial, and agricultural activities that has been discarded.',{x:4,y:1.85,w:5.3,a:'left',fs:13});
             bd(s,'It is an inevitable byproduct of human existence, heavily influenced by our economic growth and technological advancement.',{x:4,y:2.7,w:5.3,a:'left',fs:13});
             s.addText([{text:'"There is no such thing as \'away\'. When we throw anything away, it must go somewhere."',options:{fontSize:12,fontFace:F,italic:true,color:W70}},{text:'\n— Annie Leonard',options:{fontSize:10,fontFace:F,color:W50}}],{x:4,y:3.6,w:5.3,h:0.9,align:'left',valign:'top'});}

            // ── SLIDE 5: GENERATION STATS ──
            pctLabel.innerText='Slide 5/14...';await new Promise(r=>setTimeout(r,20));
            {const s=pptx.addSlide();s.background={fill:BG1};s.transition=TR;
             lbl(s,'Step 1: Generation');hd(s,[{t:'The Scale of the '},{t:'Problem',c:PUR}]);
             bd(s,'Global waste generation is accelerating at an alarming rate, straining municipal resources and natural environments.');
             const stats=[{n:'2',sf:'B',lb:'Tonnes of MSW generated globally per year'},{n:'3',sf:'.4B',lb:'Tonnes projected by 2050 (A 70% increase)'},{n:'33',sf:'%',lb:'Of global waste is not managed safely'}];
             stats.forEach((st,i)=>{const cx=0.5+i*3.15,cy=3.0;crd(s,cx,cy,2.85,1.8);
               s.addText([{text:st.n,options:{fontSize:44,fontFace:F,bold:true,color:W}},{text:st.sf,options:{fontSize:22,fontFace:F,color:W60}}],{x:cx,y:cy+0.15,w:2.85,h:0.7,align:'center'});
               s.addText(st.lb,{x:cx+0.15,y:cy+0.9,w:2.55,h:0.7,fontSize:11,fontFace:F,color:W50,align:'center',valign:'top',lineSpacingMultiple:1.3});});}

            // ── SLIDE 6: SOURCES & TYPES ──
            pctLabel.innerText='Slide 6/14...';await new Promise(r=>setTimeout(r,20));
            {const s=pptx.addSlide();s.background={fill:BG2};s.transition=TR;
             lbl(s,'Origins');hd(s,[{t:'Sources & '},{t:'Categories',c:GRN}]);
             const cats=[{lt:'M',t:'Municipal',d:'Households, markets, streets. Organics, plastics, paper.'},{lt:'I',t:'Industrial',d:'Manufacturing plants, construction. Can be toxic.'},{lt:'H',t:'Hazardous',d:'Chemicals, paints, explosives. Highly reactive.'},{lt:'B',t:'Biomedical',d:'Hospitals, labs. Syringes, tissues, infectious.'},{lt:'E',t:'E-Waste',d:'Circuit boards, batteries. Toxic heavy metals.'}];
             cats.forEach((c,i)=>{const col=i%3,row=Math.floor(i/3),cx=0.4+col*3.15,cy=2.1+row*1.7;crd(s,cx,cy,2.85,1.5);
               s.addText(c.lt,{x:cx,y:cy+0.1,w:0.6,h:0.5,fontSize:22,fontFace:F,color:W20,bold:true,align:'center'});
               s.addText(c.t,{x:cx+0.6,y:cy+0.1,w:2.1,h:0.4,fontSize:14,fontFace:F,color:W,bold:true,align:'left'});
               s.addText(c.d,{x:cx+0.15,y:cy+0.6,w:2.55,h:0.75,fontSize:10,fontFace:F,color:W70,align:'left',valign:'top',lineSpacingMultiple:1.3});});}

            // ── SLIDE 7: SEGREGATION ──
            pctLabel.innerText='Slide 7/14...';await new Promise(r=>setTimeout(r,20));
            {const s=pptx.addSlide();s.background={fill:BG3};s.transition=TR;
             lbl(s,'Step 2');hd(s,[{t:'Segrega'},{t:'tion',c:GLD}]);
             bd(s,'The most critical phase: dividing waste at the point of origin minimizes contamination and maximizes recycling value.');
             const bins=[{ic:'🌿',t:'Green Bin (Wet)',tc:GRN,items:'• Food scraps & leftovers\n• Fruit & vegetable peels\n• Garden waste / leaves\n• Biodegradable'},
               {ic:'📦',t:'Blue Bin (Dry)',tc:BLU,items:'• Plastics & wrappers\n• Paper & cardboard\n• Clean glass & metals\n• Highly Recyclable'},
               {ic:'⚠️',t:'Red/Black Bin (Reject)',tc:PNK,items:'• Bio-medical waste\n• Sanitary napkins\n• Hazardous chemicals\n• Requires incineration'}];
             bins.forEach((b,i)=>{const cx=0.5+i*3.15,cy=2.8,cw=2.85,ch=2.3;crd(s,cx,cy,cw,ch,{tc:b.tc});
               s.addText(b.ic,{x:cx,y:cy+0.2,w:cw,h:0.4,fontSize:24,align:'center'});
               s.addText(b.t,{x:cx+0.1,y:cy+0.65,w:cw-0.2,h:0.35,fontSize:14,fontFace:F,color:W,bold:true,align:'center'});
               s.addText(b.items,{x:cx+0.2,y:cy+1.05,w:cw-0.4,h:1.1,fontSize:10,fontFace:F,color:W70,align:'left',valign:'top',lineSpacingMultiple:1.4});});}

            // ── SLIDE 8: COLLECTION ──
            pctLabel.innerText='Slide 8/14...';await new Promise(r=>setTimeout(r,20));
            {const s=pptx.addSlide();s.background={fill:BG4};s.transition=TR;
             lbl(s,'Step 3',{x:4,w:5.5,a:'left'});hd(s,[{t:'Collec'},{t:'tion',c:RSE}],{x:4,w:5.5,a:'left'});
             s.addText('Collection Methods',{x:4,y:1.7,w:5.5,h:0.35,fontSize:14,fontFace:F,color:W50,bold:true,align:'left'});
             const mt=['🚪 Door-to-Door: Municipal workers pick up directly from houses daily.','🏘️ Community Bins: Central skips in neighborhoods; cleared regularly.','🚧 Curbside Pick-up: Bins rolled to street edge on specific days.','📱 Smart Bins: IoT enabled bins that alert authorities when 80% full.'];
             mt.forEach((m,i)=>{crd(s,4,2.15+i*0.7,5.5,0.6);s.addText(m,{x:4.15,y:2.15+i*0.7,w:5.2,h:0.6,fontSize:11,fontFace:F,color:W70,align:'left',valign:'middle'});});}

            // ── SLIDE 9: TRANSPORTATION ──
            pctLabel.innerText='Slide 9/14...';await new Promise(r=>setTimeout(r,20));
            {const s=pptx.addSlide();s.background={fill:BG1};s.transition=TR;
             lbl(s,'Step 4');hd(s,[{t:'Transpor'},{t:'tation',c:PUR}]);
             bd(s,'Moving waste from collection points to processing facilities to minimize logistics cost and carbon footprint.');
             const st=[{i:'🗑️',l:'Local Hubs'},{i:'🛻',l:'Small Trucks'},{i:'🏭',l:'Transfer Stn'},{i:'🚛',l:'Heavy Haulers'},{i:'⚙️',l:'Processing'}];
             st.forEach((v,i)=>{const sx=0.5+i*1.9,sy=3.0;crd(s,sx,sy,1.5,1.1);
               s.addText(v.i,{x:sx,y:sy+0.1,w:1.5,h:0.4,fontSize:20,align:'center'});
               s.addText(v.l,{x:sx,y:sy+0.55,w:1.5,h:0.35,fontSize:10,fontFace:F,color:W,bold:true,align:'center'});
               if(i<4)s.addText('→',{x:sx+1.5,y:sy+0.25,w:0.4,h:0.4,fontSize:18,color:W40,align:'center'});});}

            // ── SLIDE 10: PROCESSING INTRO ──
            pctLabel.innerText='Slide 10/14...';await new Promise(r=>setTimeout(r,20));
            {const s=pptx.addSlide();s.background={fill:BG2};s.transition=TR;
             lbl(s,'Step 5');
             s.addText([{text:'Processing &\n',options:{fontSize:50,fontFace:F,bold:true,color:GRN}},{text:'Recovery',options:{fontSize:50,fontFace:F,bold:true,color:GRN}}],{x:0.5,y:1.2,w:9,h:1.6,align:'center',valign:'middle'});
             s.addText('Transforming waste back into resources.',{x:1.5,y:3.0,w:7,h:0.5,fontSize:20,fontFace:F,color:W70,align:'center'});
             const rs=[{t:'Compost',c:GRN},{t:'Recycle',c:TEA},{t:'Incinerate',c:BLU},{t:'Biogas',c:PUR},{t:'Dispose',c:GLD}];
             rs.forEach((r,i)=>{const sx=0.5+i*1.9,sy=3.8;
               s.addShape(pptx.ShapeType.roundRect,{x:sx,y:sy,w:1.6,h:0.5,fill:{color:r.c,transparency:80},line:{color:r.c,width:0.75,transparency:60},rectRadius:0.1});
               s.addText(r.t,{x:sx,y:sy,w:1.6,h:0.5,fontSize:12,fontFace:F,color:r.c,bold:true,align:'center',valign:'middle'});});}

            // ── SLIDE 11: PROCESSING DETAIL ──
            pctLabel.innerText='Slide 11/14...';await new Promise(r=>setTimeout(r,20));
            {const s=pptx.addSlide();s.background={fill:BG3};s.transition=TR;
             lbl(s,'Technologies');hd(s,[{t:'Core Processing '},{t:'Methods',c:TEA}]);
             const pr=[{ic:'🌿',t:'Composting',d:'Biological decomposition of organic waste by microorganisms. Creates rich fertilizer.'},
               {ic:'♻️',t:'Recycling',d:'Material recovery of separated dry waste (plastic, paper, glass) into new products.'},
               {ic:'🔥',t:'Incineration (WtE)',d:'Thermal treatment at 850-1100°C to capture energy and reduce volume by 90%.'},
               {ic:'💨',t:'Biomethanation',d:'Anaerobic digestion of wet organic waste to produce methane/biogas as fuel.'}];
             pr.forEach((p,i)=>{const col=i%2,row=Math.floor(i/2),cx=0.5+col*4.8,cy=2.05+row*1.65,cw=4.4,ch=1.45;crd(s,cx,cy,cw,ch);
               s.addText(p.ic,{x:cx+0.15,y:cy+0.12,w:0.5,h:0.45,fontSize:24,align:'center'});
               s.addText(p.t,{x:cx+0.7,y:cy+0.12,w:cw-1,h:0.4,fontSize:16,fontFace:F,color:W,bold:true,align:'left'});
               s.addText(p.d,{x:cx+0.2,y:cy+0.58,w:cw-0.4,h:0.75,fontSize:11,fontFace:F,color:W70,align:'left',valign:'top',lineSpacingMultiple:1.35});});}

            // ── SLIDE 12: DISPOSAL ──
            pctLabel.innerText='Slide 12/14...';await new Promise(r=>setTimeout(r,20));
            {const s=pptx.addSlide();s.background={fill:BG4};s.transition=TR;
             s.addText('🏔️',{x:0.5,y:1.2,w:3,h:2.5,fontSize:80,align:'center',valign:'middle'});
             lbl(s,'Step 6',{x:4,w:5.5,a:'left'});hd(s,[{t:'Sanitary '},{t:'Landfills',c:GLD}],{x:4,w:5.5,a:'left'});
             bd(s,'The final destination for reject, non-recyclable, and incombustible inert waste. Open dumping is extremely harmful.',{x:4,y:1.85,w:5.3,a:'left',fs:13});
             const sf=['🛡️ Bottom Liner: Thick plastic clay layers preventing soil contamination.','💧 Leachate Collection: Drainage pipes to collect toxic liquid run-offs.','💨 Methane Traps: Vents to capture greenhouse gases from decay.','🔒 Daily Cover: Capping waste with soil to prevent pests and odors.'];
             sf.forEach((v,i)=>{crd(s,4,2.7+i*0.65,5.5,0.55);s.addText(v,{x:4.15,y:2.7+i*0.65,w:5.2,h:0.55,fontSize:11,fontFace:F,color:W70,align:'left',valign:'middle'});});}

            // ── SLIDE 13: CHALLENGES & SOLUTIONS ──
            pctLabel.innerText='Slide 13/14...';await new Promise(r=>setTimeout(r,20));
            {const s=pptx.addSlide();s.background={fill:BG1};s.transition=TR;
             lbl(s,'The Roadmap');hd(s,[{t:'Challenges & '},{t:'Solutions',c:GRN}]);
             crd(s,0.5,2.05,4.4,3.0,{tc:PNK});
             s.addText('⚠️ The Bottlenecks',{x:0.7,y:2.2,w:4,h:0.4,fontSize:16,fontFace:F,color:PNK,bold:true,align:'left'});
             ['× Lack of strict source segregation protocols.','× Insufficient processing & recycling infrastructure.','× Low public awareness & participation.','× Landfill exhaustion leading to accidental fires.'].forEach((c,i)=>s.addText(c,{x:0.8,y:2.7+i*0.55,w:3.9,h:0.45,fontSize:11,fontFace:F,color:W70,align:'left'}));
             crd(s,5.1,2.05,4.4,3.0,{tc:GRN});
             s.addText('🎯 The Way Forward',{x:5.3,y:2.2,w:4,h:0.4,fontSize:16,fontFace:F,color:GRN,bold:true,align:'left'});
             ['→ Mandatory Extended Producer Responsibility (EPR).','→ Transitioning into a true Circular Economy model.','→ Digital fleet tracking via IoT and smart bins.','→ Converting saturated dump-sites into bio-parks.'].forEach((f,i)=>s.addText(f,{x:5.4,y:2.7+i*0.55,w:3.9,h:0.45,fontSize:11,fontFace:F,color:W70,align:'left'}));}

            // ── SLIDE 14: CONCLUSION ──
            pctLabel.innerText='Slide 14/14...';await new Promise(r=>setTimeout(r,20));
            {const s=pptx.addSlide();s.background={fill:BG2};s.transition=TR;
             s.addText([{text:'Waste is a Resource.\n',options:{fontSize:44,fontFace:F,bold:true,color:W}},{text:'Management is the ',options:{fontSize:44,fontFace:F,bold:true,color:W}},{text:'Key.',options:{fontSize:44,fontFace:F,bold:true,color:ORG}}],{x:0.5,y:0.6,w:9,h:1.5,align:'center',valign:'middle'});
             s.addText('✅ Effective management requires government & citizen collaboration.',{x:1,y:2.4,w:8,h:0.45,fontSize:14,fontFace:F,color:W70,align:'center'});
             s.addText('✅ "Reduce, Reuse, Recycle" is more relevant than ever.',{x:1,y:2.9,w:8,h:0.45,fontSize:14,fontFace:F,color:W70,align:'center'});
             s.addText('"When communities recycle, the Earth heals."',{x:1.5,y:3.7,w:7,h:0.5,fontSize:18,fontFace:F,color:W50,align:'center'});
             s.addText('Thank You',{x:2,y:4.3,w:6,h:0.5,fontSize:24,fontFace:F,color:W50,align:'center'});
             s.addText('Environmental Science | 21CYM101T',{x:2,y:4.8,w:6,h:0.35,fontSize:12,fontFace:F,color:W40,align:'center'});}

            pctLabel.innerText='Compiling .pptx...';
            await pptx.writeFile({fileName:'EVS_Solid_Waste_Management.pptx'});
            pctLabel.innerText='Download complete!';
            await new Promise(r=>setTimeout(r,1200));
        } catch(err){console.error('PPTX Error:',err);alert('Export failed: '+err.message);}
        finally{overlay.style.display='none';pctLabel.innerText='';}
    });
});

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'reseach paper.sty');
const lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

// We know the 1-based bounds roughly, but let's strictly find them dynamically to be safe.
let out = [];
let skip = false;
for(let i=0; i<lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('CHAPTER 2: BACKGROUND AND SURVEY')) {
        skip = true;
    } else if (line.startsWith('CHAPTER 3: PROJECT MODULE DESCRIPTION')) {
        skip = false;
    } else if (line.startsWith('CHAPTER 9: RESULTS AND DISCUSSION')) {
        skip = true;
    } else if (line.startsWith('CHAPTER 10: FUTURE OF THE WORK')) {
        skip = false;
    }

    if (!skip) {
        let newLine = line;
        
        // Renumber chapters based on matches
        if (newLine.startsWith('CHAPTER 3: PROJECT MODULE DESCRIPTION')) newLine = 'CHAPTER 2: PROJECT MODULE DESCRIPTION';
        else if (newLine.startsWith('CHAPTER 4: DEPLOYMENT ENVIRONMENT')) newLine = 'CHAPTER 3: DEPLOYMENT ENVIRONMENT';
        else if (newLine.startsWith('CHAPTER 5: MODULES WORKED ON')) newLine = 'CHAPTER 4: MODULES WORKED ON';
        else if (newLine.startsWith('CHAPTER 6: SOFTWARE REQUIREMENTS SPECIFICATION (SRS) REPORT')) newLine = 'CHAPTER 5: SOFTWARE REQUIREMENTS SPECIFICATION (SRS) REPORT';
        else if (newLine.startsWith('CHAPTER 7: SYSTEM DESIGN')) newLine = 'CHAPTER 6: SYSTEM DESIGN (PROJECT DESIGN)';
        else if (newLine.startsWith('CHAPTER 8: IMPLEMENTATION')) newLine = 'CHAPTER 7: IMPLEMENTATION';
        else if (newLine.startsWith('CHAPTER 10: FUTURE OF THE WORK')) newLine = 'CHAPTER 8: FUTURE OF THE WORK';
        else if (newLine.startsWith('CHAPTER 11: REFERENCES')) newLine = 'CHAPTER 9: REFERENCES';
        
        out.push(newLine);
    }
}

fs.writeFileSync(file, out.join('\n'));
console.log('Removed extra chapters and renumbered remaining chapters correctly!');

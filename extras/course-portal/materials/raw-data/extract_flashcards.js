const fs = require('fs');
const path = require('path');

const flashcardsDataPath = path.join(__dirname, '../../flashcards_data.js');
let currentFlashcardsData = fs.readFileSync(flashcardsDataPath, 'utf8');

// Match the array content
const startIdx = currentFlashcardsData.indexOf('[');
const endIdx = currentFlashcardsData.lastIndexOf(']');
let existingArray = [];
if (startIdx !== -1 && endIdx !== -1) {
    try {
        existingArray = JSON.parse(currentFlashcardsData.substring(startIdx, endIdx + 1));
    } catch (e) {
        console.error("Failed to parse existing flashcards:", e);
    }
}

// Read all files in raw-data
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== 'extract_flashcards.js');

let newFlashcards = [];
let existingTerms = new Set(existingArray.map(f => f.term.toLowerCase()));

for (const file of files) {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    
    // We can evaluate the file to get the variable, or just parse it.
    // To parse it safely, we can create a fake context.
    const variableMatch = content.match(/var\s+([A-Z_0-9]+)\s*=\s*(\{[\s\S]*?\});/);
    if (variableMatch) {
        try {
            // Using Function to safely parse object
            const obj = new Function('return ' + variableMatch[2])();
            
            if (obj && obj.concepts) {
                obj.concepts.forEach(concept => {
                    if (concept.conceptName && !existingTerms.has(concept.conceptName.toLowerCase())) {
                        newFlashcards.push({
                            term: concept.conceptName,
                            definition: concept.levels?.soldier || concept.levels?.student || concept.levels?.grandma || "הסבר חסר",
                            tag: "advanced"
                        });
                        existingTerms.add(concept.conceptName.toLowerCase());
                    }
                });
            }
        } catch (e) {
            console.error(`Error parsing file ${file}: ${e}`);
        }
    }
}

console.log(`Found ${newFlashcards.length} new flashcards.`);

if (newFlashcards.length > 0) {
    const updatedArray = [...existingArray, ...newFlashcards];
    const newContent = `const flashcardsData = ${JSON.stringify(updatedArray, null, 2)};\n`;
    fs.writeFileSync(flashcardsDataPath, newContent);
    console.log("Updated flashcards_data.js");
}

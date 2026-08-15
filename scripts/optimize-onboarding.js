const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../assets/onboarding');
const outputDir = inputDir;

async function optimizeImages() {
  try {
    const files = fs.readdirSync(inputDir);
    
    for (const file of files) {
      if (file.toLowerCase().endsWith('.png')) {
        const inputPath = path.join(inputDir, file);
        const outputFilename = file.replace(/\.png$/i, '.webp');
        const outputPath = path.join(outputDir, outputFilename);
        
        console.log(`Processing: ${file}...`);
        
        await sharp(inputPath)
          .resize(800, 800, {
            fit: sharp.fit.inside,
            withoutEnlargement: true
          })
          .webp({ quality: 80 })
          .toFile(outputPath);
          
        console.log(`Created: ${outputFilename}`);
        
        // Delete original PNG to save space
        fs.unlinkSync(inputPath);
        console.log(`Deleted original: ${file}`);
      }
    }
    
    console.log('Image optimization complete for onboarding!');
  } catch (err) {
    console.error('Error optimizing images:', err);
  }
}

optimizeImages();

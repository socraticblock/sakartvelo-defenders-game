const ffmpeg = require('./audio-tools/node_modules/ffmpeg-static');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, '../public/audio');

for (let i = 11; i <= 20; i++) {
  const fileName = `music-era0-lvl${i}.mp3`;
  const filePath = path.join(audioDir, fileName);
  const tempPath = path.join(audioDir, `temp-${fileName}`);

  if (fs.existsSync(filePath)) {
    console.log(`Compressing ${fileName}...`);
    try {
      // Compress to 128k bitrate
      execSync(`"${ffmpeg}" -i "${filePath}" -b:a 128k -y "${tempPath}"`);
      
      const oldSize = fs.statSync(filePath).size;
      const newSize = fs.statSync(tempPath).size;
      
      // Replace original with compressed version
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);
      
      console.log(`Done. Reduced from ${(oldSize / 1024 / 1024).toFixed(2)}MB to ${(newSize / 1024 / 1024).toFixed(2)}MB`);
    } catch (err) {
      console.error(`Error compressing ${fileName}:`, err.message);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  } else {
    console.warn(`File not found: ${fileName}`);
  }
}

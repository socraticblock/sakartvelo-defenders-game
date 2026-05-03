const fs = require('fs');

function getAnimationNames(filePath) {
    const buffer = fs.readFileSync(filePath);
    // GLB header is 12 bytes
    const jsonLen = buffer.readUInt32LE(12);
    const jsonBuffer = buffer.slice(20, 20 + jsonLen);
    const gltf = JSON.parse(jsonBuffer.toString());
    if (gltf.animations) {
        return gltf.animations.map(a => a.name);
    }
    return [];
}

const animPath = 'c:\\dev\\Personal\\sakartvelo-defenders-game\\hermes\\development\\sakartvelo-3d\\public\\models\\medea\\animations.glb';
const charPath = 'c:\\dev\\Personal\\sakartvelo-defenders-game\\hermes\\development\\sakartvelo-3d\\public\\models\\medea\\character.glb';

console.log('Animations in animations.glb:');
console.log(getAnimationNames(animPath));

console.log('Animations in character.glb:');
console.log(getAnimationNames(charPath));

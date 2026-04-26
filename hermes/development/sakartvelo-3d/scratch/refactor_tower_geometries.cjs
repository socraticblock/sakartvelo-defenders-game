const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/TowerMeshes.ts');
let content = fs.readFileSync(targetFile, 'utf8');

if (!content.includes('import { geoCache } from \'./GeometryCache\';')) {
  content = content.replace(/import { mythic, mythicToon } from '\.\/MythicMaterials';/, "import { mythic, mythicToon } from './MythicMaterials';\nimport { geoCache } from './GeometryCache';");
}

content = content.replace(/new THREE\.BoxGeometry\(([^)]+)\)/g, 'geoCache.getBox($1)');
content = content.replace(/new THREE\.CylinderGeometry\(([^)]+)\)/g, 'geoCache.getCylinder($1)');
content = content.replace(/new THREE\.ConeGeometry\(([^)]+)\)/g, 'geoCache.getCone($1)');
content = content.replace(/new THREE\.TorusGeometry\(([^)]+)\)/g, 'geoCache.getTorus($1)');
content = content.replace(/new THREE\.IcosahedronGeometry\(([^)]+)\)/g, 'geoCache.getIcosahedron($1)');
content = content.replace(/new THREE\.PlaneGeometry\(([^)]+)\)/g, 'geoCache.getPlane($1)');

fs.writeFileSync(targetFile, content);
console.log('Successfully replaced geometries with cache in TowerMeshes.ts');

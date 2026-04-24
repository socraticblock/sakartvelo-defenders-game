import fs from 'fs';
const path = './public/data/levels.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Level 1 Nodes
data.levels[0].build_nodes = [[3,2],[6,4],[4,7],[6,9],[9,9],[11,7],[9,4],[12,2]];
// Level 2 Nodes
data.levels[1].build_nodes = [[3,5],[5,5],[5,2],[7,3],[7,9],[9,9],[9,4],[11,5]];
// Level 3 Nodes
data.levels[2].build_nodes = [[7,2],[9,2],[6,4],[4,5],[4,7],[2,9],[11,9],[13,8]];

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Successfully patched levels.json');

const fs = require('fs');
const path = require('path');
function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(new RegExp(search, 'g'), replace);
    }
    fs.writeFileSync(filePath, content);
}
function fixTypesInDirectory(directory) {
    const files = fs.readdirSync(directory);
    files.forEach(file => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            fixTypesInDirectory(fullPath);
        }
        else if (file.endsWith('.ts')) {
            const replacements = [
                ['person: any', 'person?: { connect?: { id?: string } }'],
                ['user_name: any', 'user_name: string'],
                ['role: any', 'role: string'],
                ['listPersonContacts', 'findPersonContacts'],
                ['personId', 'person'],
                ['licenseId', 'license'],
                ['userId', 'user']
            ];
            replaceInFile(fullPath, replacements);
        }
    });
}
fixTypesInDirectory(path.join(__dirname, '..', 'src'));
console.log('Tipos corrigidos com sucesso!');
//# sourceMappingURL=fix-types.js.map
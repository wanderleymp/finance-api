const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function exec(command) {
    try {
        console.log(`Executando: ${command}`);
        return execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Erro ao executar comando: ${command}`);
        process.exit(1);
    }
}

function incrementVersion(currentVersion) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
}

function builder() {
    try {
        // 1. Obter versão atual do package.json
        const packagePath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const currentVersion = packageJson.version;
        const newVersion = incrementVersion(currentVersion);

        // 2. Checkout na branch de release atual
        exec(`git checkout release/v${currentVersion}`);

        // 3. Atualizar develop
        exec('git checkout develop');
        exec(`git merge release/v${currentVersion}`);
        exec('git push origin develop');

        // 4. Atualizar main
        exec('git checkout main');
        exec(`git merge release/v${currentVersion}`);
        exec('git push origin main');

        // 5. Construir imagem docker para main
        exec('npm run docker:build:main');

        // 6. Criar nova branch de release
        exec(`git checkout -b release/v${newVersion}`);

        // 7. Atualizar versão no package.json
        packageJson.version = newVersion;
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

        // 8. Commitar mudanças da versão
        exec('git add package.json');
        exec(`git commit -m "chore: bump version to ${newVersion}"`);

        // 9. Fazer push da nova branch
        exec(`git push -u origin release/v${newVersion}`);

        console.log(`Builder concluído: nova versão ${newVersion}`);
    } catch (error) {
        console.error('Erro durante o builder:', error);
        process.exit(1);
    }
}

builder();

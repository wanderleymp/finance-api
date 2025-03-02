const { execSync } = require('child_process');
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

function builder() {
    try {
        // Obter a versão atual do package.json
        const packagePath = path.join(process.cwd(), 'package.json');
        const packageJson = require(packagePath);
        const currentVersion = packageJson.version;
        const [major, minor, patch] = currentVersion.split('.').map(Number);
        const newVersion = `${major}.${minor}.${patch + 1}`;

        // Checkout na branch de release atual
        exec(`git checkout release/v${currentVersion}`);

        // Atualizar develop
        exec('git checkout develop');
        exec(`git merge release/v${currentVersion}`);
        exec('git push origin develop');

        // Atualizar main
        exec('git checkout main');
        exec(`git merge release/v${currentVersion}`);
        exec('git push origin main');

        // Construir imagem docker para main
        exec('npm run docker:build:main');

        // Criar nova branch de release
        exec(`git checkout -b release/v${newVersion}`);

        // Commitar mudanças
        exec('git add .');
        exec(`git commit -m "chore: preparando release ${newVersion}"`);

        // Fazer push da nova branch
        exec(`git push -u origin release/v${newVersion}`);

        console.log(`Builder concluído: nova versão ${newVersion}`);
    } catch (error) {
        console.error('Erro durante o builder:', error);
        process.exit(1);
    }
}

builder();

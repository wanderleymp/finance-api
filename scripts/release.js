const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Função para executar comandos shell
function exec(command) {
    try {
        return execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Erro ao executar comando: ${command}`);
        process.exit(1);
    }
}

// Função para incrementar versão
function incrementVersion(currentVersion) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
}

// Função principal de release
function release() {
    try {
        // 1. Commitar pendências
        exec('git add .');
        exec('git commit -m "chore: preparando para nova release"');

        // 2. Atualizar branch remota
        exec('git push origin');

        // 3. Incrementar versão
        const packagePath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const currentVersion = packageJson.version;
        const newVersion = incrementVersion(currentVersion);

        // Atualizar versão no package.json
        packageJson.version = newVersion;
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

        // 4. Criar nova branch para a versão
        const newBranchName = `release/v${newVersion}`;
        exec(`git checkout -b ${newBranchName}`);

        // 5. Atualizar branch remotamente
        exec(`git push -u origin ${newBranchName}`);

        console.log(`Release concluída: nova versão ${newVersion}`);
    } catch (error) {
        console.error('Erro durante o release:', error);
        process.exit(1);
    }
}

// Executar o release
release();

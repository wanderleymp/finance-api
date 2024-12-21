const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Função para executar comandos shell
function exec(command) {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        process.exit(1);
    }
}

// Função para atualizar versão no package.json
function updateVersion(type = 'patch') {
    const packagePath = path.join(process.cwd(), 'package.json');
    const package = require(packagePath);
    const [major, minor, patch] = package.version.split('.').map(Number);
    
    let newVersion;
    switch(type) {
        case 'major':
            newVersion = `${major + 1}.0.0`;
            break;
        case 'minor':
            newVersion = `${major}.${minor + 1}.0`;
            break;
        case 'patch':
        default:
            newVersion = `${major}.${minor}.${patch + 1}`;
    }
    
    package.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');
    return newVersion;
}

// Função para atualizar o CHANGELOG
function updateChangelog(version) {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    const date = new Date().toISOString().split('T')[0];
    
    const newEntry = `\n## [${version}] - ${date}\n### Added\n- Development version\n\n`;
    const updatedChangelog = changelog.replace('## [Unreleased]', `## [Unreleased]\n${newEntry}`);
    
    fs.writeFileSync(changelogPath, updatedChangelog);
}

// Função para verificar se a tag existe
function tagExists(version) {
    try {
        execSync(`git rev-parse v${version}`, { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

// Função principal de release
async function release() {
    try {
        // 1. Verificar se está tudo commitado
        const status = execSync('git status --porcelain').toString();
        if (status) {
            console.error('There are uncommitted changes. Please commit or stash them first.');
            process.exit(1);
        }

        // 2. Pegar a versão atual e verificar se já existe
        let currentVersion = require('../package.json').version;
        while (tagExists(currentVersion)) {
            console.log(`Version ${currentVersion} already exists, incrementing...`);
            currentVersion = updateVersion('patch');
        }
        console.log(`Using version: ${currentVersion}`);

        // 3. Build e teste
        console.log('Running tests...');
        exec('npm run test');

        // 4. Push para o remoto
        console.log('Pushing to remote...');
        exec('git push origin develop');

        // 5. Build e push da imagem Docker
        console.log('Building Docker image...');
        exec(`docker build --platform linux/amd64 -t wanderleymp/finance-api:${currentVersion} .`);
        console.log('Pushing Docker image...');
        exec(`docker push wanderleymp/finance-api:${currentVersion}`);

        // 6. Criar e push da tag
        console.log('Creating git tag...');
        exec(`git tag -a v${currentVersion} -m "Release version ${currentVersion}"`);
        exec('git push origin --tags');

        // 7. Atualizar para próxima versão de desenvolvimento
        const nextVersion = updateVersion('patch');
        console.log(`Updating to next development version: ${nextVersion}`);
        updateChangelog(nextVersion);

        // 8. Commit das alterações da nova versão
        exec('git add package.json CHANGELOG.md');
        exec(`git commit -m "chore: bump version to ${nextVersion}"`);
        exec('git push origin develop');

        console.log(`\nRelease ${currentVersion} completed successfully!`);
        console.log(`Development version ${nextVersion} prepared.`);

    } catch (error) {
        console.error('Error during release:', error);
        process.exit(1);
    }
}

// Executar o release
release();

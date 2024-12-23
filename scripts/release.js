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
function updateVersion(version) {
    const packagePath = path.join(process.cwd(), 'package.json');
    const package = require(packagePath);
    package.version = version;
    fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');
    return version;
}

// Função para atualizar o CHANGELOG
function updateChangelog(version) {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    const date = new Date().toISOString().split('T')[0];
    
    const newEntry = `\n## [${version}] - ${date}\n### Added\n- Nova versão estável\n\n`;
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

// Função para obter a próxima versão
function getNextVersion(currentVersion) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
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

        // 2. Determinar a versão do release
        let releaseVersion = require('../package.json').version;
        while (tagExists(releaseVersion)) {
            console.log(`Version ${releaseVersion} already exists, incrementing...`);
            releaseVersion = getNextVersion(releaseVersion);
        }
        console.log(`Release version will be: ${releaseVersion}`);

        // 3. Verificar se o Docker está rodando
        try {
            execSync('docker info', { stdio: 'ignore' });
            // Se chegou aqui, o Docker está rodando
            console.log('Cleaning node_modules and reinstalling dependencies...');
            exec('rm -rf node_modules');
            exec('npm cache clean --force');
            exec('npm ci');

            console.log('Building Docker image...');
            exec(`docker build --platform linux/amd64 -t wanderleymp/finance-api:develop .`);
            console.log('Pushing Docker image...');
            exec(`docker push wanderleymp/finance-api:develop`);
        } catch (error) {
            console.warn('Docker não está rodando ou falha na preparação. Pulando etapas de Docker...');
            console.error(error);
            process.exit(1);
        }

        // 4. Se chegou até aqui, podemos atualizar a versão e criar as tags
        console.log(`Updating version to ${releaseVersion}...`);
        updateVersion(releaseVersion);
        updateChangelog(releaseVersion);

        // 5. Commit das alterações de versão
        exec('git add package.json CHANGELOG.md');
        exec(`git commit -m "chore: release version ${releaseVersion}"`);

        // 6. Push para o remoto
        console.log('Pushing to remote...');
        exec('git push origin develop');

        // 7. Criar e push da tag
        console.log('Creating git tag...');
        exec(`git tag -a v${releaseVersion} -m "Release version ${releaseVersion}"`);
        exec('git push origin --tags');

        // 8. Preparar próxima versão de desenvolvimento
        const nextVersion = getNextVersion(releaseVersion);
        console.log(`Preparing next development version: ${nextVersion}...`);
        updateVersion(nextVersion);
        updateChangelog(nextVersion);

        // 9. Commit da próxima versão
        exec('git add package.json CHANGELOG.md');
        exec(`git commit -m "chore: prepare for next development version ${nextVersion}"`);
        exec('git push origin develop');

        console.log(`\nRelease ${releaseVersion} completed successfully!`);
        console.log(`Development version ${nextVersion} prepared.`);

    } catch (error) {
        console.error('Error during release:', error);
        process.exit(1);
    }
}

// Executar o release
release();

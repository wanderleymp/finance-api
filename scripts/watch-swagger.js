const chokidar = require('chokidar');
const path = require('path');
const { exec } = require('child_process');
const { debounce } = require('lodash');

const modulesPath = path.join(__dirname, '../src/modules');

// Função para gerar a documentação
const generateDocs = () => {
    console.log('\n🔄 Detectada alteração na documentação, regenerando...');
    exec('node scripts/generate-swagger.js', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Erro ao gerar documentação:', error);
            return;
        }
        if (stderr) {
            console.error('⚠️ Avisos:', stderr);
        }
        console.log(stdout);
        console.log('✓ Documentação atualizada com sucesso!');
    });
};

// Debounce para evitar múltiplas gerações simultâneas
const debouncedGenerate = debounce(generateDocs, 1000);

// Inicializa o watcher
console.log('👀 Monitorando alterações na documentação...');
console.log(`📁 Pasta monitorada: ${modulesPath}/**/docs/*.yaml`);

chokidar
    .watch(`${modulesPath}/**/docs/*.yaml`, {
        ignored: /(^|[\/\\])\../,
        persistent: true
    })
    .on('change', (path) => {
        console.log(`📝 Arquivo alterado: ${path}`);
        debouncedGenerate();
    })
    .on('error', error => console.error(`Erro no watcher: ${error}`));

// Gera documentação inicial
generateDocs();

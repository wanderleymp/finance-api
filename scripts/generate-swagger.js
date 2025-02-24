const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

function orderPathsByTags(paths, tags) {
    // Cria um mapa de tag para paths
    const pathsByTag = {};
    tags.forEach(tag => pathsByTag[tag.name] = {});
    
    // Agrupa paths por tag
    Object.entries(paths).forEach(([path, methods]) => {
        const firstMethod = Object.values(methods)[0];
        const tag = firstMethod.tags?.[0];
        if (tag && pathsByTag[tag]) {
            pathsByTag[tag][path] = methods;
        }
    });
    
    // Ordena paths dentro de cada tag
    const orderedPaths = {};
    tags.forEach(tag => {
        const tagPaths = pathsByTag[tag.name];
        Object.keys(tagPaths)
            .sort((a, b) => {
                // Ordena primeiro por método HTTP
                const methodA = Object.keys(paths[a])[0].toLowerCase();
                const methodB = Object.keys(paths[b])[0].toLowerCase();
                const methodOrder = ['get', 'post', 'put', 'patch', 'delete'];
                const methodDiff = methodOrder.indexOf(methodA) - methodOrder.indexOf(methodB);
                if (methodDiff !== 0) return methodDiff;
                
                // Depois pelo path
                return a.localeCompare(b);
            })
            .forEach(path => {
                orderedPaths[path] = tagPaths[path];
            });
    });
    
    return orderedPaths;
}

function combineYamlFiles() {
    const modulesPath = path.join(__dirname, '../src/modules');
    const modules = fs.readdirSync(modulesPath);
    
    let combinedSpec = {
        openapi: '3.0.0',
        info: {
            title: 'Finance API',
            version: '1.0.0',
            description: 'API para gestão financeira'
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production' 
                    ? 'https://api.agilefinance.com.br'
                    : process.env.NODE_ENV === 'development'
                        ? 'https://dev.agilefinance.com.br'
                        : 'http://localhost:3000',
                description: process.env.NODE_ENV === 'production'
                    ? 'Servidor de Produção'
                    : process.env.NODE_ENV === 'development'
                        ? 'Servidor de Desenvolvimento'
                        : 'Servidor Local'
            }
        ],
        tags: [],
        paths: {},
        components: {
            schemas: {},
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    };

    // Combina todos os arquivos YAML em ordem alfabética
    modules.sort().forEach(module => {
        const yamlPath = path.join(modulesPath, module, 'docs/swagger.yaml');
        if (fs.existsSync(yamlPath)) {
            console.log(`Processando módulo: ${module}`);
            try {
                const moduleSpec = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
                
                // Merge tags
                if (moduleSpec.tags) {
                    combinedSpec.tags = [...combinedSpec.tags, ...moduleSpec.tags];
                }

                // Merge e ordena paths
                if (moduleSpec.paths) {
                    // Combina os paths temporariamente
                    const allPaths = { ...combinedSpec.paths, ...moduleSpec.paths };
                    
                    // Ordena os paths alfabeticamente
                    const sortedPaths = {};
                    Object.keys(allPaths)
                        .sort((a, b) => a.localeCompare(b))
                        .forEach(path => {
                            sortedPaths[path] = allPaths[path];
                        });
                    
                    combinedSpec.paths = sortedPaths;
                }
                
                // Merge e ordena schemas
                if (moduleSpec.components?.schemas) {
                    const allSchemas = { 
                        ...combinedSpec.components.schemas, 
                        ...moduleSpec.components.schemas 
                    };
                    
                    // Ordena os schemas alfabeticamente
                    const sortedSchemas = {};
                    Object.keys(allSchemas)
                        .sort((a, b) => a.localeCompare(b))
                        .forEach(schema => {
                            sortedSchemas[schema] = allSchemas[schema];
                        });
                    
                    combinedSpec.components.schemas = sortedSchemas;
                }

                // Merge securitySchemes
                if (moduleSpec.components?.securitySchemes) {
                    combinedSpec.components.securitySchemes = {
                        ...combinedSpec.components.securitySchemes,
                        ...moduleSpec.components.securitySchemes
                    };
                }

                console.log(`✓ Módulo ${module} processado com sucesso`);
            } catch (error) {
                console.error(`Erro ao processar ${module}:`, error.message);
            }
        }
    });

    // Remove tags duplicadas e ordena alfabeticamente
    combinedSpec.tags = Array.from(new Map(
        combinedSpec.tags.map(tag => [tag.name, tag])
    ).values())
    .sort((a, b) => a.name.localeCompare(b.name));

    // Ordena paths por tag e depois por método HTTP
    combinedSpec.paths = orderPathsByTags(combinedSpec.paths, combinedSpec.tags);

    return combinedSpec;
}

function generateSwaggerSpec() {
    console.log('Iniciando geração da documentação Swagger...');
    
    const combinedSpec = combineYamlFiles();
    
    // Cria diretório docs se não existir
    const docsDir = path.join(__dirname, '../src/docs');
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }
    
    // Salva como JSON para uso pelo Swagger UI
    const jsonOutputPath = path.join(docsDir, 'swagger.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(combinedSpec, null, 2));
    
    // Salva como YAML para referência e debug
    const yamlOutputPath = path.join(docsDir, 'swagger.yaml');
    fs.writeFileSync(yamlOutputPath, yaml.dump(combinedSpec, {
        indent: 2,
        lineWidth: -1
    }));
    
    console.log(`✓ Documentação gerada com sucesso em:`);
    console.log(`  - ${jsonOutputPath}`);
    console.log(`  - ${yamlOutputPath}`);
}

// Executa a geração
generateSwaggerSpec();

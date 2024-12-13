module.exports = {
  appVersion: '1.0.0.1',
  requiredDbVersion: '1.0.0.1',
  
  // Função para comparar versões
  isCompatibleVersion(currentVersion, requiredVersion) {
    // Se não há versão atual (primeira migração), permite
    if (currentVersion === '0.0.0') return true;

    const currentParts = currentVersion.split('.').map(Number);
    const requiredParts = requiredVersion.split('.').map(Number);
    
    // Compara major version
    return currentParts[0] === requiredParts[0];
  }
};

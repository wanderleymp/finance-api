function isValidCNPJ(cnpj) {
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/[^\d]/g, '');

  // Verifica se tem 14 dígitos
  if (cnpj.length !== 14) {
    return false;
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  // Validação do primeiro dígito verificador
  let soma = 0;
  let peso = 5;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpj.charAt(i)) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  let digito = 11 - (soma % 11);
  let dv1 = digito > 9 ? 0 : digito;
  if (parseInt(cnpj.charAt(12)) !== dv1) {
    return false;
  }

  // Validação do segundo dígito verificador
  soma = 0;
  peso = 6;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpj.charAt(i)) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  digito = 11 - (soma % 11);
  let dv2 = digito > 9 ? 0 : digito;
  if (parseInt(cnpj.charAt(13)) !== dv2) {
    return false;
  }

  return true;
}

module.exports = {
  isValidCNPJ
};

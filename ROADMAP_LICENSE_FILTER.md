# Roadmap Task: Implementação de Filtro Automático de Licenças

## Versão: 1.0.0.7

### Objetivo
Implementar um middleware global para aplicar filtros automáticos de licenças nas consultas ao banco de dados, garantindo que usuários só acessem registros vinculados às suas licenças.

### Escopo de Implementação

#### 1. Middleware de Filtro de Licenças
- Localização: `src/middlewares/licenseFilter.js`
- Funcionalidades:
  - Consultar tabela `user_license` para obter licenças do usuário autenticado
  - Armazenar licenças em `req.user.licenses`
  - Bloquear acesso se nenhuma licença for encontrada

#### 2. Modificações nos Repositórios
- Adaptar consultas SQL para incluir filtro de licenças automaticamente
- Rotas a serem modificadas:
  - Persons
  - Contacts
  - Movements

#### Código Proposto
```javascript
const db = require('../db');

async function applyLicenseFilter(req, res, next) {
  try {
    const userId = req.user.user_id; // Obtido do JWT
    
    const query = `
      SELECT license_id 
      FROM public.user_license 
      WHERE user_id = $1
    `;

    const licenses = await db.query(query, [userId]);

    if (!licenses.rows.length) {
      return res.status(403).json({ message: 'Usuário não possui licenças ativas.' });
    }

    req.user.licenses = licenses.rows.map(row => row.license_id);
    next();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao aplicar filtro de licenças.' });
  }
}

module.exports = applyLicenseFilter;
```

### Tarefas Detalhadas
- [ ] Criar middleware de filtro de licenças
- [ ] Modificar repositórios para incluir filtro de licenças
- [ ] Atualizar rotas para usar novo middleware
- [ ] Implementar testes de integração
- [ ] Documentar mudanças no README

### Considerações de Segurança
- Garantir que filtros sejam aplicados em todas as consultas
- Validar permissões de usuário antes de executar operações

### Dependências
- Middleware de autenticação JWT
- Tabela `user_license` no banco de dados

### Notas Adicionais
- Implementação deve ser transparente para o usuário final
- Performance das consultas deve ser mantida

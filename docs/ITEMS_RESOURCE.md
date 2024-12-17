# Recurso de Items

## Visão Geral
O recurso de Items fornece uma API completa para gerenciamento de itens no sistema de finanças.

## Estrutura do Recurso

### Modelo de Dados
- `item_id`: Identificador único do item
- `name`: Nome do item (obrigatório)
- `description`: Descrição do item
- `category`: Categoria do item
- `price`: Preço do item
- `stock_quantity`: Quantidade em estoque
- `unit`: Unidade de medida
- `is_active`: Status de ativação do item

## Endpoints

### Listar Items
- **Método**: GET `/items`
- **Parâmetros de Query**:
  * `page`: Número da página (padrão: 1)
  * `limit`: Número de itens por página (padrão: 10)
  * `name`: Filtro por nome
  * `category`: Filtro por categoria
  * `min_price`: Preço mínimo
  * `max_price`: Preço máximo

### Detalhes do Item
- **Método**: GET `/items/:id`
- **Parâmetros**: ID do item

### Criar Item
- **Método**: POST `/items`
- **Corpo da Requisição**:
```json
{
  "name": "Nome do Item",
  "description": "Descrição opcional",
  "category": "Categoria",
  "price": 100.50,
  "stock_quantity": 10,
  "unit": "UN",
  "is_active": true
}
```

### Atualizar Item
- **Método**: PUT `/items/:id`
- **Corpo da Requisição**: Campos a serem atualizados

### Excluir Item
- **Método**: DELETE `/items/:id`

## Validações

### Criação/Atualização
- `name`: Obrigatório, mínimo 3 caracteres
- `price`: Valor positivo
- `stock_quantity`: Valor não negativo
- `is_active`: Booleano

## Exemplos de Uso

### Listar Items com Filtros
```bash
GET /items?category=Eletrônicos&min_price=50&max_price=500
```

### Criar Novo Item
```bash
POST /items
{
  "name": "Smartphone",
  "category": "Eletrônicos",
  "price": 1500.00,
  "stock_quantity": 20
}
```

## Tratamento de Erros
- Erros de validação retornam status 400
- Itens não encontrados retornam status 404
- Erros de servidor retornam status 500

## Considerações
- Todos os endpoints requerem autenticação
- Paginação padrão: 10 itens por página
- Suporte a filtros dinâmicos

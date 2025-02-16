@ApiTags('Tasktypes')
export class TasktypesController {

  @ApiOperation({ summary: 'Listar registros' })
  @ApiResponse({ 
    status: 200, 
    description: 'Listar registros realizada com sucesso' 
  })
  findAll() {
    // Implementação existente
  }

  @ApiOperation({ summary: 'Buscar registro por ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Buscar registro por ID realizada com sucesso' 
  })
  findById() {
    // Implementação existente
  }

  @ApiOperation({ summary: 'Criar novo registro' })
  @ApiResponse({ 
    status: 200, 
    description: 'Criar novo registro realizada com sucesso' 
  })
  create() {
    // Implementação existente
  }

  @ApiOperation({ summary: 'Atualizar registro' })
  @ApiResponse({ 
    status: 200, 
    description: 'Atualizar registro realizada com sucesso' 
  })
  update() {
    // Implementação existente
  }

  @ApiOperation({ summary: 'Remover registro' })
  @ApiResponse({ 
    status: 200, 
    description: 'Remover registro realizada com sucesso' 
  })
  delete() {
    // Implementação existente
  }
}
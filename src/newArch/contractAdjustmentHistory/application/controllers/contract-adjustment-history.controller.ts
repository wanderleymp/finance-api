import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards 
} from '@nestjs/common';
import { CreateContractAdjustmentHistoryDto } from '../dto/create-contract-adjustment-history.dto';
import { CreateContractAdjustmentHistoryUseCase } from '../../domain/useCases/create-contract-adjustment-history.usecase';
import { FindContractAdjustmentHistoryUseCase } from '../../domain/useCases/find-contract-adjustment-history.usecase';
import { UpdateContractAdjustmentHistoryUseCase } from '../../domain/useCases/update-contract-adjustment-history.usecase';
import { DeleteContractAdjustmentHistoryUseCase } from '../../domain/useCases/delete-contract-adjustment-history.usecase';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ContractAdjustmentHistoryEntity } from '../../domain/entities/contract-adjustment-history.entity';

@Controller('contract-adjustment-history')
@UseGuards(JwtAuthGuard)
export class ContractAdjustmentHistoryController {
  constructor(
    private readonly createUseCase: CreateContractAdjustmentHistoryUseCase,
    private readonly findUseCase: FindContractAdjustmentHistoryUseCase,
    private readonly updateUseCase: UpdateContractAdjustmentHistoryUseCase,
    private readonly deleteUseCase: DeleteContractAdjustmentHistoryUseCase
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe()) 
    createDto: CreateContractAdjustmentHistoryDto
  ) {
    return this.createUseCase.execute(createDto);
  }

  @Get()
  async findAll(
    @Query('page') page = 1, 
    @Query('limit') limit = 10,
    @Query() filters = {}
  ) {
    return this.findUseCase.list(page, limit, filters);
  }

  @Get(':id')
  async findById(
    @Param('id') id: number
  ) {
    return this.findUseCase.findById(id);
  }

  @Get('contract/:contractId')
  async findByContractId(
    @Param('contractId') contractId: number
  ) {
    return this.findUseCase.findByContractId(contractId);
  }

  @Put(':id')
  async update(
    @Param('id') id: number, 
    @Body(new ValidationPipe()) 
    data: Partial<CreateContractAdjustmentHistoryDto>
  ) {
    return this.updateUseCase.execute(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: number
  ) {
    return this.deleteUseCase.execute(id);
  }
}

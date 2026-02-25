import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('energy')
  @ApiOperation({ summary: 'Retorna consumo vs energia compensada por período' })
  @ApiQuery({ name: 'numero_cliente', required: false, example: '7204076116' })
  @ApiResponse({
    status: 200,
    description: 'Resultados de energia (kWh)',
    schema: {
      example: [
        { mes_referencia: 'JAN/2024', consumo_energia_kwh: 506, energia_compensada_total_kwh: 456 },
      ],
    },
  })
  getEnergyResults(@Query('numero_cliente') numero_cliente?: string) {
    return this.dashboardService.getEnergyResults(numero_cliente);
  }

  @Get('financial')
  @ApiOperation({ summary: 'Retorna valor total sem GD vs economia GD por período' })
  @ApiQuery({ name: 'numero_cliente', required: false, example: '7204076116' })
  @ApiResponse({
    status: 200,
    description: 'Resultados financeiros (R$)',
    schema: {
      example: [
        { mes_referencia: 'JAN/2024', valor_total_sem_gd: 329.6, economia_gd: -222.22 },
      ],
    },
  })
  getFinancialResults(@Query('numero_cliente') numero_cliente?: string) {
    return this.dashboardService.getFinancialResults(numero_cliente);
  }
}

import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterInvoicesDto {
  @ApiPropertyOptional({ example: '7204076116', description: 'Número do cliente' })
  @IsOptional()
  @IsString()
  numero_cliente?: string;

  @ApiPropertyOptional({ example: 'JAN/2024', description: 'Mês de referência no formato MES/ANO' })
  @IsOptional()
  @IsString()
  mes_referencia?: string;
}

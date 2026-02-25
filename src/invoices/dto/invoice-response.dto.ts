import { ApiProperty } from '@nestjs/swagger';

export class InvoiceResponseDto {
  @ApiProperty({ example: 'uuid-gerado' })
  id: string;

  @ApiProperty({ example: '7204076116' })
  numero_cliente: string;

  @ApiProperty({ example: 'JAN/2024' })
  mes_referencia: string;

  @ApiProperty({ example: 50 })
  energia_eletrica_kwh: number;

  @ApiProperty({ example: 47.75 })
  energia_eletrica_valor: number;

  @ApiProperty({ example: 456 })
  energia_sceee_kwh: number;

  @ApiProperty({ example: 232.42 })
  energia_sceee_valor: number;

  @ApiProperty({ example: 456 })
  energia_compensada_kwh: number;

  @ApiProperty({ example: -222.22 })
  energia_compensada_valor: number;

  @ApiProperty({ example: 49.43 })
  contrib_ilum_publica: number;

  @ApiProperty({ example: 506, description: 'energia_eletrica_kwh + energia_sceee_kwh' })
  consumo_energia_kwh: number;

  @ApiProperty({ example: 456, description: 'igual a energia_compensada_kwh' })
  energia_compensada_total_kwh: number;

  @ApiProperty({ example: 329.6, description: 'energia_eletrica_valor + energia_sceee_valor + contrib_ilum_publica' })
  valor_total_sem_gd: number;

  @ApiProperty({ example: -222.22, description: 'igual a energia_compensada_valor' })
  economia_gd: number;

  @ApiProperty()
  created_at: Date;
}

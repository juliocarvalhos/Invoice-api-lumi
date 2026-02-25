import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getEnergyResults(numero_cliente?: string) {
    const groups = await this.prisma.invoice.groupBy({
      by: ['mes_referencia'],
      where: numero_cliente ? { numero_cliente } : undefined,
      _sum: {
        consumo_energia_kwh: true,
        energia_compensada_total_kwh: true,
      },
      orderBy: {
        _min: { created_at: 'asc' },
      },
    });

    return groups.map((g) => ({
      mes_referencia: g.mes_referencia,
      consumo_energia_kwh: g._sum.consumo_energia_kwh ?? 0,
      energia_compensada_total_kwh: g._sum.energia_compensada_total_kwh ?? 0,
    }));
  }

  async getFinancialResults(numero_cliente?: string) {
    const groups = await this.prisma.invoice.groupBy({
      by: ['mes_referencia'],
      where: numero_cliente ? { numero_cliente } : undefined,
      _sum: {
        valor_total_sem_gd: true,
        economia_gd: true,
      },
      orderBy: {
        _min: { created_at: 'asc' },
      },
    });

    return groups.map((g) => ({
      mes_referencia: g.mes_referencia,
      valor_total_sem_gd: g._sum.valor_total_sem_gd ?? 0,
      economia_gd: g._sum.economia_gd ?? 0,
    }));
  }
}

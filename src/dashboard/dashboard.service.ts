import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getEnergyResults(numero_cliente?: string) {
    return this.prisma.invoice.findMany({
      where: numero_cliente ? { numero_cliente } : undefined,
      select: {
        mes_referencia: true,
        consumo_energia_kwh: true,
        energia_compensada_total_kwh: true,
      },
      orderBy: { mes_referencia: 'asc' },
    });
  }

  async getFinancialResults(numero_cliente?: string) {
    return this.prisma.invoice.findMany({
      where: numero_cliente ? { numero_cliente } : undefined,
      select: {
        mes_referencia: true,
        valor_total_sem_gd: true,
        economia_gd: true,
      },
      orderBy: { mes_referencia: 'asc' },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../llm/gemini.service';
import { InvoiceCalculatorService } from './invoice-calculator.service';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { FilterInvoicesDto } from './dto/filter-invoices.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly calculatorService: InvoiceCalculatorService,
  ) {}

  async processAndSave(pdfBuffer: Buffer): Promise<InvoiceResponseDto> {
    const extracted = await this.geminiService.extractFromPdf(pdfBuffer);
    const computed = this.calculatorService.compute(extracted);

    return this.prisma.invoice.create({
      data: { ...extracted, ...computed },
    });
  }

  async findAll(filters: FilterInvoicesDto): Promise<InvoiceResponseDto[]> {
    const where: Prisma.InvoiceWhereInput = {};

    if (filters.numero_cliente) {
      where.numero_cliente = filters.numero_cliente;
    }
    if (filters.mes_referencia) {
      where.mes_referencia = filters.mes_referencia;
    }

    return this.prisma.invoice.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }
}

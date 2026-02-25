import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../llm/gemini.service';
import { InvoiceCalculatorService } from './invoice-calculator.service';
import { InvoiceResponseDto } from './dto/invoice-response.dto';

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
}

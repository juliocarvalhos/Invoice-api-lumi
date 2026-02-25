import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceCalculatorService } from './invoice-calculator.service';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [LlmModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceCalculatorService],
  exports: [InvoiceCalculatorService],
})
export class InvoicesModule {}

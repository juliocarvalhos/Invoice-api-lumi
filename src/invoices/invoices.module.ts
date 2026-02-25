import { Module } from '@nestjs/common';
import { InvoiceCalculatorService } from './invoice-calculator.service';

@Module({
  providers: [InvoiceCalculatorService],
  exports: [InvoiceCalculatorService],
})
export class InvoicesModule {}

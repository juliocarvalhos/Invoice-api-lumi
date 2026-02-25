import { Injectable } from '@nestjs/common';
import { InvoiceExtractedData } from '../llm/interfaces/invoice-extracted-data.interface';
import { InvoiceComputedData } from './interfaces/invoice-computed-data.interface';

@Injectable()
export class InvoiceCalculatorService {
  compute(data: InvoiceExtractedData): InvoiceComputedData {
    return {
      consumo_energia_kwh: data.energia_eletrica_kwh + data.energia_sceee_kwh,
      energia_compensada_total_kwh: data.energia_compensada_kwh,
      valor_total_sem_gd:
        data.energia_eletrica_valor +
        data.energia_sceee_valor +
        data.contrib_ilum_publica,
      economia_gd: data.energia_compensada_valor,
    };
  }
}

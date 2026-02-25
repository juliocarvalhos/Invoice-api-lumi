import { InvoiceCalculatorService } from './invoice-calculator.service';
import { InvoiceExtractedData } from '../llm/interfaces/invoice-extracted-data.interface';

const baseData: InvoiceExtractedData = {
  numero_cliente: '7202210726',
  mes_referencia: 'ABR/2024',
  energia_eletrica_kwh: 50,
  energia_eletrica_valor: 47.75,
  energia_sceee_kwh: 476,
  energia_sceee_valor: 242.74,
  energia_compensada_kwh: 476,
  energia_compensada_valor: -232.64,
  contrib_ilum_publica: 49.43,
};

describe('InvoiceCalculatorService', () => {
  let service: InvoiceCalculatorService;

  beforeEach(() => {
    service = new InvoiceCalculatorService();
  });

  it('deve calcular consumo_energia_kwh como soma de eletrica + sceee', () => {
    const result = service.compute(baseData);
    expect(result.consumo_energia_kwh).toBe(526); // 50 + 476
  });

  it('deve calcular energia_compensada_total_kwh igual a energia_compensada_kwh', () => {
    const result = service.compute(baseData);
    expect(result.energia_compensada_total_kwh).toBe(476);
  });

  it('deve calcular valor_total_sem_gd como soma de eletrica + sceee + ilum', () => {
    const result = service.compute(baseData);
    expect(result.valor_total_sem_gd).toBeCloseTo(339.92); // 47.75 + 242.74 + 49.43
  });

  it('deve calcular economia_gd igual a energia_compensada_valor', () => {
    const result = service.compute(baseData);
    expect(result.economia_gd).toBe(-232.64);
  });

  it('deve lidar com valores zero', () => {
    const zeroData: InvoiceExtractedData = {
      ...baseData,
      energia_eletrica_kwh: 0,
      energia_sceee_kwh: 0,
      energia_eletrica_valor: 0,
      energia_sceee_valor: 0,
      energia_compensada_kwh: 0,
      energia_compensada_valor: 0,
      contrib_ilum_publica: 0,
    };
    const result = service.compute(zeroData);
    expect(result.consumo_energia_kwh).toBe(0);
    expect(result.valor_total_sem_gd).toBe(0);
    expect(result.economia_gd).toBe(0);
  });

  it('deve lidar com energia_compensada_valor negativo', () => {
    const result = service.compute({ ...baseData, energia_compensada_valor: -100 });
    expect(result.economia_gd).toBe(-100);
  });
});

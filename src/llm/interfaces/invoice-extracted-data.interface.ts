export interface InvoiceExtractedData {
  numero_cliente: string;
  mes_referencia: string;
  energia_eletrica_kwh: number;
  energia_eletrica_valor: number;
  energia_sceee_kwh: number;
  energia_sceee_valor: number;
  energia_compensada_kwh: number;
  energia_compensada_valor: number;
  contrib_ilum_publica: number;
}

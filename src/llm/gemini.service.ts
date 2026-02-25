import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { InvoiceExtractedData } from './interfaces/invoice-extracted-data.interface';

const EXTRACTION_PROMPT = `
Analise esta fatura de energia elétrica e extraia os dados abaixo.
Retorne APENAS um objeto JSON válido, sem texto adicional, com exatamente esta estrutura:

{
  "numero_cliente": "string com o número do cliente",
  "mes_referencia": "string no formato MES/ANO (ex: SET/2024)",
  "energia_eletrica_kwh": number,
  "energia_eletrica_valor": number,
  "energia_sceee_kwh": number,
  "energia_sceee_valor": number,
  "energia_compensada_kwh": number,
  "energia_compensada_valor": number,
  "contrib_ilum_publica": number
}

Regras:
- Todos os valores numéricos devem ser números (float), sem símbolos de moeda ou unidade.
- "energia_compensada_valor" é o valor da linha "Energia compensada GD I" — use número negativo se aparecer negativo na fatura.
- Se um campo não for encontrado, use 0.
`;

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly model: GenerativeModel;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });
  }

  async extractFromPdf(pdfBuffer: Buffer): Promise<InvoiceExtractedData> {
    let responseText: string;

    try {
      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBuffer.toString('base64'),
          },
        },
        { text: EXTRACTION_PROMPT },
      ]);

      responseText = result.response.text();
    } catch (error) {
      this.logger.error('Falha ao chamar a API do Gemini', error);
      throw new ServiceUnavailableException(
        'O serviço de extração via LLM está indisponível. Tente novamente.',
      );
    }

    try {
      const parsed = JSON.parse(responseText) as InvoiceExtractedData;
      return parsed;
    } catch (error) {
      this.logger.error(
        'Resposta do Gemini não é um JSON válido',
        responseText,
      );
      throw new UnprocessableEntityException(
        'Não foi possível interpretar a resposta do LLM. O documento pode estar ilegível.',
      );
    }
  }
}

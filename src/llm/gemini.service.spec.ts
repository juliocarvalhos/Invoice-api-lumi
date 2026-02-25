import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { InvoiceExtractedData } from './interfaces/invoice-extracted-data.interface';

const mockExtractedData: InvoiceExtractedData = {
  numero_cliente: '7202210726',
  mes_referencia: 'SET/2024',
  energia_eletrica_kwh: 50,
  energia_eletrica_valor: 47.75,
  energia_sceee_kwh: 476,
  energia_sceee_valor: 242.74,
  energia_compensada_kwh: 476,
  energia_compensada_valor: -232.64,
  contrib_ilum_publica: 49.43,
};

const mockGenerateContent = jest.fn();

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({ generateContent: mockGenerateContent }),
  })),
}));

describe('GeminiService', () => {
  let service: GeminiService;

  beforeEach(async () => {
    mockGenerateContent.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: ConfigService,
          useValue: { get: () => 'fake-api-key' },
        },
      ],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
  });

  it('deve retornar InvoiceExtractedData corretamente quando LLM responde JSON válido', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(mockExtractedData) },
    });

    const result = await service.extractFromPdf(Buffer.from('fake-pdf'));
    expect(result).toEqual(mockExtractedData);
  });

  it('deve lançar UnprocessableEntityException quando LLM retorna JSON malformado', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'isso não é json válido' },
    });

    await expect(service.extractFromPdf(Buffer.from('fake-pdf'))).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('deve lançar ServiceUnavailableException quando LLM lança erro de rede', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Network error'));

    await expect(service.extractFromPdf(Buffer.from('fake-pdf'))).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});

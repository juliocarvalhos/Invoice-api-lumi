import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../llm/gemini.service';
import { InvoiceCalculatorService } from './invoice-calculator.service';

const mockExtracted = {
  numero_cliente: '7204076116',
  mes_referencia: 'JAN/2024',
  energia_eletrica_kwh: 50,
  energia_eletrica_valor: 47.75,
  energia_sceee_kwh: 456,
  energia_sceee_valor: 232.42,
  energia_compensada_kwh: 456,
  energia_compensada_valor: -222.22,
  contrib_ilum_publica: 49.43,
};

const mockComputed = {
  consumo_energia_kwh: 506,
  energia_compensada_total_kwh: 456,
  valor_total_sem_gd: 329.6,
  economia_gd: -222.22,
};

const mockCreatedInvoice = { id: 'uuid-1', ...mockExtracted, ...mockComputed, created_at: new Date() };

const mockPrisma = {
  invoice: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockGeminiService = {
  extractFromPdf: jest.fn(),
};

const mockCalculatorService = {
  compute: jest.fn(),
};

describe('InvoicesService', () => {
  let service: InvoicesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GeminiService, useValue: mockGeminiService },
        { provide: InvoiceCalculatorService, useValue: mockCalculatorService },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  describe('processAndSave', () => {
    it('deve chamar Gemini → Calculator → Prisma na ordem correta', async () => {
      mockGeminiService.extractFromPdf.mockResolvedValue(mockExtracted);
      mockCalculatorService.compute.mockReturnValue(mockComputed);
      mockPrisma.invoice.create.mockResolvedValue(mockCreatedInvoice);

      const pdfBuffer = Buffer.from('fake-pdf');
      await service.processAndSave(pdfBuffer);

      expect(mockGeminiService.extractFromPdf).toHaveBeenCalledWith(pdfBuffer);
      expect(mockCalculatorService.compute).toHaveBeenCalledWith(mockExtracted);
      expect(mockPrisma.invoice.create).toHaveBeenCalledWith({
        data: { ...mockExtracted, ...mockComputed },
      });
    });

    it('deve persistir dados calculados junto com os brutos', async () => {
      mockGeminiService.extractFromPdf.mockResolvedValue(mockExtracted);
      mockCalculatorService.compute.mockReturnValue(mockComputed);
      mockPrisma.invoice.create.mockResolvedValue(mockCreatedInvoice);

      const result = await service.processAndSave(Buffer.from('fake-pdf'));

      expect(result).toEqual(mockCreatedInvoice);
      const createCall = mockPrisma.invoice.create.mock.calls[0][0];
      expect(createCall.data).toMatchObject(mockComputed);
    });
  });

  describe('findAll', () => {
    it('deve chamar findMany sem where quando filtros estão vazios', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      await service.findAll({});

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { created_at: 'desc' },
      });
    });

    it('deve chamar findMany com where.numero_cliente quando filtro é passado', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([mockCreatedInvoice]);

      await service.findAll({ numero_cliente: '7204076116' });

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
        where: { numero_cliente: '7204076116' },
        orderBy: { created_at: 'desc' },
      });
    });

    it('deve chamar findMany com where.mes_referencia quando filtro é passado', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      await service.findAll({ mes_referencia: 'JAN/2024' });

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
        where: { mes_referencia: 'JAN/2024' },
        orderBy: { created_at: 'desc' },
      });
    });
  });
});

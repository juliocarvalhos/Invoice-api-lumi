import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

const mockInvoice = {
  id: 'uuid-1',
  numero_cliente: '7204076116',
  mes_referencia: 'JAN/2024',
  energia_eletrica_kwh: 50,
  energia_eletrica_valor: 47.75,
  energia_sceee_kwh: 456,
  energia_sceee_valor: 232.42,
  energia_compensada_kwh: 456,
  energia_compensada_valor: -222.22,
  contrib_ilum_publica: 49.43,
  consumo_energia_kwh: 506,
  energia_compensada_total_kwh: 456,
  valor_total_sem_gd: 329.6,
  economia_gd: -222.22,
  created_at: new Date(),
};

const mockInvoicesService = {
  processAndSave: jest.fn(),
  findAll: jest.fn(),
};

describe('InvoicesController', () => {
  let controller: InvoicesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [{ provide: InvoicesService, useValue: mockInvoicesService }],
    }).compile();

    controller = module.get<InvoicesController>(InvoicesController);
  });

  describe('upload', () => {
    it('deve chamar processAndSave e retornar a fatura quando PDF válido', async () => {
      mockInvoicesService.processAndSave.mockResolvedValue(mockInvoice);
      const fakeFile = { buffer: Buffer.from('pdf') } as Express.Multer.File;

      const result = await controller.upload(fakeFile);

      expect(mockInvoicesService.processAndSave).toHaveBeenCalledWith(fakeFile.buffer);
      expect(result).toEqual(mockInvoice);
    });

    it('deve lançar BadRequestException quando nenhum arquivo é enviado', async () => {
      await expect(controller.upload(undefined)).rejects.toThrow(BadRequestException);
    });

    it('deve propagar ServiceUnavailableException quando LLM falha', async () => {
      mockInvoicesService.processAndSave.mockRejectedValue(new ServiceUnavailableException());
      const fakeFile = { buffer: Buffer.from('pdf') } as Express.Multer.File;

      await expect(controller.upload(fakeFile)).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('findAll', () => {
    it('deve repassar filtros ao service e retornar lista', async () => {
      mockInvoicesService.findAll.mockResolvedValue([mockInvoice]);
      const filters = { numero_cliente: '7204076116' };

      const result = await controller.findAll(filters);

      expect(mockInvoicesService.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual([mockInvoice]);
    });

    it('deve retornar array vazio quando não há faturas', async () => {
      mockInvoicesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll({});

      expect(result).toEqual([]);
    });
  });
});

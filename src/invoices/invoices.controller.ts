import {
  Controller,
  Post,
  Get,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { FilterInvoicesDto } from './dto/filter-invoices.dto';

const multerOptions = {
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new BadRequestException('Apenas arquivos PDF são aceitos'), false);
    } else {
      cb(null, true);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
};

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiOperation({ summary: 'Faz upload de uma fatura PDF e extrai os dados via LLM' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo PDF da fatura de energia (máx. 10MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Fatura processada e salva com sucesso', type: InvoiceResponseDto })
  @ApiResponse({ status: 400, description: 'Arquivo não enviado ou não é PDF' })
  @ApiResponse({ status: 503, description: 'Serviço do LLM indisponível' })
  @ApiResponse({ status: 422, description: 'Resposta do LLM não pôde ser interpretada' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<InvoiceResponseDto> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    return this.invoicesService.processAndSave(file.buffer);
  }

  @Get()
  @ApiOperation({ summary: 'Lista faturas processadas com filtros opcionais' })
  @ApiQuery({ name: 'numero_cliente', required: false, example: '7204076116' })
  @ApiQuery({ name: 'mes_referencia', required: false, example: 'JAN/2024' })
  @ApiResponse({ status: 200, description: 'Lista de faturas', type: [InvoiceResponseDto] })
  findAll(@Query() filters: FilterInvoicesDto): Promise<InvoiceResponseDto[]> {
    return this.invoicesService.findAll(filters);
  }
}

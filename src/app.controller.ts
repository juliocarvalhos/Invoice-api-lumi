import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Verifica se a API está online' })
  @ApiResponse({ status: 200, description: 'API funcionando', schema: { example: { status: 'ok' } } })
  healthCheck(): { status: string } {
    return { status: 'ok' };
  }
}

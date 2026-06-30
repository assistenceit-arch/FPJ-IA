import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck(): object {
    return {
      application: 'FPJ IA',
      status: 'OK',
      version: '1.0.0',
    };
  }
}

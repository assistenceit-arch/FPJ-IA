import { Test, TestingModule } from '@nestjs/testing';
import { FormularioMaestroService } from './formulario-maestro.service';

describe('FormularioMaestroService', () => {
  let service: FormularioMaestroService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormularioMaestroService],
    }).compile();

    service = module.get<FormularioMaestroService>(FormularioMaestroService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

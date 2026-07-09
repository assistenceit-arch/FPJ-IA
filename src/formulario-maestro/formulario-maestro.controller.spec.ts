import { Test, TestingModule } from '@nestjs/testing';
import { FormularioMaestroController } from './formulario-maestro.controller';
import { FormularioMaestroService } from './formulario-maestro.service';

describe('FormularioMaestroController', () => {
  let controller: FormularioMaestroController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormularioMaestroController],
      providers: [FormularioMaestroService],
    }).compile();

    controller = module.get<FormularioMaestroController>(FormularioMaestroController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

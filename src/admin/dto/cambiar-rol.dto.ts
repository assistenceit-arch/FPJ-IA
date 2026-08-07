import { IsIn } from 'class-validator';

export class CambiarRolDto {
  @IsIn(['FUNCIONARIO', 'ADMINISTRADOR'])
  rol!: string;
}

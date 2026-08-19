import { IsBoolean } from 'class-validator';

export class DesbloqueoEdicionDto {
  @IsBoolean()
  desbloqueada!: boolean;
}

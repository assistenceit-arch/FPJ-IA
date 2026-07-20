import { Module } from '@nestjs/common';
import { NarrativaService } from './narrativa.service';

@Module({
  providers: [NarrativaService],
  exports: [NarrativaService],
})
export class NarrativaModule {}

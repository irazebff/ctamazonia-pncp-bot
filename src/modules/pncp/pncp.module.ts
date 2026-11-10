import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PncpItem } from './entities/pncp-item.entity.js';
import { PncpService } from './pncp.service.js';
import { PncpController } from './pncp.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PncpItem]),
    NotificationsModule,
  ],
  controllers: [PncpController],
  providers: [PncpService],
  exports: [PncpService],
})
export class PncpModule {}

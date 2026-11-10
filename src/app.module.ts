import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PncpItem } from './modules/pncp/entities/pncp-item.entity.js';
import { PncpModule } from './modules/pncp/pncp.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'pncp_db',
      entities: [PncpItem],
      synchronize: process.env.NODE_ENV !== 'production', // Agora desliga sozinho em produção!
    }),
    PncpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('pncp_itens')
export class PncpItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  controlePncpId: string; // Identificador único da contratação no PNCP (ex: CNPJ + Ano + Sequencial)

  @Column()
  numeroControlePNCP: string;

  @Column('text')
  objeto: string;

  @Column()
  orgaoNome: string;

  @Column()
  uf: string;

  @Column({ nullable: true })
  linkSistemaOrigem: string;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  valorEstimado: number;

  @Column()
  dataPublicacao: string;

  @CreateDateColumn()
  encontradoEm: Date;
}
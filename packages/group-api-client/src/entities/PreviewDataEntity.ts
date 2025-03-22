import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

import { PreviewData } from '../models';

@Entity()
export class PreviewDataEntity implements PreviewData {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: true })
    title?: string;

    @Column({ nullable: true, type: 'text' })
    description?: string;

    // Using "simple-array" to store the images array as a comma-separated string.
    @Column('simple-array', { nullable: true })
    images?: string[];

    @Column({ nullable: true })
    siteName?: string;

    @Column({ nullable: true })
    url?: string;

    @Column({ nullable: true })
    locale?: string;

    @Column({ nullable: true })
    ogType?: string;

    @Column({ nullable: true })
    logo?: string;

    @Column({ nullable: true, type: 'text' })
    embedHtml?: string;
}

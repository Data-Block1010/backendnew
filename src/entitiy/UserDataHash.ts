import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BaseEntity } from 'typeorm';
import { User } from './User';

@Entity()
export class UserDataHash extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    dataHash!: string;

    @Column()
    filename!: string;

    @Column()
    cid!: string; // Add this line to store the CID


    // Store the secret (encrypted) associated with this data
    @Column()
    encryptedSecret!: string;

    @ManyToOne(() => User, (user) => user.dataHashes, { onDelete: 'CASCADE' })
    user!: User;

    // Use 'datetime' instead of 'timestamp' for SQLite compatibility
    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;
}

import knex, { Knex } from 'knex';
import { Contact } from '../types';

export class DatabaseService {
  private db: Knex;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    this.db = knex({
      client: 'pg',
      connection: connectionString,
      pool: { min: 0, max: 7 },
    });
    this.initializeTables();
  }

  private async initializeTables() {
    const exists = await this.db.schema.hasTable('contacts');
    if (!exists) {
      await this.db.schema.createTable('contacts', (table: Knex.CreateTableBuilder) => {
        table.increments('id').primary();
        table.string('phoneNumber');
        table.string('email');
        table.integer('linkedId');
        table.enu('linkPrecedence', ['primary', 'secondary']).notNullable();
        table.timestamp('createdAt').defaultTo(this.db.fn.now());
        table.timestamp('updatedAt').defaultTo(this.db.fn.now());
        table.timestamp('deletedAt').nullable();
      });
      console.log('Contacts table created successfully');
    }
  }

  async findContactsByEmailOrPhone(email?: string, phoneNumber?: string): Promise<Contact[]> {
    const query = this.db('contacts').whereNull('deletedAt');
    if (email) query.orWhere('email', email);
    if (phoneNumber) query.orWhere('phoneNumber', phoneNumber);
    return await query.orderBy('createdAt', 'asc');
  }

  async findContactsByLinkedId(linkedId: number): Promise<Contact[]> {
    return await this.db('contacts')
      .where(function (this: Knex.QueryBuilder) {
        this.where('id', linkedId).orWhere('linkedId', linkedId);
      })
      .andWhere('deletedAt', null)
      .orderBy('createdAt', 'asc');
  }

  async createContact(contact: {
    email?: string;
    phoneNumber?: string;
    linkedId?: number;
    linkPrecedence: 'primary' | 'secondary';
  }): Promise<number> {
    const [id] = await this.db('contacts').insert(contact).returning('id');
    return typeof id === 'object' ? id.id : id;
  }

  async updateContact(id: number, updates: Partial<Contact>): Promise<void> {
    updates.updatedAt = new Date();
    await this.db('contacts').where({ id }).update(updates);
  }

  async getAllContacts(): Promise<Contact[]> {
    return await this.db('contacts').whereNull('deletedAt').orderBy('createdAt', 'asc');
  }

  async close(): Promise<void> {
    await this.db.destroy();
  }
}
// If you see type errors for 'knex', run: npm install --save-dev @types/knex 
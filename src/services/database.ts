import sqlite3 from 'sqlite3';
import { Contact, ContactRow } from '../types';

export class DatabaseService {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(':memory:', (err: Error | null) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        this.initializeTables();
      }
    });
  }

  private initializeTables(): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phoneNumber TEXT,
        email TEXT,
        linkedId INTEGER,
        linkPrecedence TEXT CHECK(linkPrecedence IN ('primary', 'secondary')) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        deletedAt DATETIME,
        FOREIGN KEY (linkedId) REFERENCES contacts(id)
      )
    `;

          this.db.run(createTableSQL, (err: Error | null) => {
        if (err) {
          console.error('Error creating table:', err);
        } else {
          console.log('Contacts table created successfully');
        }
      });
  }

  async findContactsByEmailOrPhone(email?: string, phoneNumber?: string): Promise<Contact[]> {
    return new Promise((resolve, reject) => {
      const conditions: string[] = [];
      const params: any[] = [];

      if (email) {
        conditions.push('email = ?');
        params.push(email);
      }

      if (phoneNumber) {
        conditions.push('phoneNumber = ?');
        params.push(phoneNumber);
      }

      if (conditions.length === 0) {
        resolve([]);
        return;
      }

      const whereClause = conditions.join(' OR ');
      const sql = `SELECT * FROM contacts WHERE ${whereClause} AND deletedAt IS NULL`;

      this.db.all(sql, params, (err, rows: ContactRow[]) => {
        if (err) {
          reject(err);
        } else {
          const contacts: Contact[] = rows.map(row => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined
          }));
          resolve(contacts);
        }
      });
    });
  }

  async findContactsByLinkedId(linkedId: number): Promise<Contact[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM contacts 
        WHERE (id = ? OR linkedId = ?) AND deletedAt IS NULL
        ORDER BY createdAt ASC
      `;

      this.db.all(sql, [linkedId, linkedId], (err, rows: ContactRow[]) => {
        if (err) {
          reject(err);
        } else {
          const contacts: Contact[] = rows.map(row => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined
          }));
          resolve(contacts);
        }
      });
    });
  }

  async createContact(contact: {
    email?: string | undefined;
    phoneNumber?: string | undefined;
    linkedId?: number | undefined;
    linkPrecedence: 'primary' | 'secondary';
  }): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO contacts (phoneNumber, email, linkedId, linkPrecedence)
        VALUES (?, ?, ?, ?)
      `;

      this.db.run(sql, [contact.phoneNumber, contact.email, contact.linkedId, contact.linkPrecedence], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async updateContact(id: number, updates: Partial<Contact>): Promise<void> {
    return new Promise((resolve, reject) => {
      const setClause: string[] = [];
      const params: any[] = [];

      if (updates.linkedId !== undefined) {
        setClause.push('linkedId = ?');
        params.push(updates.linkedId);
      }

      if (updates.linkPrecedence !== undefined) {
        setClause.push('linkPrecedence = ?');
        params.push(updates.linkPrecedence);
      }

      setClause.push('updatedAt = CURRENT_TIMESTAMP');
      params.push(id);

      const sql = `UPDATE contacts SET ${setClause.join(', ')} WHERE id = ?`;

      this.db.run(sql, params, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getAllContacts(): Promise<Contact[]> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM contacts WHERE deletedAt IS NULL ORDER BY createdAt ASC';

      this.db.all(sql, [], (err, rows: ContactRow[]) => {
        if (err) {
          reject(err);
        } else {
          const contacts: Contact[] = rows.map(row => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined
          }));
          resolve(contacts);
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
} 
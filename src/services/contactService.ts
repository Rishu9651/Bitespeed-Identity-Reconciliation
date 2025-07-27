import { DatabaseService } from './database';
import { Contact, IdentifyRequest, IdentifyResponse } from '../types';

export class ContactService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async identifyContact(request: IdentifyRequest): Promise<IdentifyResponse> {
    const { email, phoneNumber } = request;

    // If no email or phone provided, return error
    if (!email && !phoneNumber) {
      throw new Error('Either email or phoneNumber must be provided');
    }

    // Find existing contacts that match the provided email or phone
    const existingContacts = await this.db.findContactsByEmailOrPhone(email, phoneNumber);

    if (existingContacts.length === 0) {
      // No existing contacts found, create a new primary contact
      const newContactId = await this.db.createContact({
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        linkPrecedence: 'primary'
      });

      return {
        contact: {
          primaryContatctId: newContactId,
          emails: email ? [email] : [],
          phoneNumbers: phoneNumber ? [phoneNumber] : [],
          secondaryContactIds: []
        }
      };
    }

    // Find all linked contacts (including the ones we just found)
    const allLinkedContacts = await this.getAllLinkedContacts(existingContacts);

    // Determine the primary contact (oldest one)
    const primaryContact = allLinkedContacts.reduce((oldest, current) => 
      current.createdAt < oldest.createdAt ? current : oldest
    );

    // Check if we need to create a new secondary contact
    const needsNewContact = this.shouldCreateNewContact(allLinkedContacts, email, phoneNumber);

    if (needsNewContact) {
      const newContactId = await this.db.createContact({
        email,
        phoneNumber,
        linkedId: primaryContact.id,
        linkPrecedence: 'secondary'
      });

      // Update the response to include the new contact
      allLinkedContacts.push({
        id: newContactId,
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        linkedId: primaryContact.id,
        linkPrecedence: 'secondary',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined
      });
    }

    // Prepare response
    const emails = this.extractUniqueEmails(allLinkedContacts);
    const phoneNumbers = this.extractUniquePhoneNumbers(allLinkedContacts);
    const secondaryContactIds = allLinkedContacts
      .filter(contact => contact.id !== primaryContact.id)
      .map(contact => contact.id);

    return {
      contact: {
        primaryContatctId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds
      }
    };
  }

  private async getAllLinkedContacts(contacts: Contact[]): Promise<Contact[]> {
    const allContacts = new Set<number>();
    const contactMap = new Map<number, Contact>();

    // Add all provided contacts to the set
    for (const contact of contacts) {
      allContacts.add(contact.id);
      contactMap.set(contact.id, contact);
    }

    // Find all linked contacts recursively
    for (const contact of contacts) {
      if (contact.linkedId) {
        await this.addLinkedContacts(contact.linkedId, allContacts, contactMap);
      }
      
      // Also find contacts that link to this one
      const linkedToThis = await this.db.findContactsByLinkedId(contact.id);
      for (const linkedContact of linkedToThis) {
        allContacts.add(linkedContact.id);
        contactMap.set(linkedContact.id, linkedContact);
      }
    }

    return Array.from(contactMap.values());
  }

  private async addLinkedContacts(
    linkedId: number, 
    allContacts: Set<number>, 
    contactMap: Map<number, Contact>
  ): Promise<void> {
    if (allContacts.has(linkedId)) {
      return; // Already processed
    }

    const linkedContacts = await this.db.findContactsByLinkedId(linkedId);
    for (const contact of linkedContacts) {
      allContacts.add(contact.id);
      contactMap.set(contact.id, contact);
      
      if (contact.linkedId && !allContacts.has(contact.linkedId)) {
        await this.addLinkedContacts(contact.linkedId, allContacts, contactMap);
      }
    }
  }

  private shouldCreateNewContact(
    existingContacts: Contact[], 
    email?: string, 
    phoneNumber?: string
  ): boolean {
    // Check if the email or phone already exists in any of the linked contacts
    const existingEmails = existingContacts.map(c => c.email).filter(Boolean);
    const existingPhones = existingContacts.map(c => c.phoneNumber).filter(Boolean);

    const emailExists = email && existingEmails.includes(email);
    const phoneExists = phoneNumber && existingPhones.includes(phoneNumber);

    // Create new contact if we have new information
    return Boolean((email && !emailExists) || (phoneNumber && !phoneExists));
  }

  private extractUniqueEmails(contacts: Contact[]): string[] {
    const emails = contacts
      .map(contact => contact.email)
      .filter((email): email is string => email !== undefined && email !== null);
    
    return [...new Set(emails)];
  }

  private extractUniquePhoneNumbers(contacts: Contact[]): string[] {
    const phoneNumbers = contacts
      .map(contact => contact.phoneNumber)
      .filter((phone): phone is string => phone !== undefined && phone !== null);
    
    return [...new Set(phoneNumbers)];
  }
} 
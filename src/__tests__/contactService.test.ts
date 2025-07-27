import { DatabaseService } from '../services/database';
import { ContactService } from '../services/contactService';

describe('ContactService', () => {
  let db: DatabaseService;
  let contactService: ContactService;

  beforeEach(() => {
    db = new DatabaseService();
    contactService = new ContactService(db);
  });

  afterEach(async () => {
    await db.close();
  });

  describe('identifyContact', () => {
    it('should create a new primary contact when no existing contacts found', async () => {
      const request = {
        email: 'lorraine@hillvalley.edu',
        phoneNumber: '123456'
      };

      const result = await contactService.identifyContact(request);

      expect(result.contact.primaryContatctId).toBe(1);
      expect(result.contact.emails).toEqual(['lorraine@hillvalley.edu']);
      expect(result.contact.phoneNumbers).toEqual(['123456']);
      expect(result.contact.secondaryContactIds).toEqual([]);
    });

    it('should create a secondary contact when matching phone number found', async () => {
      // First request - creates primary contact
      await contactService.identifyContact({
        email: 'lorraine@hillvalley.edu',
        phoneNumber: '123456'
      });

      // Second request - should create secondary contact
      const result = await contactService.identifyContact({
        email: 'mcfly@hillvalley.edu',
        phoneNumber: '123456'
      });

      expect(result.contact.primaryContatctId).toBe(1);
      expect(result.contact.emails).toEqual(['lorraine@hillvalley.edu', 'mcfly@hillvalley.edu']);
      expect(result.contact.phoneNumbers).toEqual(['123456']);
      expect(result.contact.secondaryContactIds).toEqual([2]);
    });

    it('should link two separate primary contacts when they share information', async () => {
      // Create first primary contact
      await contactService.identifyContact({
        email: 'george@hillvalley.edu',
        phoneNumber: '919191'
      });

      // Create second primary contact
      await contactService.identifyContact({
        email: 'biffsucks@hillvalley.edu',
        phoneNumber: '717171'
      });

      // Link them by providing both email and phone from different contacts
      const result = await contactService.identifyContact({
        email: 'george@hillvalley.edu',
        phoneNumber: '717171'
      });

      expect(result.contact.primaryContatctId).toBe(1); // Oldest contact becomes primary
      expect(result.contact.emails).toEqual(['george@hillvalley.edu', 'biffsucks@hillvalley.edu']);
      expect(result.contact.phoneNumbers).toEqual(['919191', '717171']);
      expect(result.contact.secondaryContactIds).toEqual([2]);
    });

    it('should return error when neither email nor phone provided', async () => {
      await expect(contactService.identifyContact({}))
        .rejects
        .toThrow('Either email or phoneNumber must be provided');
    });
  });
}); 
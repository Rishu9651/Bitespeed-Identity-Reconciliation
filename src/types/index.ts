export interface Contact {
  id: number;
  phoneNumber?: string | undefined;
  email?: string | undefined;
  linkedId?: number | undefined;
  linkPrecedence: 'primary' | 'secondary';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | undefined;
}

export interface IdentifyRequest {
  email?: string;
  phoneNumber?: string;
}

export interface IdentifyResponse {
  contact: {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export interface ContactRow {
  id: number;
  phoneNumber?: string;
  email?: string;
  linkedId?: number;
  linkPrecedence: 'primary' | 'secondary';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
} 
# Bitespeed Contact Identification Service

A web service that helps identify and link customer contacts across multiple purchases, solving the challenge of tracking customers who use different email addresses and phone numbers for each order.

## 🚀 Features

- **Contact Identification**: Automatically identifies customers based on email or phone number
- **Contact Linking**: Links multiple contact records that share common information
- **Primary/Secondary Hierarchy**: Maintains a clear hierarchy with the oldest contact as primary
- **RESTful API**: Clean, well-documented API endpoints
- **TypeScript**: Full type safety and modern development experience
- **SQLite Database**: Lightweight, file-based database for easy deployment

## 🛠️ Tech Stack

- **Backend**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite3
- **Security**: Helmet.js for security headers
- **Logging**: Morgan for HTTP request logging

## 📋 Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd bitespeed-contact-service
```

### 2. Install dependencies
```bash
npm install
```

### 3. Build the project
```bash
npm run build
```

### 4. Start the server
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

#### 2. Identify Contact
```
POST /identify
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```

**Note:** At least one of `email` or `phoneNumber` must be provided.

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["1234567890", "0987654321"],
    "secondaryContactIds": [2, 3]
  }
}
```

## 🧪 Examples

### Example 1: New Customer
**Request:**
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

### Example 2: Existing Customer with New Information
**Request:**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

### Example 3: Linking Two Separate Contacts
**Request:**
```json
{
  "email": "george@hillvalley.edu",
  "phoneNumber": "717171"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 11,
    "emails": ["george@hillvalley.edu", "biffsucks@hillvalley.edu"],
    "phoneNumbers": ["919191", "717171"],
    "secondaryContactIds": [27]
  }
}
```

## 🗄️ Database Schema

The service uses a `contacts` table with the following structure:

```sql
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phoneNumber TEXT,
  email TEXT,
  linkedId INTEGER,
  linkPrecedence TEXT CHECK(linkPrecedence IN ('primary', 'secondary')) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  deletedAt DATETIME,
  FOREIGN KEY (linkedId) REFERENCES contacts(id)
);
```

## 🔧 Configuration

The application can be configured using environment variables:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

## 🧪 Testing

Run tests:
```bash
npm test
```

## 📦 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Optional)
```bash
docker build -t bitespeed-contact-service .
docker run -p 3000:3000 bitespeed-contact-service
```

## 🔍 How It Works

1. **Contact Identification**: When a request comes in, the service searches for existing contacts that match the provided email or phone number.

2. **Contact Linking**: If multiple contacts are found, they are linked together based on shared information (email or phone).

3. **Primary Contact**: The oldest contact (by creation date) becomes the primary contact, while others become secondary.

4. **New Contact Creation**: If new information is provided, a secondary contact is created and linked to the primary contact.

5. **Response Consolidation**: The service returns a consolidated view with all emails, phone numbers, and secondary contact IDs.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please open an issue in the repository.

---

**Note:** This service is designed to handle the specific use case described in the Bitespeed challenge, where customers may use different contact information for each purchase but need to be identified as the same person for personalized customer experience. 
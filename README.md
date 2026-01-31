# Clarity Hub

Customer Intelligence Platform for getclarity.ai - A centralized hub for viewing customer and prospect information with AI-powered insights.

## Features

- **Company Dashboard**: View all customers and prospects in one place
- **Comprehensive Data**: Store meeting transcripts, email exchanges, and documents
- **AI-Powered Q&A**: Ask questions about any customer and get evidence-based answers using Google Gemini Pro
- **Admin Panel**: Add and manage companies, upload content
- **Role-Based Access**: Admin and employee roles with appropriate permissions

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **AI**: Google Gemini Pro API
- **Deployment**: Render

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Google Gemini API Key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/clarity-hub.git
cd clarity-hub
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your values:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/clarity_hub
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
```

4. Create the database:
```bash
createdb clarity_hub
```

5. Run migrations:
```bash
npm run db:migrate
```

6. Seed initial data:
```bash
npm run db:seed
```

7. Start the development server:
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Default Credentials

- **Admin**: admin@getclarity.ai / admin123
- **Employee**: employee@getclarity.ai / employee123

## Deployment on Render

1. Push your code to GitHub

2. Connect your GitHub repo to Render

3. Use the `render.yaml` Blueprint to automatically set up:
   - PostgreSQL database
   - Web service

4. Add your `GEMINI_API_KEY` in Render's environment variables

5. After deployment, run migrations:
```bash
# In Render Shell
npm run db:migrate
npm run db:seed
```

## Project Structure

```
clarity-hub/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand state stores
│   │   ├── types/          # TypeScript types
│   │   └── lib/            # Utilities
│   └── ...
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── db/             # Database config & migrations
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── types/          # TypeScript types
│   └── ...
├── render.yaml             # Render deployment config
└── package.json            # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Register new user (admin only)

### Companies
- `GET /api/companies` - List all companies
- `GET /api/companies/:id` - Get company details
- `POST /api/companies` - Create company (admin only)
- `PUT /api/companies/:id` - Update company (admin only)
- `DELETE /api/companies/:id` - Delete company (admin only)

### Transcripts
- `GET /api/transcripts/company/:companyId` - List transcripts
- `GET /api/transcripts/:id` - Get transcript
- `POST /api/transcripts` - Create transcript (admin only)
- `PUT /api/transcripts/:id` - Update transcript (admin only)
- `DELETE /api/transcripts/:id` - Delete transcript (admin only)

### Emails
- `GET /api/emails/company/:companyId` - List emails
- `GET /api/emails/:id` - Get email
- `POST /api/emails` - Create email (admin only)
- `PUT /api/emails/:id` - Update email (admin only)
- `DELETE /api/emails/:id` - Delete email (admin only)

### Documents
- `GET /api/documents/company/:companyId` - List documents
- `GET /api/documents/:id` - Get document
- `POST /api/documents` - Create document (admin only)
- `PUT /api/documents/:id` - Update document (admin only)
- `DELETE /api/documents/:id` - Delete document (admin only)

### AI
- `POST /api/ai/ask` - Ask a question about a company
- `GET /api/ai/history/:companyId` - Get chat history

## Initial Data

The seed script creates:
- **Deel** (Customer): Your first customer with sample transcript and email
- **Robinhood** (Prospect): First prospect with sample transcript and proposal

## License

MIT

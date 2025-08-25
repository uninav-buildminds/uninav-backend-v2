# **UniNav Backend**

## **Overview**

UniNav is a **university study materials platform** that enables students to **upload, access, and share academic resources** organized by Faculty, Department, and Course. It includes **blog monetization, role-based access controls, and comprehensive file management**.

This repository contains the **backend API** built with **NestJS**, handling:

- **User authentication** via student emails and Google OAuth
- **Study materials management** with secure file uploads to Idrive e2
- **Role-based access (Students, Moderators, Admins)**
- **Blog system with monetization for contributors**
- **Review and moderation system**
- **Email notifications with multiple provider fallbacks**
- **Collection management for organizing materials**

---

## **Tech Stack** ⚙️

### **Core Backend Technologies**

| Technology             | Purpose                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| **NestJS**             | Progressive Node.js framework for scalable server-side applications |
| **TypeScript**         | Type-safe JavaScript for better development experience              |
| **PostgreSQL**         | Primary relational database for data persistence                    |
| **Drizzle ORM**        | Type-safe SQL toolkit with excellent TypeScript support             |
| **JWT Authentication** | Secure token-based authentication with refresh tokens               |
| **Passport.js**        | Authentication middleware with Google OAuth support                 |
| **Class Validator**    | Schema validation for API requests and responses                    |
| **Helmet**             | Security middleware for Express applications                        |

### **File Storage & Management**

| Technology     | Purpose                                                    |
| -------------- | ---------------------------------------------------------- |
| **Idrive e2**  | Cloud storage for study materials, media, and blog content |
| **AWS SDK v3** | S3-compatible client for Idrive e2 integration             |
| **Multer**     | File upload middleware for handling multipart/form-data    |

### **Email Services**

| Technology             | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| **Nodemailer (Gmail)** | Primary email provider with OAuth2 authentication |
| **Resend**             | Modern email API as primary fallback              |
| **MailerSend**         | Secondary email provider for high deliverability  |
| **Brevo**              | Tertiary email provider for additional redundancy |
| **EJS Templates**      | Email template rendering engine                   |

### **Development & Testing**

| Technology            | Purpose                                  |
| --------------------- | ---------------------------------------- |
| **Jest**              | Testing framework for unit and e2e tests |
| **ESLint + Prettier** | Code linting and formatting              |
| **Drizzle Kit**       | Database migration and schema management |
| **Pino**              | High-performance logging                 |

---

## **Architecture & Features** 🏗️

### **Database Schema**

The application uses **PostgreSQL** with **Drizzle ORM** and includes the following core entities:

- **Users** - Student accounts with role-based permissions
- **Faculties** - University faculties
- **Departments** - Academic departments within faculties
- **Courses** - Individual courses with course codes
- **Materials** - Study resources with metadata and file storage
- **Collections** - Organized groups of materials
- **Blogs** - Content creation with monetization
- **Reviews** - User feedback and ratings
- **Adverts** - Promotional content management
- **Moderators & Admins** - Administrative roles

### **Authentication & Authorization**

- **JWT-based authentication** with secure token management
- **Google OAuth 2.0** integration for seamless login
- **Role-based access control** (Student, Moderator, Admin)
- **Password hashing** with bcrypt and pepper
- **Cookie-based session management**

### **File Management System**

- **Idrive e2** cloud storage with separate buckets for:
  - `uninav-docs` - Study materials and documents
  - `uninav-media` - Images and media files
  - `uninav-blogs` - Blog content and assets
- **Presigned URLs** for secure file access
- **Automatic file expiration** for temporary access
- **File type validation** and security checks

### **Email System**

Multi-provider email service with automatic fallback:

1. **Resend** (Primary)
2. **Nodemailer/Gmail** (Secondary)
3. **MailerSend** (Tertiary)
4. **Brevo** (Quaternary)

**Email Types:**

- Account verification
- Password reset
- Material approval/rejection notifications
- Blog moderation alerts
- Course rejection notifications

---

## **Security Measures** 🔐

✅ **Helmet.js** – Security headers and CSP configuration

✅ **CORS Configuration** – Restricted to authorized frontend domains

✅ **JWT Authentication** – Secure token-based sessions

✅ **Input Validation** – Class-validator with whitelist approach

✅ **Password Security** – Bcrypt hashing with salt rounds and pepper

✅ **File Upload Security** – Type validation and size limits

✅ **Environment Variables** – Secure credential management

✅ **SQL Injection Prevention** – Drizzle ORM with parameterized queries

---

## **API Documentation** 📚

The API is documented using **Swagger/OpenAPI** and includes:

- **Authentication endpoints** (login, register, OAuth)
- **User management** (profiles, roles, permissions)
- **Material management** (upload, download, search)
- **Collection management** (create, organize, share)
- **Blog system** (create, publish, monetize)
- **Review system** (ratings, feedback)
- **Admin endpoints** (moderation, analytics)

---

## **Environment Configuration** ⚙️

### **Required Environment Variables**

Check .env-example

---

## **Getting Started** 🚀

### **Prerequisites**

- **Node.js v22.16.0** or higher
- **pnpm v10.14.0** or higher
- **PostgreSQL** database
- **Idrive e2** account for file storage

### **Installation**

```bash
# Clone the repository
git clone <repository-url>
cd uninav-backend

# Install dependencies
pnpm install

# Copy environment file
cp .env-example .env

# Configure your environment variables
# Edit .env with your actual values

# Generate database schema
pnpm run db:generate

# Push schema to database
pnpm run db:push

# Seed initial data (optional)
pnpm run db:seed

# Start development server
pnpm run dev
```

### **Database Management**

```bash
# Generate migrations
pnpm run db:generate

# Push schema changes
pnpm run db:push

# Run migrations
pnpm run db:migrate

# Open Drizzle Studio
pnpm run db:studio

# Drop database (development only)
pnpm run db:drop
```

### **Testing**

```bash
# Run unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run e2e tests
pnpm run test:e2e

# Generate coverage report
pnpm run test:cov
```

---

## **Deployment** 🌐

### **Supported Platforms**

- **Railway** (recommended)

---

## **Contributing** 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Code Style**

- Follow **TypeScript** best practices
- Use **ESLint** and **Prettier** for code formatting
- Follow **NestJS** conventions and patterns

---

## **License** 📄

This project is licensed under the **UNLICENSED** license - see the [LICENSE](LICENSE) file for details.

---

## **Support** 💬

For support and questions:

- **Issues**: Create an issue in the GitHub repository
- **Documentation**: Check the inline code documentation
- **API Docs**: Available at `/api` endpoint when running locally

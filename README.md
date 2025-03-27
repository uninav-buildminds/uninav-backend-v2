# **UniNav Backend**

# **Overview**

UniNav is a **university study materials platform** that enables students to **upload, access, and share academic resources** organized by Faculty, Department, and Course. It also includes **WhatsApp-based study group recommendations, a monetization system, and role-based access controls** .

This repository contains the **backend API** built with **Node.js** , handling:

- **User authentication** via student emails
- **Study materials management** with secure file uploads
- **Role-based access (Students, Moderators, Admins)**
- **Monetization system for bloggers and contributors**
- **WhatsApp study group listings & verification**
- **Email notifications for verification and updates**

---

## **Tech Stack** ⚙️

### **Core Backend Technologies**

| Technology                                           | Purpose                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- |
| **Node.js + Express.js**                             | Fast, scalable REST API backend                         |
| **MongoDB / PostgreSQL**                             | Stores users, materials, study groups, and transactions |
| **Prisma (for PostgreSQL) / Mongoose (for MongoDB)** | ORM/ODM for database interactions                       |
| **JWT Authentication**                               | Secure token-based authentication                       |
| **Zod / Joi**                                        | Schema validation for API requests                      |
| **Nodemailer + Gmail / Brevo (fallback)**            | Email verification and notifications                    |
| **Backblaze B2**                                     | Secure and scalable storage for study materials         |
| **Redis**                                            | Caching for performance improvements                    |
| **BullMQ / Agenda**                                  | Background jobs (e.g., email scheduling, cleanup tasks) |

## **Security Measures 🔐**

✅ **JWT Authentication** – Secures API endpoints

✅ **Rate Limiting (Express-Rate-Limit)** – Prevents abuse (e.g., login attempts)

✅ **CORS Configuration** – Restricts access to frontend only

✅ **Environment Variables (.env)** – Stores sensitive credentials

✅ **Validation Middleware (Zod/Joi)** – Prevents invalid API requests

---

## **Storage & File Management** 📂

### **File Uploads (Backblaze B2)**

- All study materials (PDFs, DOCs) are **stored in Backblaze B2** .
- Users upload files via **presigned URLs** to prevent direct server overload.
- Moderators review flagged files before deletion.

---

## **Email Notifications (Verification & Alerts) 📧**

- **Primary Provider:** Nodemailer (Gmail)
- **Fallback Provider:** Brevo (when Gmail limits are reached)
- **Triggers:**
  - Email verification
  - Moderator notifications
  - Withdrawal processing alerts

---

## **Background Jobs & Optimization ⚡**

- **Redis & BullMQ** – Used for handling scheduled tasks (e.g., auto-expiring inactive study groups).
- **Caching with Redis** – Frequently accessed data (e.g., top study materials) is cached for fast retrieval.

---

## **Deployment & CI/CD 🚀**

- **Hosting:** Railway, Render, or DigitalOcean
- **Database:** Managed PostgreSQL (Supabase / PlanetScale)
- **Storage:** Backblaze B2

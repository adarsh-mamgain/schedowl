# 🦉 SchedOwl

<div align="center">

![SchedOwl Logo](public/SchedOwl%20Logo.svg)

**The Open-Source Social Media Scheduling Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.3.0-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC)](https://tailwindcss.com/)

_Schedule, publish, and analyze your social media content with AI-powered insights_

</div>

---

## ✨ Features

### 🚀 **Smart Scheduling**

- **Multi-platform Support**: Schedule posts for LinkedIn, Twitter, and more
- **AI-Powered Content**: Generate engaging content with AI assistance
- **Visual Calendar**: Drag-and-drop scheduling with calendar view
- **Bulk Scheduling**: Schedule multiple posts at once

### 📊 **Advanced Analytics**

- **Performance Tracking**: Monitor likes, comments, shares, and engagement
- **Real-time Insights**: Get detailed analytics for your social media posts
- **LinkedIn Integration**: Deep analytics for LinkedIn content
- **Custom Reports**: Generate comprehensive performance reports

### 🤖 **AI Features**

- **Content Generation**: AI-powered post creation and optimization
- **Smart Suggestions**: Get recommendations for optimal posting times
- **Engagement Analysis**: Understand what content performs best
- **Token-based System**: Flexible AI usage with token management

### 👥 **Team Collaboration**

- **Multi-workspace Support**: Manage multiple brands and projects
- **Member Management**: Invite team members with role-based permissions
- **Approval Workflows**: Review and approve content before publishing
- **Real-time Collaboration**: Work together on content creation

### 🔧 **Developer Friendly**

- **Open Source**: Full source code available under MIT license
- **Modern Stack**: Built with Next.js 15, TypeScript, and Prisma
- **Extensible**: Easy to customize and extend
- **Self-hosted**: Deploy on your own infrastructure

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **AI Integration**: Google Gemini AI
- **File Storage**: MinIO (S3-compatible)
- **Payments**: DodoPayments integration
- **Email**: Nodemailer with custom templates
- **Monitoring**: Winston logging, Prometheus metrics
- **Deployment**: PM2 process management

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database
- MinIO instance (for file storage)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/adarsh-mamgain/schedowl.git
   cd schedowl
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables in `.env.local`:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/schedowl"

   # Authentication
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # AI
   GOOGLE_AI_API_KEY="your-gemini-api-key"

   # File Storage
   MINIO_ENDPOINT="localhost"
   MINIO_PORT="9000"
   MINIO_ACCESS_KEY="your-access-key"
   MINIO_SECRET_KEY="your-secret-key"
   MINIO_BUCKET="schedowl"

   # Email
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

4. **Set up the database**

   ```bash
   pnpm prisma generate
   pnpm prisma migrate deploy
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📖 Documentation

### Project Structure

```
schedowl/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── (global)/        # Protected routes
│   │   │   ├── dashboard/   # Main dashboard
│   │   │   ├── calendar/    # Scheduling calendar
│   │   │   ├── drafts/      # Content management
│   │   │   └── settings/    # User settings
│   │   └── api/            # API routes
│   ├── components/         # Reusable components
│   ├── lib/               # Utility functions
│   ├── services/          # External service integrations
│   ├── workers/           # Background job workers
│   └── types/             # TypeScript type definitions
├── prisma/               # Database schema and migrations
└── public/              # Static assets
```

### Key Features Implementation

- **Social Media Integration**: `/src/services/linkedin.ts`
- **AI Content Generation**: `/src/app/api/ai/generate/route.ts`
- **Background Workers**: `/src/workers/scheduler-worker.ts`
- **Analytics**: `/src/app/api/analytics/linkedin/route.ts`

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Add TypeScript types for new features
- Include tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

### Code of Conduct

This project is committed to providing a welcoming and inclusive environment for all contributors. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) for details.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The MIT License is a permissive license that allows you to:

- Use the software for any purpose
- Modify the software
- Distribute the software
- Distribute modified versions
- Use it commercially

---

## 🆘 Support

### Community Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/adarsh-mamgain/schedowl/issues)
- **Discussions**: [Join community discussions](https://github.com/adarsh-mamgain/schedowl/discussions)

### Commercial Support

For enterprise users and commercial support, please contact us at support@schedowl.com

---

## 🙏 Acknowledgments

- **Next.js Team** for the amazing React framework
- **Prisma Team** for the excellent database toolkit
- **Vercel** for the deployment platform
- **All Contributors** who have helped make SchedOwl better

---

## 📊 Project Status

![GitHub stars](https://img.shields.io/github/stars/yourusername/schedowl)
![GitHub forks](https://img.shields.io/github/forks/yourusername/schedowl)
![GitHub issues](https://img.shields.io/github/issues/yourusername/schedowl)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/schedowl)

---

<div align="center">

**Made with ❤️ by the SchedOwl Community**

[Star on GitHub](https://github.com/adarsh-mamgain/schedowl) • [Report Bug](https://github.com/adarsh-mamgain/schedowl/issues) • [Request Feature](https://github.com/adarsh-mamgain/schedowl/issues)

</div>

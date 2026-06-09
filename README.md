# Arza E-Commerce

Full-stack e-commerce platform with a .NET 8 backend API and Angular 18 frontend.

## Tech Stack

**Backend** (.NET 8, C#)
- ASP.NET Core Web API
- Entity Framework Core + SQL Server
- ASP.NET Core Identity (JWT auth)
- AutoMapper, Serilog, Redis caching

**Frontend** (Angular 18, TypeScript)
- Tailwind CSS + Angular CDK
- Quill rich text editor
- Chart.js dashboards

## Project Structure

```
├── ECommerce.API/              # API controllers, middleware, DI
├── ECommerce.Core/             # Entities, DTOs, interfaces, specs
├── ECommerce.Infrastructure/   # EF Core, services, migrations
├── ECommerce.View/             # Angular frontend
│   └── src/app/
│       ├── core/               # Singleton services, HTTP, models
│       ├── shared/             # Reusable components
│       ├── features/           # Public-facing feature modules
│       ├── admin/              # Admin dashboard module
│       ├── layout/             # Navbar, footer
│       └── guards/             # Route guards
└── ECommerce.Core.Tests/       # Unit tests
```

## Getting Started

### Backend
```bash
cd ECommerce.API
dotnet restore
dotnet run
```

### Frontend
```bash
cd ECommerce.View
npm install
npm start
```

### Environment
Update `ECommerce.View/src/environments/environment.ts` to set the base API URL.

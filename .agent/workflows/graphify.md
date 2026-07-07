---
description: Generate a project structure graph and dependency diagram for the workspace
---

# Graphify — Project Structure & Dependency Graph Generator

When this workflow is invoked, generate a comprehensive visual map of the project at the given path (`.` = current workspace root).

## Steps

1. **Discover the solution & projects**
   - Find all `.sln` files in the target directory. Parse them for project entries.
   - Find all `.csproj` and `package.json` files (excluding `node_modules`, `bin`, `obj`).
   - Identify each project's type: `.NET Web API`, `.NET Class Library`, `.NET Test`, `Angular/React/Node`, etc.

2. **Parse project references (edges)**
   - For each `.csproj`, extract `<ProjectReference>` elements to build a directed dependency graph.
   - For frontend projects, note any `proxy.conf.json` or API base URL config that links them to a backend.

3. **Parse external package dependencies**
   - For `.csproj` files: extract every `<PackageReference>` with `Include` and `Version`.
   - For `package.json` files: extract `dependencies` and `devDependencies`.

4. **Map folder structure per project**
   - List top-level source directories in each project (e.g., `Controllers/`, `Services/`, `Entities/`, `src/app/`).
   - Ignore build artifacts: `bin/`, `obj/`, `node_modules/`, `dist/`, `.angular/`.
   - Show the count of files in each folder.

5. **Generate the output Markdown artifact**

   Write a file called `project-graph.md` to the artifact directory with the following sections:

   ### a) Solution Overview (Mermaid Flowchart)
   A `mermaid` flowchart showing:
   - Each project as a styled node (different shapes/colors for API, Core/Library, Infrastructure, Tests, Frontend)
   - Directed edges for `ProjectReference` dependencies
   - A note showing the target framework for each project

   Example style:
   ```
   graph TD
     API["🌐 ECommerce.API<br/>.NET 10 Web API"]
     Core["📦 ECommerce.Core<br/>.NET 10 Library"]
     Infra["🔧 ECommerce.Infrastructure<br/>.NET 10 Library"]
     Tests["🧪 ECommerce.Core.Tests<br/>.NET 10 xUnit"]
     View["🎨 ECommerce.View<br/>Angular Frontend"]

     API --> Core
     API --> Infra
     Infra --> Core
     Tests --> Core
     View -.->|HTTP/Proxy| API
   ```

   ### b) NuGet / npm Dependency Tables
   For each project, a Markdown table:
   | Package | Version | Type |
   |---------|---------|------|
   
   Where Type is `NuGet`, `npm`, or `npm-dev`.

   ### c) Folder Structure Tree
   A code block showing each project's folder layout, like:
   ```
   ECommerce.API/
   ├── Controllers/ (12 files)
   ├── Middleware/ (5 files)
   ├── Extensions/ (3 files)
   └── Services/ (2 files)
   ```

   ### d) Architecture Summary
   A brief paragraph describing:
   - The overall architecture pattern (e.g., Clean Architecture, N-Tier)
   - The responsibility of each project/layer
   - How the frontend connects to the backend

6. **Present the artifact to the user**
   - Use `notify_user` with the generated `project-graph.md` in `PathsToReview`.

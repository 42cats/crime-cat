# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/32c06fd0-e17a-4bdf-b85f-d526954137a9

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_API_TIMEOUT=30000

# Authentication
VITE_AUTH_CLIENT_ID=your-discord-client-id
VITE_AUTH_REDIRECT_URI=http://localhost:3000/login
VITE_AUTH_SCOPE=identify email guilds

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_PREMIUM_FEATURES=false
```

## Database Structure

This application uses a Java Spring Backend API with the following data models:

### Users

```
{
  id: string               // Primary key
  discord_id: string       // Discord user ID
  display_name: string     // User's display name
  avatar: string           // URL to user's avatar
  role: string             // User role (admin, super, regular, visitor)
  created_at: timestamp    // When the user was created
  updated_at: timestamp    // When the user was last updated
}
```

### Commands

```
{
  id: string               // Primary key
  name: string             // Command name
  description: string      // Command description
  usage: string            // Command usage example
  category: string         // Command category
  required_permissions: string[]  // Required Discord permissions
  content: string          // Markdown content with detailed information
  created_by: string       // User ID who created this command
  updated_by: string       // User ID who last updated this command
  created_at: timestamp    // When the command was created
  updated_at: timestamp    // When the command was last updated
}
```

### Themes

```
{
  id: string               // Primary key
  title: string            // Theme title
  thumbnail: string        // URL to theme thumbnail
  description: string      // Theme description
  recommendations: number  // Number of recommendations/likes
  content: string          // Theme content/details in HTML format
  tags: string[]           // Theme tags
  password: string         // Password for editing/deleting the theme
  created_by: string       // User ID who created this theme
  updated_by: string       // User ID who last updated this theme
  created_at: timestamp    // When the theme was created
  updated_at: timestamp    // When the theme was last updated
}
```

### Message Formats

```
{
  id: string               // Primary key
  guild_id: string         // Discord guild (server) ID
  format_type: string      // Type of message format (welcome, goodbye, etc)
  content: string          // Message content in markdown format
  is_enabled: boolean      // Whether this format is enabled
  created_by: string       // User ID who created this format
  updated_by: string       // User ID who last updated this format
  created_at: timestamp    // When the format was created
  updated_at: timestamp    // When the format was last updated
}
```

## API Endpoints

The application uses the following API endpoints:

### Auth

-   `GET /auth/me` - Get current user
-   `GET /users/:userId` - Get user profile
-   `POST /auth/login` - Login with Discord
-   `POST /auth/logout` - Logout
-   `GET /auth/guilds` - Get user's Discord guilds

### Commands

-   `GET /commands` - Get all commands
-   `GET /commands/:id` - Get command by ID
-   `POST /commands` - Create new command (admin/super only)
-   `PUT /commands/:id` - Update command (admin/super only)
-   `DELETE /commands/:id` - Delete command (admin/super only)

### Themes

-   `GET /themes` - Get all themes
-   `GET /themes/:id` - Get theme by ID
-   `POST /themes` - Create new theme (any authenticated user)
-   `PUT /themes/:id` - Update theme (by password or admin/super)
-   `DELETE /themes/:id` - Delete theme (by password or admin/super)

### Message Formats

-   `GET /guilds/:guildId/message-formats` - Get all message formats for a guild
-   `GET /guilds/:guildId/message-formats/:id` - Get message format by ID
-   `POST /guilds/:guildId/message-formats` - Create new message format
-   `PUT /guilds/:guildId/message-formats/:id` - Update message format
-   `DELETE /guilds/:guildId/message-formats/:id` - Delete message format

## User Roles and Permissions

The application supports the following user roles:

1. **Admin**

    - Full access to all features
    - Can create, edit, and delete all content
    - Can access all administration pages

2. **Super User**

    - Can create, edit, and delete commands
    - Can edit and delete themes (no password required)
    - Cannot access user management

3. **Regular User**

    - Can view all content
    - Can create themes with password protection
    - Can edit/delete own themes with password
    - Cannot create, edit, or delete commands

4. **Visitor**
    - Can view all public content
    - Cannot create, edit, or delete any content

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/32c06fd0-e17a-4bdf-b85f-d526954137a9) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

-   Navigate to the desired file(s).
-   Click the "Edit" button (pencil icon) at the top right of the file view.
-   Make your changes and commit the changes.

**Use GitHub Codespaces**

-   Navigate to the main page of your repository.
-   Click on the "Code" button (green button) near the top right.
-   Select the "Codespaces" tab.
-   Click on "New codespace" to launch a new Codespace environment.
-   Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

-   Vite
-   TypeScript
-   React
-   shadcn-ui
-   Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/32c06fd0-e17a-4bdf-b85f-d526954137a9) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

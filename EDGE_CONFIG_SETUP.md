# Vercel Edge Config Store Setup

This application uses Vercel Edge Config Store as the database for institutional flow tracking. Follow these steps to set it up:

## 1. Create Edge Config Store

1. Go to your Vercel Dashboard
2. Navigate to your project
3. Click on the **Storage** tab
4. Click **Create Database** → **Edge Config**
5. Name it `institutional-flows-store`
6. Click **Create**

## 2. Environment Variables

### For Local Development:

Create a `.env.local` file in your project root:

```bash
# Create the environment file
touch .env.local
```

Add these variables to your `.env.local` file:

```bash
# Edge Config connection string (automatically created when you connect Edge Config to your project)
EDGE_CONFIG=https://edge-config.vercel.com/your-edge-config-id?token=your-read-token

# Edge Config ID (found in Vercel Dashboard > Storage > Edge Config)
EDGE_CONFIG_ID=your-edge-config-id

# Vercel API Token (create in Vercel Dashboard > Settings > Tokens)
VERCEL_TOKEN=your-vercel-api-token

# Optional: Team ID if using team-scoped Edge Config
VERCEL_TEAM_ID=your-team-id
```

### For Production (Vercel Dashboard):

Add the same environment variables to your Vercel project:
1. Go to your Vercel Dashboard
2. Select your project  
3. Go to **Settings** → **Environment Variables**
4. Add each variable above

## 3. How to Get the Values

### EDGE_CONFIG (Connection String)
- Automatically created when you connect the Edge Config to your project
- Found in: Dashboard > Storage > Edge Config > Tokens tab
- Copy the connection string from there

### EDGE_CONFIG_ID
- Found in: Dashboard > Storage > Edge Config
- Look for "Edge Config ID" near the top of the page

### VERCEL_TOKEN
- Go to: Dashboard > Settings > Tokens
- Click "Create Token"
- Give it a name like "Edge Config Writer"
- Copy the generated token

## 4. Local Development

Pull the environment variables to your local project:

```bash
vercel env pull
```

## 5. How It Works

- **Reading**: Uses `@vercel/edge-config` SDK for ultra-fast reads
- **Writing**: Uses Vercel REST API for updates
- **Priority System**: Maintains exactly 10 highest priority institutional flows
- **Auto-cleanup**: Removes expired flows (30+ minutes old)

## 6. Database Schema

The Edge Config stores data under the key `institutional-flows` with this structure:

```typescript
{
  flows: InstitutionalFlow[],  // Array of up to 10 flows
  lastUpdated: number         // Timestamp
}
```

Each flow contains:
- Symbol, OI data, priority score, whale rating, etc.
- Automatically sorted by priority score (highest first)
- Maximum 10 flows maintained at all times

## 7. Features

✅ **Priority-based replacement**: New high-priority flows replace low-priority ones  
✅ **Ultra-stable frontend**: No flickering during updates  
✅ **Global edge distribution**: Fast reads worldwide  
✅ **Automatic cleanup**: Removes stale data  
✅ **Real-time updates**: 5-second scan intervals  

## 8. Troubleshooting

- **No data showing**: Check EDGE_CONFIG connection string
- **Can't save data**: Verify VERCEL_TOKEN and EDGE_CONFIG_ID
- **Permission errors**: Ensure token has write access to Edge Config 
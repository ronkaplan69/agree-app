# Mapbox Setup Guide

This app uses Mapbox for displaying interactive world maps. Follow these steps to configure Mapbox.

## Step 1: Create a Mapbox Account

1. Go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. Create a free account (or sign in if you have one)
   account my mail. pass: Uwm$%c3HUqX4ze9
   public token: pk.eyJ1Ijoicm9ua2FwbGFuNjkiLCJhIjoiY21qMGJmc2k4MDB3dzNpcW41ZTRva2t1MCJ9.77z52Tm7f6xlOFTvtvA-HA

secret token: sk.eyJ1Ijoicm9ua2FwbGFuNjkiLCJhIjoiY21qMGMyYzBpMDVpYTNjcnphbnIycnp4NyJ9.Ug_BPX-b7KYFbu0mFenlng

## Step 2: Get Your Access Tokens

You need **two tokens**:

### Public Token (for the app)

- Go to [Access Tokens](https://account.mapbox.com/access-tokens/)
- You'll see a "Default public token" already created
- Copy this token

**Required scopes** (should be checked by default):

- STYLES:TILES
- STYLES:READ
- FONTS:READ
- DATASETS:READ
- VISION:READ

### Secret Token (for SDK downloads)

1. Click **"Create a token"**
2. Name it (e.g., "SDK Downloads")
3. Scroll down to **"Secret scopes"**
4. Check ✅ **Downloads:Read**
5. Click **Create token**
6. **Copy immediately** - it's only shown once!

## Step 3: Configure the Tokens

### Public Token

Edit `src/config/mapbox.ts`:

```typescript
export const MAPBOX_ACCESS_TOKEN = 'pk.your_public_token_here';
```

### Secret Token

Create/edit `~/.netrc` in your **home directory** (NOT in the project):

```
machine api.mapbox.com
login mapbox
password sk.your_secret_token_here
```

Set proper permissions:

```bash
chmod 600 ~/.netrc
```

## Step 4: Install iOS Dependencies

```bash
cd ios
LANG=en_US.UTF-8 pod install
cd ..
```

## Step 5: Run the App

```bash
npx react-native run-ios
```

## Troubleshooting

### Pod install fails with authentication error

- Make sure `~/.netrc` is in your HOME directory, not the project folder
- Verify the secret token has `Downloads:Read` scope
- Check file permissions: `chmod 600 ~/.netrc`

### Map doesn't load / blank screen

- Verify your public token in `src/config/mapbox.ts`
- Check the Mapbox dashboard for any token errors

### "Invalid token" errors

- Ensure you're using the public token (starts with `pk.`) in the app
- Ensure you're using the secret token (starts with `sk.`) in `.netrc`

## Free Tier Limits

Mapbox free tier includes:

- 50,000 map loads/month
- No credit card required

More info: [Mapbox Pricing](https://www.mapbox.com/pricing)

# DDC Integration for Proofi CLI

## Summary

The Proofi CLI now uses **Cere DDC (Decentralized Data Cloud)** as its primary storage backend. Your encrypted health data lives on decentralized infrastructure, not local files.

## What Changed

### 1. New Dependency
- Added `@cere-ddc-sdk/ddc-client` to package.json

### 2. New Module: `src/ddc.js`
Handles all DDC operations:
- `uploadToDdc()` - Upload encrypted data to DDC
- `downloadFromDdc()` - Fetch encrypted data from DDC
- `checkDdcAvailability()` - Check DDC connectivity
- `storeToLocalCache()` / `loadFromLocalCache()` - Fallback for offline mode

### 3. Updated Commands

#### `proofi upload`
- Now uploads to DDC by default
- New flags:
  - `-l, --local` - Store locally only (skip DDC)
  - `-b, --bucket <id>` - Specify DDC bucket ID
- Falls back to local storage if DDC unavailable
- Stores only CID reference locally (not the data itself!)

#### `proofi analyze`
- Fetches encrypted data FROM DDC using stored CID
- Falls back to local cache if DDC unavailable
- Decrypts and analyzes locally (unchanged privacy model)

#### `proofi status`
- Shows DDC connection status
- Indicates if data is on DDC or local only

#### New: `proofi sync`
- Uploads locally-cached data to DDC
- Use after offline uploads to sync to decentralized storage

## Data Flow

### Upload Flow
```
User data → Encrypt locally (AES-256-GCM)
          → Upload encrypted blob to DDC
          → Get real CID from DDC
          → Store CID + wrapped DEK locally
```

### Analyze Flow
```
Agent request → Validate capability token
             → Fetch encrypted data FROM DDC using CID
             → Decrypt locally with DEK
             → Run local AI analysis
```

## Configuration

### Environment Variables
- `DDC_BUCKET_ID` - Your DDC bucket ID (required for upload)
- `DDC_NETWORK` - `testnet` (default) or `mainnet`
- `DEBUG=1` - Enable debug logging for DDC operations

### Getting a Bucket ID
1. Create a bucket on Cere DDC Console: https://console.cere.network
2. Fund your wallet with CERE tokens for gas
3. Set `DDC_BUCKET_ID=<your-bucket-id>` or use `--bucket` flag

## Fallback Behavior

If DDC is unavailable:
1. Data is stored in local cache (`~/.proofi/cache/`)
2. Warning is displayed to user
3. User can run `proofi sync` later to upload to DDC

## Testing

```bash
# Check status
proofi status

# Upload to DDC (requires bucket)
DDC_BUCKET_ID=12345 proofi upload export.xml

# Upload locally (for testing)
proofi upload export.xml --local

# Sync local data to DDC
DDC_BUCKET_ID=12345 proofi sync

# Analyze (fetches from DDC automatically)
proofi analyze
```

## Notes

The polkadot SDK warnings can be suppressed with:
```bash
NODE_OPTIONS='--no-warnings' proofi status
```

These are cosmetic and don't affect functionality.

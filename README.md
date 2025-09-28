# Go2 Parking Software

Go2 Parking Software is a production-grade Expo powered mobile application for managing parking operations across multiple locations. It offers secure authentication, real-time ticketing, Bluetooth receipt printing, pricing management, analytics, and device synchronization for distributed teams.

## Features

- Secure authentication with role-based access (Owner, Manager, Attendant)
- Distributed session management with biometric unlock and device pairing
- Ticket lifecycle management: creation, check-in/out, validation, payment capture
- Pricing configuration with hourly, flat-rate, and validation rules
- Offline support with queued sync to the backend once connectivity is restored
- Bluetooth Low Energy printer discovery, pairing, and receipt printing
- Operational dashboards, revenue reports, shift summaries, and audit logs
- Centralized settings for printer management, tax & fee rules, and data exports

## Project Structure

```
app/                 Expo Router routes and UI screens
assets/              Static assets
components/          Shared UI, layout helpers, and error boundary
constants/           Shared theme and constants
contexts/            React contexts (authentication, permissions)
hooks/               Reusable hooks (authentication, connectivity, sync)
services/            External integrations such as Bluetooth printing & sync
stores/              Zustand stores for tickets and settings
types/               Shared TypeScript types
utils/               Helpers for formatting, validation, telemetry
__tests__/           Jest unit tests
```

## Getting Started

1. Install dependencies (Node 18+, Bun optional):
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env` (create one if missing) and update API endpoints, Sentry DSN, etc.
   - For local development without a backend, the mock sync service is already provided.

3. Launch the Expo development server:
   ```bash
   npm run start
   ```

4. For Bluetooth printing, the app must run in a development build:
   ```bash
   npx expo run:android --device
   npx expo run:ios --device
   ```

### Test Credentials

| Role     | Email                     | Password        |
|----------|---------------------------|-----------------|
| Owner    | `owner@go2parking.com`    | `Owner@123`     |
| Manager  | `manager@go2parking.com`  | `Manager@123`   |
| Attendant| `attendant@go2parking.com`| `Attendant@123` |

Owner and manager roles can access pricing and reporting screens; attendants have operational access only.

## Scripts

| Script | Description |
| ------ | ----------- |
| `npm run start` | Start Expo CLI with Metro bundler |
| `npm run android` / `npm run ios` | Build and run development builds |
| `npm run web` | Run the web build |
| `npm run lint` | ESLint static analysis |
| `npm run typecheck` | TypeScript project wide check |
| `npm run test` | Jest + Testing Library suite |
| `npm run clean` | Remove caches and `node_modules` |

## Quality Gates

- Type safety enforced with strict TypeScript configuration
- ESLint + Prettier for style consistency
- Unit coverage via Jest and Testing Library (`__tests__/`)
- Service mocks using local sync helpers to simulate backend responses
- E2E automation ready via Detox (config stub provided in `tests/e2e`)

## Native Requirements

- Bluetooth support leverages `react-native-ble-plx`; install pods on iOS after dependency install (`npx pod-install`).
- Android requires location permission for BLE discovery; ensure you grant it during QA.
- Development builds are required (BLE is not supported in Expo Go).

## Testing

Run the full quality suite before shipping:

```bash
npm run lint
npm run typecheck
npm run test
```

Unit tests cover pricing calculations and ticket store behaviour. Add coverage for new business logic under `__tests__/`.

## Deployment

1. Update the version in `app.json` and `package.json`.
2. Generate Android/iOS builds with EAS:
   ```bash
   eas build --platform android
   eas build --platform ios
   ```
3. Submit releases:
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

Refer to `docs/RELEASE_PROCESS.md` for detailed rollout steps (to be maintained per release).

## Support

For onboarding and production support, contact the Go2 Operations team or raise issues in the shared support desk.

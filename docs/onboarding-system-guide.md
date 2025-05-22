# User Onboarding System Documentation

This document outlines the implementation of the user onboarding system for the Allied iMpact Coin Box platform.

## Overview

The onboarding system consists of several components that work together to provide a guided experience for new users:

1. **OnboardingProvider** - A context provider that manages the onboarding state
2. **UserOnboarding** - The UI component that displays the onboarding tutorial
3. **RestartOnboardingButton** - A utility button to restart the onboarding process
4. **OnboardingStatus** - A utility component for conditional rendering based on onboarding status

## Components

### OnboardingProvider

The `OnboardingProvider` is a context provider that manages the onboarding state across the application.

```tsx
// Import
import { OnboardingProvider, useOnboarding } from '@/components/onboarding';

// Wrap your application or specific sections
<OnboardingProvider>
  {children}
</OnboardingProvider>
```

The provider exposes the following API through the `useOnboarding` hook:

- `showOnboarding` (boolean): Whether to show the onboarding UI
- `completeOnboarding` (function): Mark the onboarding as complete
- `resetOnboarding` (function): Reset the onboarding state back to the beginning
- `onboardingProgress` (number): The user's progress through the onboarding (0-100)
- `updateProgress` (function): Update the progress value
- `isOnboardingCompleted` (boolean): Whether the onboarding has been completed
- `startOnboarding` (function): Start or restart the onboarding process

### UserOnboarding

The `UserOnboarding` component provides the UI for the onboarding process. It displays a dialog with:

- Step-by-step guide with progress tracking
- Educational content about P2P trading
- Tips for platform usage

```tsx
// It's already included in the main layout.tsx
import UserOnboarding from '@/components/onboarding/UserOnboarding';

// It will automatically show when needed
<UserOnboarding />
```

### RestartOnboardingButton

A button component to restart the onboarding process.

```tsx
import { RestartOnboardingButton } from '@/components/onboarding';

// In a user settings page or help section
<RestartOnboardingButton variant="outline" size="sm" />
```

### OnboardingStatus

A utility component for conditional rendering based on onboarding status.

```tsx
import { OnboardingStatus } from '@/components/onboarding';

<OnboardingStatus
  completed={<AdvancedFeatures />}
  notCompleted={<BasicFeatures />}
/>
```

## Implementation Details

- Onboarding progress is persisted in localStorage to survive page refreshes
- The system keeps track of which steps have been completed
- Each user has their own onboarding state tracked by their user ID
- The onboarding UI is dynamically loaded client-side to avoid SSR issues

## Integration Points

The onboarding system integrates with the following platform components:

1. **AuthProvider** - To get the current user information
2. **Next.js Router** - For navigation between onboarding steps
3. **Toast System** - For notifications about onboarding status

## Future Enhancements

Potential enhancements to consider:

1. Store onboarding progress in the database for cross-device continuity
2. Add more interactive tutorials for specific platform features
3. Implement feature discovery tours beyond the initial onboarding
4. Track analytics on onboarding completion rates and drop-off points

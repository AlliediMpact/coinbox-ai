#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need quote escaping fixes
const filesToFix = [
  'src/app/loading-examples/page.tsx',
  'src/app/system-status/page.tsx',
  'src/components/AuthFlipCard.tsx',
  'src/components/KycVerification.tsx',
  'src/components/NotificationCenter.tsx',
  'src/components/ReferralTracking.tsx',
  'src/components/RoleManagement.tsx',
  'src/components/TransactionSecurity.tsx',
  'src/components/UserDisputeTracking.tsx',
  'src/components/onboarding/UserOnboarding.tsx',
  'src/components/referral/ReferralCodeGenerator.tsx',
  'src/components/referral/ReferralList.tsx',
  'src/components/system/SystemMonitoringDashboard.tsx'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace unescaped single quotes in JSX text
      // This regex finds quotes inside JSX text (not in attributes)
      content = content.replace(/(\>[^<]*)'([^<]*\<)/g, '$1&apos;$2');
      content = content.replace(/(\>[^<]*)'([^<]*$)/gm, '$1&apos;$2');
      
      // More specific replacements for common patterns
      content = content.replace(/don't/g, "don&apos;t");
      content = content.replace(/won't/g, "won&apos;t");
      content = content.replace(/can't/g, "can&apos;t");
      content = content.replace(/isn't/g, "isn&apos;t");
      content = content.replace(/doesn't/g, "doesn&apos;t");
      content = content.replace(/hasn't/g, "hasn&apos;t");
      content = content.replace(/haven't/g, "haven&apos;t");
      content = content.replace(/shouldn't/g, "shouldn&apos;t");
      content = content.replace(/wouldn't/g, "wouldn&apos;t");
      content = content.replace(/couldn't/g, "couldn&apos;t");
      content = content.replace(/didn't/g, "didn&apos;t");
      content = content.replace(/user's/g, "user&apos;s");
      content = content.replace(/system's/g, "system&apos;s");
      content = content.replace(/it's/g, "it&apos;s");
      content = content.replace(/that's/g, "that&apos;s");
      content = content.replace(/you're/g, "you&apos;re");
      content = content.replace(/we're/g, "we&apos;re");
      content = content.replace(/they're/g, "they&apos;re");
      
      fs.writeFileSync(fullPath, content);
      console.log(`✓ Fixed quotes in ${filePath}`);
    } catch (error) {
      console.log(`✗ Error fixing ${filePath}: ${error.message}`);
    }
  } else {
    console.log(`⚠ File not found: ${filePath}`);
  }
});

console.log('Quote fixing complete!');

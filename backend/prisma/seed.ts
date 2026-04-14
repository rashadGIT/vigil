import { PrismaClient, UserRole } from '@prisma/client';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider';

const prisma = new PrismaClient();

const COGNITO_ENABLED = !!(process.env.AWS_REGION && process.env.COGNITO_USER_POOL_ID);
const cognito = COGNITO_ENABLED
  ? new CognitoIdentityProviderClient({ region: process.env.AWS_REGION })
  : null;

// Demo password used for all seeded users (D-13). Only usable when Cognito is wired;
// DEV_AUTH_BYPASS doesn't verify the password at all — it matches by email.
const DEMO_PASSWORD = 'Demo1234!';

async function ensureCognitoUser(
  email: string,
  tenantId: string,
  role: 'admin' | 'staff',
): Promise<string> {
  // Deterministic offline stub — stable across re-runs (D-13).
  const stubSub = `cognito-sub-${email.replace('@', '-').replace(/\./g, '-')}`;
  if (!COGNITO_ENABLED || !cognito) return stubSub;

  const UserPoolId = process.env.COGNITO_USER_POOL_ID!;
  try {
    const res = await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId,
        Username: email,
        MessageAction: 'SUPPRESS',
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:tenantId', Value: tenantId },
          { Name: 'custom:role', Value: role },
        ],
      }),
    );
    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId,
        Username: email,
        Password: DEMO_PASSWORD,
        Permanent: true,
      }),
    );
    const sub = res.User?.Attributes?.find((a) => a.Name === 'sub')?.Value;
    return sub ?? stubSub;
  } catch (err) {
    if (err instanceof UsernameExistsException) {
      // User already exists in Cognito — keep stub sub (idempotent re-run).
      return stubSub;
    }
    console.warn(`[seed] Cognito create failed for ${email}:`, (err as Error).message);
    return stubSub;
  }
}

async function seedTenants() {
  const sunrise = await prisma.tenant.upsert({
    where: { slug: 'sunrise' },
    update: {},
    create: {
      name: 'Sunrise Funeral Home',
      slug: 'sunrise',
      subdomain: 'sunrise',
      planTier: 'standard',
      active: true,
      flagESignatures: true,
      flagGplCompliance: true,
      flagVendorCoordination: true,
      flagCalendar: true,
      flagFamilyPortal: false,
      googleReviewUrl: 'https://g.page/r/sunrise-funeral-home/review',
    },
  });

  const heritage = await prisma.tenant.upsert({
    where: { slug: 'heritage' },
    update: {},
    create: {
      name: 'Heritage Memorial',
      slug: 'heritage',
      subdomain: 'heritage',
      planTier: 'pilot',
      active: true,
      flagESignatures: false,
      flagGplCompliance: true,
      flagVendorCoordination: false,
      flagCalendar: true,
      flagFamilyPortal: false,
    },
  });

  console.log(`[seed] tenants: ${sunrise.slug}, ${heritage.slug}`);
  return { sunrise, heritage };
}

async function seedUsers(
  tenants: { sunrise: { id: string }; heritage: { id: string } },
) {
  const users = [
    { email: 'director@sunrise.demo', name: 'Evelyn Park',     role: UserRole.admin, tenantId: tenants.sunrise.id },
    { email: 'staff@sunrise.demo',    name: 'Marcus Lee',      role: UserRole.staff, tenantId: tenants.sunrise.id },
    { email: 'director@heritage.demo',name: 'Nadia Brooks',    role: UserRole.admin, tenantId: tenants.heritage.id },
    { email: 'staff@heritage.demo',   name: 'Darius Whitfield',role: UserRole.staff, tenantId: tenants.heritage.id },
  ];

  for (const u of users) {
    const cognitoSub = await ensureCognitoUser(u.email, u.tenantId, u.role);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, tenantId: u.tenantId, cognitoSub, active: true },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        tenantId: u.tenantId,
        cognitoSub,
        active: true,
      },
    });
  }
  console.log(`[seed] users: ${users.length}`);
}

async function main() {
  console.log(`[seed] Cognito enabled: ${COGNITO_ENABLED}`);
  const tenants = await seedTenants();
  await seedUsers(tenants);
  // Plans 11-02 → 11-04 will extend main() with subsequent seed sections.
  console.log('[seed] Plan 11-01 complete');
}

main()
  .catch((e) => {
    console.error('[seed] failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

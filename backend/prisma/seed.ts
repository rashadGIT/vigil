import { PrismaClient, UserRole, PriceCategory } from '@prisma/client';
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

type SeedPriceItem = {
  category: PriceCategory;
  name: string;
  price: number;
  taxable: boolean;
  sortOrder: number;
};

const SUNRISE_PRICE_LIST: SeedPriceItem[] = [
  // Professional Services (5)
  { category: PriceCategory.professional_services, name: 'Basic Services of Funeral Director and Staff', price: 1995, taxable: false, sortOrder: 10 },
  { category: PriceCategory.professional_services, name: 'Embalming', price: 795, taxable: false, sortOrder: 20 },
  { category: PriceCategory.professional_services, name: 'Other Preparation of the Body', price: 295, taxable: false, sortOrder: 30 },
  { category: PriceCategory.professional_services, name: 'Transfer of Remains to Funeral Home', price: 395, taxable: false, sortOrder: 40 },
  { category: PriceCategory.professional_services, name: 'Direct Cremation (Alternative Container)', price: 895, taxable: false, sortOrder: 50 },

  // Facilities (4)
  { category: PriceCategory.facilities, name: 'Use of Facilities for Visitation', price: 495, taxable: false, sortOrder: 10 },
  { category: PriceCategory.facilities, name: 'Use of Facilities for Funeral Ceremony', price: 695, taxable: false, sortOrder: 20 },
  { category: PriceCategory.facilities, name: 'Use of Facilities for Memorial Service', price: 595, taxable: false, sortOrder: 30 },
  { category: PriceCategory.facilities, name: 'Graveside Service (On-Site Staffing)', price: 495, taxable: false, sortOrder: 40 },

  // Vehicles (4)
  { category: PriceCategory.vehicles, name: 'Funeral Coach (Hearse)', price: 395, taxable: false, sortOrder: 10 },
  { category: PriceCategory.vehicles, name: 'Family Limousine', price: 295, taxable: false, sortOrder: 20 },
  { category: PriceCategory.vehicles, name: 'Utility Vehicle / Flower Car', price: 195, taxable: false, sortOrder: 30 },
  { category: PriceCategory.vehicles, name: 'Service Vehicle (Out-of-Area Mileage)', price: 3.50, taxable: false, sortOrder: 40 },

  // Merchandise (5)
  { category: PriceCategory.merchandise, name: 'Standard Cloth-Covered Casket', price: 1495, taxable: true, sortOrder: 10 },
  { category: PriceCategory.merchandise, name: 'Solid Oak Hardwood Casket', price: 3295, taxable: true, sortOrder: 20 },
  { category: PriceCategory.merchandise, name: 'Cremation Urn — Brushed Brass', price: 295, taxable: true, sortOrder: 30 },
  { category: PriceCategory.merchandise, name: 'Cremation Urn — Cherry Wood', price: 495, taxable: true, sortOrder: 40 },
  { category: PriceCategory.merchandise, name: 'Memorial Register Book + Acknowledgement Cards', price: 145, taxable: true, sortOrder: 50 },
];

async function seedPriceList(sunriseId: string) {
  for (const item of SUNRISE_PRICE_LIST) {
    const existing = await prisma.priceListItem.findFirst({
      where: { tenantId: sunriseId, category: item.category, name: item.name },
    });
    if (existing) {
      await prisma.priceListItem.update({
        where: { id: existing.id },
        data: { price: item.price, taxable: item.taxable, sortOrder: item.sortOrder, active: true },
      });
    } else {
      await prisma.priceListItem.create({
        data: {
          tenantId: sunriseId,
          category: item.category,
          name: item.name,
          price: item.price,
          taxable: item.taxable,
          active: true,
          sortOrder: item.sortOrder,
        },
      });
    }
  }
  console.log(`[seed] price list: ${SUNRISE_PRICE_LIST.length} items for Sunrise`);
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
  await seedPriceList(tenants.sunrise.id);
  console.log('[seed] Plan 11-02 complete');
}

main()
  .catch((e) => {
    console.error('[seed] failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

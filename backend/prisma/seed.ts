import { PrismaClient, Role, LeadStatus, LeadSource, OpportunityStage, ActivityType, OrderStatus, TargetPeriod } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Cleaning database...');
  
  // Deleting records in reverse relation order
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.target.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log('🌱 Database cleaned. Seeding initial data...');

  // 1. Hash Password (cost factor / salt rounds = 12 as per context.md OWASP mitigation)
  const passwordHash = bcrypt.hashSync('SfaPassword123!', 12);

  // 2. Seed Users
  console.log('👤 Seeding Users...');
  const admin = await prisma.user.create({
    data: {
      name: 'Admin SFA',
      email: 'admin@sfa.com',
      password: passwordHash,
      role: Role.admin,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Jeffrey Herly',
      email: 'manager@sfa.com',
      password: passwordHash,
      role: Role.sales_manager,
    },
  });

  const sales1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'sales1@sfa.com',
      password: passwordHash,
      role: Role.sales_rep,
    },
  });

  const sales2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'sales2@sfa.com',
      password: passwordHash,
      role: Role.sales_rep,
    },
  });

  const executive = await prisma.user.create({
    data: {
      name: 'Executive Management',
      email: 'executive@sfa.com',
      password: passwordHash,
      role: Role.executive,
    },
  });

  // 3. Seed Accounts
  console.log('🏢 Seeding Accounts...');
  const cyberdyne = await prisma.account.create({
    data: {
      company_name: 'Cyberdyne Systems',
      industry: 'Artificial Intelligence',
      website: 'www.cyberdyne.com',
      address: '111 Sunnyvale Blvd, Silicon Valley, CA',
    },
  });

  const wayne = await prisma.account.create({
    data: {
      company_name: 'Wayne Enterprises',
      industry: 'Defense & Technology',
      website: 'www.wayneenterprises.com',
      address: '1007 Mountain Drive, Gotham City',
    },
  });

  const stark = await prisma.account.create({
    data: {
      company_name: 'Stark Industries',
      industry: 'Energy & Defense',
      website: 'www.starkindustries.com',
      address: '200 Park Avenue, Manhattan, NY',
    },
  });

  const themyscira = await prisma.account.create({
    data: {
      company_name: 'Themyscira Antiques',
      industry: 'Art & Antiques',
      website: 'www.themyscira-antiques.com',
      address: '5th Avenue Antique Mall, New York, NY',
    },
  });

  // 4. Seed Contacts
  console.log('📞 Seeding Contacts...');
  const sarah = await prisma.contact.create({
    data: {
      account_id: cyberdyne.id,
      name: 'Sarah Connor',
      email: 'sconnor@cyberdyne.com',
      phone: '+1-555-0199',
      position: 'Operations Manager',
    },
  });

  const bruce = await prisma.contact.create({
    data: {
      account_id: wayne.id,
      name: 'Bruce Wayne',
      email: 'bwayne@wayneenterprises.com',
      phone: '+1-555-1939',
      position: 'CEO / Owner',
    },
  });

  const tony = await prisma.contact.create({
    data: {
      account_id: stark.id,
      name: 'Tony Stark',
      email: 'tstark@starkindustries.com',
      phone: '+1-555-2008',
      position: 'Chief Futurist',
    },
  });

  const diana = await prisma.contact.create({
    data: {
      account_id: themyscira.id,
      name: 'Diana Prince',
      email: 'dprince@themyscira-antiques.com',
      phone: '+1-555-1941',
      position: 'Head Curator',
    },
  });

  // 5. Seed Leads (associated with Sales John Doe and Jane Smith)
  console.log('🎯 Seeding Leads...');
  const lead1 = await prisma.lead.create({
    data: {
      name: 'Sarah Connor',
      email: 'sconnor@cyberdyne.com',
      phone: '+1-555-0199',
      interest: 'AI Security and Automation Systems',
      status: LeadStatus.new,
      source: LeadSource.web_form,
      assigned_to: sales1.id,
      notes: 'Interested in safeguarding CPU microarchitectures.',
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      name: 'Bruce Wayne',
      email: 'bwayne@wayneenterprises.com',
      phone: '+1-555-1939',
      interest: 'Advanced Communication Satellites & Graphite Composites',
      status: LeadStatus.qualified,
      source: LeadSource.manual,
      created_by: manager.id,
      assigned_to: sales1.id,
      notes: 'Requires high-confidentiality NDA before detailed quote.',
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      name: 'Tony Stark',
      email: 'tstark@starkindustries.com',
      phone: '+1-555-2008',
      interest: 'Clean Energy Grid Integration Modules',
      status: LeadStatus.contacted,
      source: LeadSource.referral,
      assigned_to: sales2.id,
      notes: 'Met at tech summit. Very interested in local power grid grid-tie models.',
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      name: 'Diana Prince',
      email: 'dprince@themyscira-antiques.com',
      phone: '+1-555-1941',
      interest: 'Climate-controlled warehouse security systems',
      status: LeadStatus.converted,
      source: LeadSource.import,
      assigned_to: sales2.id,
      notes: 'Archival quality security sensors needed. Upgraded to opportunity.',
    },
  });

  // 6. Seed Opportunities
  console.log('💼 Seeding Opportunities...');
  const opp1 = await prisma.opportunity.create({
    data: {
      title: 'Wayne Satellite Tech Contract',
      lead_id: lead2.id,
      account_id: wayne.id,
      stage: OpportunityStage.proposal,
      amount: 2000000.00, // $2M (Matches frontend)
      probability: 70,
      expected_close: new Date('2026-09-30'),
    },
  });

  const opp2 = await prisma.opportunity.create({
    data: {
      title: 'Cyberdyne CPU SafeGuard Server Integration',
      lead_id: lead1.id,
      account_id: cyberdyne.id,
      stage: OpportunityStage.prospecting,
      amount: 45000.00, // $45k (Matches frontend)
      probability: 10,
      expected_close: new Date('2026-12-15'),
    },
  });

  const opp3 = await prisma.opportunity.create({
    data: {
      title: 'Stark Industries Arc Grid Modules',
      lead_id: lead3.id,
      account_id: stark.id,
      stage: OpportunityStage.qualification,
      amount: 1500000.00, // $1.5M (Matches frontend)
      probability: 30,
      expected_close: new Date('2026-10-31'),
    },
  });

  const opp4 = await prisma.opportunity.create({
    data: {
      title: 'Themyscira Archival Security Installation',
      lead_id: lead4.id,
      account_id: themyscira.id,
      stage: OpportunityStage.closed_won,
      amount: 1200000.00, // $1.2M (Matches frontend)
      probability: 100,
      expected_close: new Date('2026-07-01'),
    },
  });

  // 7. Seed Activities (Logs)
  console.log('📝 Seeding Activities...');
  await prisma.activity.create({
    data: {
      user_id: sales1.id,
      lead_id: lead2.id,
      opportunity_id: opp1.id,
      contact_id: bruce.id,
      account_id: wayne.id,
      type: ActivityType.meeting,
      notes: 'Initial requirements gathering meeting. Bruce requested extreme security protocols.',
      meta: { lat: 40.7128, lng: -74.006, address: 'Wayne Tower, Gotham City', check_in_at: '2026-07-10T10:00:00Z', check_out_at: '2026-07-10T11:30:00Z' },
      activity_date: new Date('2026-07-10T10:00:00Z'),
    },
  });

  await prisma.activity.create({
    data: {
      user_id: sales1.id,
      lead_id: lead1.id,
      opportunity_id: opp2.id,
      contact_id: sarah.id,
      account_id: cyberdyne.id,
      type: ActivityType.call,
      notes: 'Followed up on AI SafeGuard system specs. Sarah is concerned about network firewalls.',
      activity_date: new Date('2026-07-12T14:20:00Z'),
    },
  });

  // 8. Seed Targets for Salespersons
  console.log('📈 Seeding Targets...');
  await prisma.target.create({
    data: {
      user_id: sales1.id,
      period_type: TargetPeriod.monthly,
      period_start: new Date('2026-07-01'),
      period_end: new Date('2026-07-31'),
      target_amount: 1500000.00,
      target_visits: 25,
      target_new_leads: 10,
    },
  });

  await prisma.target.create({
    data: {
      user_id: sales2.id,
      period_type: TargetPeriod.monthly,
      period_start: new Date('2026-07-01'),
      period_end: new Date('2026-07-31'),
      target_amount: 1000000.00,
      target_visits: 20,
      target_new_leads: 8,
    },
  });

  // 9. Seed Order and Order Items
  console.log('🛒 Seeding Orders...');
  const order1 = await prisma.order.create({
    data: {
      order_number: 'ORD-2026-0001',
      account_id: themyscira.id,
      opportunity_id: opp4.id,
      salesperson_id: sales2.id,
      status: OrderStatus.approved,
      order_date: new Date('2026-07-01'),
      delivery_date: new Date('2026-07-15'),
      total_amount: 1200000.00,
      notes: 'Special temperature sensors included for historic artifact safety.',
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        order_id: order1.id,
        product_name: 'Climate Sensor Hub PRO',
        quantity: 50,
        unit_price: 15000.00,
        discount: 1000.00,
        subtotal: 700000.00,
      },
      {
        order_id: order1.id,
        product_name: 'Laser Barrier Perimeter v4',
        quantity: 10,
        unit_price: 50000.00,
        discount: 0.00,
        subtotal: 500000.00,
      },
    ],
  });

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

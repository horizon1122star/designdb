/**
 * generate_seed_data.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * M3: Synthetic data generator for the DesignDB application schema.
 *
 * Domain: DesignDB itself — the data the app stores when users design ERDs.
 * Tables: users, projects, schemas, entities, attributes, relationships
 *
 * Guarantees:
 *  - 50–100 rows per table
 *  - FK referential integrity (children always reference valid parent PKs)
 *  - Deterministic output (no Math.random — seeded index arithmetic)
 *  - Exports to data/csv/<table>.csv
 *
 * Run: npx ts-node execution/generate_seed_data.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Output directory ────────────────────────────────────────────────────────
const OUT_DIR = path.resolve(__dirname, '../data/csv');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function dateOffset(baseDays: number, offsetDays: number): string {
  const d = new Date('2024-01-01');
  d.setDate(d.getDate() + baseDays + offsetDays);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function writeCSV(filename: string, headers: string[], rows: string[][]): void {
  const lines = [
    headers.join(','),
    ...rows.map(r => r.map(c => (c.includes(',') || c.includes('"') ? `"${c.replace(/"/g, '""')}"` : c)).join(','))
  ];
  const filepath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filepath, lines.join('\n'), 'utf8');
  console.log(`✅  Wrote ${rows.length} rows → ${filepath}`);
}

// ─── 1. USERS (60 rows) ──────────────────────────────────────────────────────
const firstNames = ['Alice','Bob','Carol','David','Eva','Frank','Grace','Hassan','Iris','James',
                    'Karen','Leo','Mia','Noah','Olivia','Paul','Quinn','Rachel','Sam','Tina'];
const lastNames  = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Moore',
                    'Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Martinez','Robinson'];
const roles      = ['admin','designer','viewer','editor'];
const domains    = ['gmail.com','yahoo.com','outlook.com','designlab.io','devmail.net'];

const userRows: string[][] = [];
for (let i = 1; i <= 60; i++) {
  const fn   = pick(firstNames, i - 1);
  const ln   = pick(lastNames, i + 3);
  const role = pick(roles, i);
  const dom  = pick(domains, i + 1);
  userRows.push([
    String(i),
    `${fn.toLowerCase()}${ln.toLowerCase()}${i}`,
    `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@${dom}`,
    `${fn} ${ln}`,
    role,
    dateOffset(i * 2, 0),
    i % 10 === 0 ? '0' : '1'
  ]);
}
writeCSV('users.csv',
  ['user_id','username','email','full_name','role','created_at','is_active'],
  userRows
);

// ─── 2. PROJECTS (80 rows) ───────────────────────────────────────────────────
const projectTitles = [
  'Library Management System','Hospital Records DB','E-Commerce Platform','School ERP',
  'Inventory Tracker','HR Management','CRM System','Blog Engine','Auction Platform',
  'Flight Booking DB','Banking System','Social Network Schema','Food Delivery App',
  'Real Estate DB','Streaming Service','Gym Management','Event Planner','Pharmacy DB',
  'University Portal','Logistics Tracker'
];
const projectDescs = [
  'Tracks books, authors, members, and loans',
  'Manages patients, doctors, appointments, prescriptions',
  'Handles products, orders, customers, and payments',
  'Covers students, teachers, courses, grades',
  'Monitors stock levels, suppliers, warehouses',
  'Payroll, employees, departments, leaves',
  'Contacts, deals, pipelines, activities',
  'Posts, tags, authors, comments',
  'Items, bids, users, auctions',
  'Flights, passengers, bookings, seats'
];

const projectRows: string[][] = [];
for (let i = 1; i <= 80; i++) {
  const userId = ((i - 1) % 60) + 1;   // FK → users
  projectRows.push([
    String(i),
    String(userId),
    pick(projectTitles, i - 1),
    pick(projectDescs, i),
    i % 4 === 0 ? '1' : '0',           // is_public
    dateOffset(i * 3, 10),
    dateOffset(i * 3, 20)
  ]);
}
writeCSV('projects.csv',
  ['project_id','user_id','title','description','is_public','created_at','updated_at'],
  projectRows
);

// ─── 3. SCHEMAS (75 rows) ────────────────────────────────────────────────────
const dialects    = ['postgresql','mysql','sqlite'];
const schemaNames = ['v1_draft','v2_normalized','v3_final','production_schema','dev_schema',
                     'staging_v1','milestone_schema','review_copy','backup_schema','optimized_v2'];

const schemaRows: string[][] = [];
for (let i = 1; i <= 75; i++) {
  const projId  = ((i - 1) % 80) + 1;  // FK → projects
  const version = Math.floor((i - 1) / 15) + 1;
  schemaRows.push([
    String(i),
    String(projId),
    pick(schemaNames, i - 1),
    String(version),
    i % 3 === 0 ? '1' : '0',            // is_normalized
    pick(dialects, i),
    dateOffset(i * 4, 5)
  ]);
}
writeCSV('schemas.csv',
  ['schema_id','project_id','schema_name','version','is_normalized','dialect','created_at'],
  schemaRows
);

// ─── 4. ENTITIES (90 rows) ───────────────────────────────────────────────────
const entityNames = ['User','Product','Order','Customer','Employee','Department','Category',
                     'Invoice','Payment','Shipment','Review','Address','Supplier','Warehouse',
                     'Branch','Ticket','Booking','Course','Student','Instructor'];
const entityDescs = [
  'Stores user account information',
  'Contains product catalog details',
  'Records customer purchase orders',
  'Holds customer profile data',
  'Manages employee records',
  'Organizes company departments',
  'Groups products or content',
  'Tracks billing invoices',
  'Records financial transactions',
  'Manages shipping logistics'
];

const entityRows: string[][] = [];
for (let i = 1; i <= 90; i++) {
  const schemaId = ((i - 1) % 75) + 1;  // FK → schemas
  entityRows.push([
    String(i),
    String(schemaId),
    pick(entityNames, i - 1),
    pick(entityDescs, i),
    String(50 + (i * 7) % 950)           // row_count estimate
  ]);
}
writeCSV('entities.csv',
  ['entity_id','schema_id','entity_name','description','estimated_row_count'],
  entityRows
);

// ─── 5. ATTRIBUTES (100 rows) ────────────────────────────────────────────────
const attrNames   = ['id','name','email','created_at','updated_at','is_active','description',
                     'price','quantity','status','type','code','total','address','phone'];
const dataTypes   = ['INTEGER','VARCHAR(255)','TEXT','BOOLEAN','DECIMAL(10,2)','TIMESTAMP','DATE','FLOAT'];
const defaultVals = ['NULL','0','NOW()','TRUE','FALSE','""','CURRENT_TIMESTAMP'];

const attributeRows: string[][] = [];
for (let i = 1; i <= 100; i++) {
  const entityId = ((i - 1) % 90) + 1;  // FK → entities
  const isPk     = i % 7 === 1 ? '1' : '0';
  const isNullable = isPk === '1' ? '0' : (i % 3 === 0 ? '1' : '0');
  const isUnique   = isPk === '1' ? '1' : (i % 5 === 0 ? '1' : '0');
  attributeRows.push([
    String(i),
    String(entityId),
    pick(attrNames, i - 1),
    pick(dataTypes, i),
    isPk,
    isNullable,
    isUnique,
    isPk === '1' ? 'NULL' : pick(defaultVals, i)
  ]);
}
writeCSV('attributes.csv',
  ['attribute_id','entity_id','attr_name','data_type','is_primary_key','is_nullable','is_unique','default_value'],
  attributeRows
);

// ─── 6. RELATIONSHIPS (70 rows) ──────────────────────────────────────────────
const relTypes   = ['one-to-one','one-to-many','many-to-one','many-to-many'];
const onActions  = ['CASCADE','RESTRICT','SET NULL','NO ACTION'];
const fkPatterns = ['user_id','product_id','order_id','customer_id','category_id',
                    'employee_id','department_id','invoice_id','supplier_id','branch_id'];

const relationshipRows: string[][] = [];
for (let i = 1; i <= 70; i++) {
  const schemaId    = ((i - 1) % 75) + 1;   // FK → schemas
  const fromEntityId = ((i - 1) % 90) + 1;  // FK → entities
  const toEntityId   = ((i) % 90) + 1;      // FK → entities (different)
  relationshipRows.push([
    String(i),
    String(schemaId),
    String(fromEntityId),
    String(toEntityId),
    pick(relTypes, i - 1),
    pick(fkPatterns, i),
    pick(fkPatterns, i),           // referenced_key (same name for simplicity)
    pick(onActions, i),
    pick(onActions, i + 1)
  ]);
}
writeCSV('relationships.csv',
  ['relationship_id','schema_id','from_entity_id','to_entity_id','rel_type',
   'foreign_key','referenced_key','on_delete','on_update'],
  relationshipRows
);

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n📊 Seed data generation complete!');
console.log('   Tables: users(60), projects(80), schemas(75), entities(90), attributes(100), relationships(70)');
console.log(`   Output: ${OUT_DIR}`);

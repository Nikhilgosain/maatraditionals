import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Category from '../src/models/categories.js';
import SubCategory from '../src/models/subcategories.js';
import Customer from '../src/models/customers.js';
import Booking from '../src/models/bookings.js';
import Inventory from '../src/models/inventory.js';

dotenv.config({ path: '.env.local' });

const CATEGORY_NAME = 'Verification Seed Collection';
const SUBCATEGORY_DEFS = [
  { name: 'Ruby Lehenga Demo', serialNumber: 9101 },
  { name: 'Ivory Saree Demo', serialNumber: 9102 },
  { name: 'Emerald Anarkali Demo', serialNumber: 9103 },
  { name: 'Gold Kurta Demo', serialNumber: 9104 },
];

const CUSTOMER_DEFS = [
  {
    fullName: 'Verification Customer One',
    mobile: '9000000001',
    address: 'Seed Lane 1, Demo City',
    total_amount: 18000,
  },
  {
    fullName: 'Verification Customer Two',
    mobile: '9000000002',
    address: 'Seed Lane 2, Demo City',
    total_amount: 9000,
  },
  {
    fullName: 'Verification Customer Three',
    mobile: '9000000003',
    address: 'Seed Lane 3, Demo City',
    total_amount: 7000,
  },
];

const IMAGE_URL = '/logo.png';

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function eachDate(from: string, to: string): string[] {
  const [fromDay, fromMonth, fromYear] = from.split('-').map(Number);
  const [toDay, toMonth, toYear] = to.split('-').map(Number);
  const cursor = new Date(fromYear, fromMonth - 1, fromDay);
  const end = new Date(toYear, toMonth - 1, toDay);
  const dates: string[] = [];

  while (cursor <= end) {
    dates.push(formatDate(new Date(cursor)));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

async function ensureCategoryAndSubcategories() {
  const category = await Category.findOneAndUpdate(
    { name: CATEGORY_NAME },
    { $set: { name: CATEGORY_NAME } },
    { new: true, upsert: true }
  );

  const subcategories = [];
  for (const def of SUBCATEGORY_DEFS) {
    const subcategory = await SubCategory.findOneAndUpdate(
      { categoryId: category._id, serialNumber: def.serialNumber },
      {
        $set: {
          categoryId: category._id,
          name: def.name,
          serialNumber: def.serialNumber,
          imageUrl: IMAGE_URL,
          deleted_at: null,
          deleted_by: null,
        },
      },
      { new: true, upsert: true }
    );
    subcategories.push(subcategory);
  }

  return { category, subcategories };
}

async function ensureCustomers() {
  const customers = [];
  for (const def of CUSTOMER_DEFS) {
    const customer = await Customer.findOneAndUpdate(
      { mobile: def.mobile },
      {
        $set: {
          fullName: def.fullName,
          mobile: def.mobile,
          address: def.address,
          total_amount: def.total_amount,
          deleted_at: null,
          deleted_by: null,
        },
      },
      { new: true, upsert: true }
    );
    customers.push(customer);
  }
  return customers;
}

async function removeOldSeedBookings(customerIds: mongoose.Types.ObjectId[]) {
  const oldBookings = await Booking.find({ customerId: { $in: customerIds } }).select('_id');
  const bookingIds = oldBookings.map((booking) => booking._id);

  if (bookingIds.length > 0) {
    await Inventory.deleteMany({ bookingId: { $in: bookingIds } });
    await Booking.deleteMany({ _id: { $in: bookingIds } });
  }
}

async function createSeedBookings(customers: any[], subcategories: any[]) {
  const customerOne = customers[0];
  const customerTwo = customers[1];
  const customerThree = customers[2];

  const bookingOne = await Booking.create({
    customerId: customerOne._id,
    items: [
      {
        subCategoryId: subcategories[0]._id,
        serialNumber: String(subcategories[0].serialNumber),
        fromDate: '18-07-2026',
        toDate: '20-07-2026',
        totalDays: 3,
        price: 6000,
        status: 'active',
      },
      {
        subCategoryId: subcategories[1]._id,
        serialNumber: String(subcategories[1].serialNumber),
        fromDate: '19-07-2026',
        toDate: '21-07-2026',
        totalDays: 3,
        price: 5500,
        status: 'given',
        given_by: 'Demo Staff',
        given_at: new Date('2026-07-17T10:00:00+05:30'),
      },
      {
        subCategoryId: subcategories[2]._id,
        serialNumber: String(subcategories[2].serialNumber),
        fromDate: '16-07-2026',
        toDate: '17-07-2026',
        totalDays: 2,
        price: 6500,
        status: 'received',
        given_by: 'Demo Staff',
        received_by: 'Verification Customer One',
        given_at: new Date('2026-07-16T11:00:00+05:30'),
        received_at: new Date('2026-07-17T09:30:00+05:30'),
      },
    ],
    payment_method: 'upi',
    payment_status: 'partial',
    status: 'active',
    paidAt: '17-07-2026',
    payment_history: [
      { amount: 5000, payment_date: '16-07-2026', note: 'Advance' },
      { amount: 3000, payment_date: '17-07-2026', note: 'Second installment' },
    ],
    bill_created_by: 'Seed Script',
    total: 18000,
    paid_amount: 8000,
    pending_amount: 10000,
    refered_by: 'Seed Referral',
    notes: 'Seed data for verification flows',
  });

  const bookingTwo = await Booking.create({
    customerId: customerTwo._id,
    items: [
      {
        subCategoryId: subcategories[3]._id,
        serialNumber: String(subcategories[3].serialNumber),
        fromDate: '22-07-2026',
        toDate: '23-07-2026',
        totalDays: 2,
        price: 4000,
        status: 'cancelled',
        cancelled_at: new Date('2026-07-17T12:00:00+05:30'),
      },
      {
        subCategoryId: subcategories[0]._id,
        serialNumber: String(subcategories[0].serialNumber),
        fromDate: '24-07-2026',
        toDate: '25-07-2026',
        totalDays: 2,
        price: 5000,
        status: 'active',
      },
    ],
    payment_method: 'cash',
    payment_status: 'unpaid',
    status: 'active',
    payment_history: [],
    bill_created_by: 'Seed Script',
    total: 9000,
    paid_amount: 0,
    pending_amount: 9000,
    refered_by: 'Walk In',
    notes: 'Seed data with pending payment and cancelled item',
  });

  const bookingThree = await Booking.create({
    customerId: customerThree._id,
    items: [
      {
        subCategoryId: subcategories[1]._id,
        serialNumber: String(subcategories[1].serialNumber),
        fromDate: '26-07-2026',
        toDate: '27-07-2026',
        totalDays: 2,
        price: 7000,
        status: 'active',
      },
    ],
    payment_method: 'upi',
    payment_status: 'paid',
    status: 'active',
    paidAt: '17-07-2026',
    payment_history: [
      { amount: 7000, payment_date: '17-07-2026', note: 'Full payment' },
    ],
    bill_created_by: 'Seed Script',
    total: 7000,
    paid_amount: 7000,
    pending_amount: 0,
    refered_by: 'Seed Referral',
    notes: 'Seed data fully paid booking',
  });

  return [bookingOne, bookingTwo, bookingThree];
}

async function seedInventory(bookings: any[]) {
  const inventoryDocs: Array<Record<string, unknown>> = [];

  for (const booking of bookings) {
    for (const item of booking.items) {
      const shouldBookInventory = item.status === 'active' || item.status === 'given';
      const dates = eachDate(item.fromDate, item.toDate);

      for (const date of dates) {
        inventoryDocs.push({
          subCategoryId: item.subCategoryId,
          date,
          status: shouldBookInventory ? 'booked' : 'available',
          customerId: shouldBookInventory ? booking.customerId : null,
          bookingId: shouldBookInventory ? booking._id : null,
          itemId: shouldBookInventory ? item._id : null,
          returned_at: item.status === 'received' ? '17-07-2026' : null,
          deleted_at: null,
          deleted_by: null,
        });
      }
    }
  }

  if (inventoryDocs.length > 0) {
    await Inventory.insertMany(inventoryDocs, { ordered: false });
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is missing from .env.local');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000, family: 4 });
  console.log('Connected to MongoDB');

  const { subcategories } = await ensureCategoryAndSubcategories();
  const customers = await ensureCustomers();
  await removeOldSeedBookings(customers.map((customer) => customer._id));

  await Inventory.deleteMany({ subCategoryId: { $in: subcategories.map((subcategory) => subcategory._id) } });

  const bookings = await createSeedBookings(customers, subcategories);
  await seedInventory(bookings);

  console.log('Seed demo data created successfully');
  console.log(`Category: ${CATEGORY_NAME}`);
  console.log(`Customers: ${CUSTOMER_DEFS.map((customer) => customer.fullName).join(', ')}`);
  console.log('Bookings created: 3');
  console.log('You can now verify item-wise given, received, cancelled, payments, and pending filter flows.');
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Failed to seed demo data:', error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });

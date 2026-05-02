require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/auth/models/User');
const Otp = require('../src/auth/models/Otp');
const RefreshToken = require('../src/auth/models/RefreshToken');
const Product = require('../src/product/models/Product');
const Order = require('../src/order/models/Order');
const Counter = require('../src/order/models/Counter');
const Config = require('../src/settings/models/Config');

const MONGO_URI = process.env.MONGODB_URI;

const seed = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected. Seeding...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Counter.deleteMany({}),
    Config.deleteMany({}),
    Otp.deleteMany({}),
    RefreshToken.deleteMany({}),
  ]);

  // ── Admin user ──
  const admin = await User.create({
    name: 'OOPS Admin',
    email: 'admin@oopsfashion.com',
    password: 'admin123',
    role: 'admin',
    isVerified: true,
  });
  console.log('Admin created:', admin.email);

  // ── Products ──
  const products = await Product.insertMany([
    {
      name: 'The Grain Crewneck',
      shortDesc: 'Ribbed paneling. Cotton-mesh bib. Oversized fit.',
      description: "A crewneck that earns a second look. Ribbed paneling down the sleeve catches light differently when you move. Cotton body, mesh panel at the bib — subtle enough to miss, interesting enough to notice. Oversized fit. Dropped shoulder.",
      price: 2499,
      category: 'Tops',
      status: 'available',
      sizes: ['S', 'M', 'L', 'XL'],
      image: '/images/grain-crewneck.jpg',
      images: ['/images/grain-crewneck.jpg', '/images/ribbed-crewneck.jpg', '/images/slate-overshirt.jpg', '/images/dune-sweater.jpg'],
      stock: { S: 25, M: 30, L: 20, XL: 15 },
      fabric: { composition: '100% Cotton body, Cotton-mesh blend bib panel, Ribbed knit sleeves', care: 'Cold wash. Hang dry. Do not bleach. Iron on low if needed.' },
    },
    {
      name: 'The Slate Overshirt',
      shortDesc: 'Herringbone weave. Dropped shoulder. Raw hem.',
      description: "Built around a herringbone weave we couldn't stop touching. Dropped shoulder, raw hem at the bottom. Somewhere between a shirt and a jacket — exactly where we wanted it.",
      price: 2999,
      category: 'Tops',
      status: 'available',
      sizes: ['S', 'M', 'L', 'XL'],
      image: '/images/slate-overshirt.jpg',
      images: ['/images/slate-overshirt.jpg', '/images/grain-crewneck.jpg', '/images/fog-knit-tee.jpg', '/images/ribbed-crewneck.jpg'],
      stock: { S: 10, M: 15, L: 12, XL: 8 },
      fabric: { composition: 'Herringbone weave cotton blend', care: 'Cold wash. Hang dry. Do not bleach.' },
    },
    {
      name: 'The Fog Knit Tee',
      shortDesc: 'Textured knit. Boxy cut. Subtle seam detail.',
      description: "A textured knit tee that feels like it's been in your wardrobe forever — from the first wear. Boxy cut, subtle seam detail at the shoulder. The kind of understated that gets noticed.",
      price: 1999,
      category: 'Knits',
      status: 'sold-out',
      sizes: ['S', 'M', 'L', 'XL'],
      image: '/images/fog-knit-tee.jpg',
      images: ['/images/fog-knit-tee.jpg', '/images/grain-crewneck.jpg', '/images/dune-sweater.jpg', '/images/ribbed-crewneck.jpg'],
      stock: { S: 0, M: 0, L: 0, XL: 0 },
      fabric: { composition: 'Textured cotton knit', care: 'Cold wash. Lay flat to dry.' },
    },
    {
      name: 'The Dune Sweater',
      shortDesc: 'Chunky ribbed knit. Neutral palette. Relaxed fit.',
      description: "Chunky ribbed knit in a neutral that goes with everything. Relaxed fit, slightly cropped. The fabric tells the whole story.",
      price: 3499,
      category: 'Knits',
      status: 'coming-soon',
      sizes: ['S', 'M', 'L', 'XL'],
      image: '/images/dune-sweater.jpg',
      images: ['/images/dune-sweater.jpg', '/images/ribbed-crewneck.jpg', '/images/grain-crewneck.jpg', '/images/slate-overshirt.jpg'],
      stock: { S: 0, M: 0, L: 0, XL: 0 },
      fabric: { composition: 'Chunky ribbed cotton-wool blend', care: 'Hand wash cold. Lay flat to dry.' },
    },
  ]);
  console.log(`${products.length} products created`);

  // Set related products
  await Product.findByIdAndUpdate(products[0]._id, { related: [products[1]._id, products[2]._id] });
  await Product.findByIdAndUpdate(products[1]._id, { related: [products[0]._id, products[2]._id] });

  // ── Counter ──
  await Counter.create({ name: 'orderId', value: 7 });

  // ── Orders ──
  const orders = await Order.insertMany([
    {
      orderId: 'OOPS-000001',
      user: null,
      items: [{ productId: products[0]._id, name: 'The Grain Crewneck', price: 2499, qty: 2, size: 'M', image: '/images/grain-crewneck.jpg' }],
      shipping: { fullName: 'Rahul Sharma', phone: '9876543210', address1: '123 MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      paymentMethod: 'prepaid',
      subtotal: 4998,
      codFee: 0,
      total: 4998,
      status: 'delivered',
      statusHistory: [
        { status: 'placed', changedAt: new Date('2026-04-15') },
        { status: 'processing', changedAt: new Date('2026-04-16') },
        { status: 'shipped', changedAt: new Date('2026-04-17') },
        { status: 'out-for-delivery', changedAt: new Date('2026-04-19') },
        { status: 'delivered', changedAt: new Date('2026-04-20') },
      ],
    },
    {
      orderId: 'OOPS-000002',
      user: null,
      items: [{ productId: products[1]._id, name: 'The Slate Overshirt', price: 2999, qty: 1, size: 'L', image: '/images/slate-overshirt.jpg' }],
      shipping: { fullName: 'Priya Patel', phone: '9876543211', address1: '456 Brigade Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
      paymentMethod: 'cod',
      subtotal: 2999,
      codFee: 49,
      total: 3048,
      status: 'shipped',
      statusHistory: [
        { status: 'placed', changedAt: new Date('2026-04-22') },
        { status: 'processing', changedAt: new Date('2026-04-23') },
        { status: 'shipped', changedAt: new Date('2026-04-24') },
      ],
    },
    {
      orderId: 'OOPS-000003',
      user: null,
      items: [
        { productId: products[0]._id, name: 'The Grain Crewneck', price: 2499, qty: 1, size: 'S', image: '/images/grain-crewneck.jpg' },
        { productId: products[2]._id, name: 'The Fog Knit Tee', price: 1999, qty: 1, size: 'M', image: '/images/fog-knit-tee.jpg' },
      ],
      shipping: { fullName: 'Ankit Verma', phone: '9876543212', address1: '789 Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
      paymentMethod: 'prepaid',
      subtotal: 4498,
      codFee: 0,
      total: 4498,
      status: 'processing',
      statusHistory: [
        { status: 'placed', changedAt: new Date('2026-04-26') },
        { status: 'processing', changedAt: new Date('2026-04-27') },
      ],
    },
    {
      orderId: 'OOPS-000004',
      user: null,
      items: [{ productId: products[1]._id, name: 'The Slate Overshirt', price: 2999, qty: 2, size: 'XL', image: '/images/slate-overshirt.jpg' }],
      shipping: { fullName: 'Rahul Sharma', phone: '9876543210', address1: '123 MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      paymentMethod: 'prepaid',
      subtotal: 5998,
      codFee: 0,
      total: 5998,
      status: 'placed',
      statusHistory: [{ status: 'placed', changedAt: new Date('2026-04-28') }],
    },
    {
      orderId: 'OOPS-000005',
      user: null,
      items: [{ productId: products[2]._id, name: 'The Fog Knit Tee', price: 1999, qty: 1, size: 'L', image: '/images/fog-knit-tee.jpg' }],
      shipping: { fullName: 'Sneha Reddy', phone: '9876543213', address1: '321 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033' },
      paymentMethod: 'cod',
      subtotal: 1999,
      codFee: 49,
      total: 2048,
      status: 'out-for-delivery',
      statusHistory: [
        { status: 'placed', changedAt: new Date('2026-04-20') },
        { status: 'processing', changedAt: new Date('2026-04-21') },
        { status: 'shipped', changedAt: new Date('2026-04-22') },
        { status: 'out-for-delivery', changedAt: new Date('2026-04-25') },
      ],
    },
    {
      orderId: 'OOPS-000006',
      user: null,
      items: [{ productId: products[0]._id, name: 'The Grain Crewneck', price: 2499, qty: 3, size: 'L', image: '/images/grain-crewneck.jpg' }],
      shipping: { fullName: 'Deepika Nair', phone: '9876543214', address1: '55 Marine Drive', city: 'Kochi', state: 'Kerala', pincode: '682001' },
      paymentMethod: 'prepaid',
      subtotal: 7497,
      codFee: 0,
      total: 7497,
      status: 'delivered',
      statusHistory: [
        { status: 'placed', changedAt: new Date('2026-04-10') },
        { status: 'processing', changedAt: new Date('2026-04-11') },
        { status: 'shipped', changedAt: new Date('2026-04-12') },
        { status: 'out-for-delivery', changedAt: new Date('2026-04-14') },
        { status: 'delivered', changedAt: new Date('2026-04-15') },
      ],
    },
    {
      orderId: 'OOPS-000007',
      user: null,
      items: [
        { productId: products[1]._id, name: 'The Slate Overshirt', price: 2999, qty: 1, size: 'M', image: '/images/slate-overshirt.jpg' },
        { productId: products[0]._id, name: 'The Grain Crewneck', price: 2499, qty: 1, size: 'M', image: '/images/grain-crewneck.jpg' },
      ],
      shipping: { fullName: 'Priya Patel', phone: '9876543211', address1: '456 Brigade Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
      paymentMethod: 'cod',
      subtotal: 5498,
      codFee: 49,
      total: 5547,
      status: 'placed',
      statusHistory: [{ status: 'placed', changedAt: new Date('2026-04-29') }],
    },
  ]);
  console.log(`${orders.length} orders created`);

  // ── Default config ──
  await Config.insertMany([
    {
      key: 'email-triggers',
      value: {
        placed: true,
        processing: false,
        shipped: true,
        'out-for-delivery': false,
        delivered: true,
      },
    },
    {
      key: 'gmail-connection',
      value: null,
    },
  ]);
  console.log('Default config created');

  console.log('\nSeed complete!');
  console.log('Admin login: admin@oopsfashion.com / admin123');
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

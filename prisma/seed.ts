import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Idempotent: wipe and reseed so `npm run seed` always gives a known state.
  await prisma.emailLog.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.task.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.budgetLine.deleteMany();
  await prisma.config.deleteMany();

  await prisma.config.create({
    data: {
      date: "2027-04-17",
      backupDate: "2027-04-24",
      location: "Stanfordville, New York",
      venue: "",
      guestTarget: 110,
      budgetMin: 25000,
      budgetMax: 35000,
      partner1Name: "Katie",
      partner2Name: "Me",
      partner1Email: "",
      partner2Email: "",
    },
  });

  await prisma.guest.createMany({
    data: [
      { name: "Sarah & Tom Bennett", party: "Bennett family", side: "Partner1", rsvp: "Yes", email: "sarah.bennett@example.com" },
      { name: "Grandma Rose", party: "Bennett family", side: "Partner1", rsvp: "Yes" },
      { name: "Uncle Pete", party: "Bennett family", side: "Partner1", rsvp: "Maybe" },
      { name: "James Carter", party: "College friends", side: "Partner2", rsvp: "Yes", email: "jcarter@example.com" },
      { name: "Maya Patel +1", party: "College friends", side: "Partner2", rsvp: "Pending" },
      { name: "The Okafor family", party: "Neighbors", side: "Both", rsvp: "Pending" },
      { name: "Lena & Mark", party: "Work (Katie)", side: "Partner1", rsvp: "No", notes: "Out of the country" },
      { name: "Danny Rivera", party: "Work (Me)", side: "Partner2", rsvp: "Yes" },
    ],
  });

  await prisma.budgetLine.createMany({
    data: [
      { category: "Venue", item: "Reception venue + tables/chairs", estCost: 12000, actualCost: null, paid: false },
      { category: "Catering", item: "Dinner & service (110 guests)", estCost: 8800, paid: false },
      { category: "Catering", item: "Bar package", estCost: 3200, paid: false },
      { category: "Photography", item: "Photographer (8 hrs)", estCost: 3500, actualCost: 3500, paid: true },
      { category: "Music", item: "DJ + ceremony sound", estCost: 1800, paid: false },
      { category: "Attire", item: "Wedding dress + alterations", estCost: 2200, actualCost: 2450, paid: true },
      { category: "Attire", item: "Suit", estCost: 700, paid: false },
      { category: "Flowers", item: "Bouquets + centerpieces", estCost: 2400, paid: false },
      { category: "Cake", item: "Cake + dessert table", estCost: 900, paid: false },
      { category: "Stationery", item: "Invitations + save-the-dates", estCost: 650, actualCost: 610, paid: true },
    ],
  });

  await prisma.task.createMany({
    data: [
      { title: "Finalize guest list", owner: "Both", due: "2026-07-15", status: "Doing", category: "Guests" },
      { title: "Tour shortlisted venues", owner: "Partner1", due: "2026-07-01", status: "Doing", category: "Venue" },
      { title: "Book photographer", owner: "Partner2", due: "2026-06-30", status: "Done", category: "Vendors" },
      { title: "Send save-the-dates", owner: "Partner1", due: "2026-09-01", status: "Todo", category: "Stationery" },
      { title: "Choose caterer & menu tasting", owner: "Both", due: "2026-08-15", status: "Todo", category: "Catering" },
      { title: "Order wedding dress", owner: "Partner1", due: "2026-08-01", status: "Done", category: "Attire" },
      { title: "Get fitted for suit", owner: "Partner2", due: "2026-11-01", status: "Todo", category: "Attire" },
      { title: "Book DJ", owner: "Partner2", due: "2026-09-15", status: "Todo", category: "Vendors" },
      { title: "Coordinate day-of timeline", owner: "Coordinator", due: "2027-03-01", status: "Todo", category: "Logistics" },
      { title: "Confirm floral order", owner: "Vendor", due: "2027-03-20", status: "Todo", category: "Flowers" },
      { title: "Plan ceremony readings", owner: "Both", due: "2027-02-01", status: "Todo", category: "Ceremony" },
      { title: "Set up wedding website", owner: "Partner2", due: "2026-08-20", status: "Doing", category: "Stationery" },
    ],
  });

  await prisma.vendor.createMany({
    data: [
      { name: "Evergreen Photography", category: "Photography", status: "Booked", cost: 3500, contact: "hello@evergreenphoto.example", url: "https://evergreenphoto.example" },
      { name: "Garden Table Catering", category: "Catering", status: "Contacted", cost: 12000, contact: "events@gardentable.example" },
      { name: "Spin City DJs", category: "Music", status: "Researching", cost: 1800 },
      { name: "Petal & Stem Florals", category: "Flowers", status: "Contacted", cost: 2400, contact: "petalstem@example.com" },
      { name: "Sweet Layers Bakery", category: "Cake", status: "Researching", cost: 900 },
      { name: "Day-Of Coordination Co.", category: "Planning", status: "Booked", cost: 1500, contact: "book@dayofco.example" },
    ],
  });

  await prisma.venue.createMany({
    data: [
      {
        name: "The Old Mill Barn",
        location: "Hudson Valley, NY",
        capacity: 140,
        estCost: 11000,
        pricePerHead: null,
        status: "Shortlist",
        url: "https://oldmillbarn.example",
        contact: "events@oldmillbarn.example",
        pros: "Rustic charm, on-site lodging, beautiful grounds",
        cons: "Hour from the city, rain plan limited",
        source: "manual",
      },
      {
        name: "Riverside Loft",
        location: "Brooklyn, NY",
        capacity: 90,
        estCost: 14000,
        pricePerHead: 120,
        status: "Toured",
        url: "https://riversideloft.example",
        contact: "booking@riversideloft.example",
        pros: "Skyline views, easy for city guests, modern",
        cons: "Capacity tight for our list, pricey bar minimum",
        source: "manual",
      },
      {
        name: "Lakeside Pavilion",
        location: "Princeton, NJ",
        capacity: 160,
        estCost: 9500,
        pricePerHead: null,
        status: "Considering",
        url: "https://lakesidepavilion.example",
        pros: "Affordable, big capacity, lakeside ceremony spot",
        cons: "Dated interior, need outside caterer",
        source: "manual",
      },
    ],
  });

  console.log("Seed complete: config, 8 guests, 10 budget lines, 12 tasks, 6 vendors, 3 venues.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

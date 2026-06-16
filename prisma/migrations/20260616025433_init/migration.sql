-- CreateTable
CREATE TABLE "Config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "backupDate" TEXT,
    "location" TEXT NOT NULL DEFAULT '',
    "venue" TEXT NOT NULL DEFAULT '',
    "guestTarget" INTEGER NOT NULL DEFAULT 100,
    "budgetMin" INTEGER NOT NULL DEFAULT 0,
    "budgetMax" INTEGER NOT NULL DEFAULT 0,
    "partner1Name" TEXT NOT NULL DEFAULT 'Katie',
    "partner2Name" TEXT NOT NULL DEFAULT 'Me',
    "partner1Email" TEXT,
    "partner2Email" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL DEFAULT '',
    "item" TEXT NOT NULL,
    "estCost" INTEGER NOT NULL DEFAULT 0,
    "actualCost" INTEGER,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "party" TEXT NOT NULL DEFAULT '',
    "side" TEXT NOT NULL DEFAULT 'Both',
    "rsvp" TEXT NOT NULL DEFAULT 'Pending',
    "email" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "owner" TEXT NOT NULL DEFAULT 'Both',
    "due" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Todo',
    "category" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Researching',
    "cost" INTEGER,
    "contact" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "lat" REAL,
    "lng" REAL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "estCost" INTEGER NOT NULL DEFAULT 0,
    "pricePerHead" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Considering',
    "url" TEXT NOT NULL DEFAULT '',
    "contact" TEXT NOT NULL DEFAULT '',
    "pros" TEXT NOT NULL DEFAULT '',
    "cons" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "recipients" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,
    "snapshot" TEXT NOT NULL DEFAULT '{}'
);

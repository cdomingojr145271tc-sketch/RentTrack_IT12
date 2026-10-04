import { customers } from "../data/customers";
import { vehicles } from "../data/vehicles";

const DATABASE_VERSION = 1;

export async function initializeDatabase(db) {
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  const versionRow = await db.getFirstAsync("PRAGMA user_version;");
  let currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          phone TEXT UNIQUE,
          email TEXT UNIQUE,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vehicles (
          id INTEGER PRIMARY KEY NOT NULL,
          brand TEXT NOT NULL,
          model TEXT NOT NULL,
          vehicle_type TEXT NOT NULL,
          plate_number TEXT UNIQUE,
          daily_rate INTEGER NOT NULL CHECK (daily_rate >= 0),
          status TEXT NOT NULL DEFAULT 'AVAILABLE'
            CHECK (status IN ('AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE')),
          image_uri TEXT,
          image_asset_key TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY NOT NULL,
          booking_code TEXT NOT NULL UNIQUE,
          customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
          vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
          pickup_at TEXT NOT NULL,
          return_at TEXT NOT NULL CHECK (return_at > pickup_at),
          total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
          status TEXT NOT NULL DEFAULT 'RESERVED'
            CHECK (status IN ('RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS bookings_vehicle_dates_idx
          ON bookings (vehicle_id, pickup_at, return_at);
        CREATE INDEX IF NOT EXISTS bookings_customer_idx
          ON bookings (customer_id);

        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY NOT NULL,
          booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
          amount INTEGER NOT NULL CHECK (amount > 0),
          currency TEXT NOT NULL DEFAULT 'PHP',
          method TEXT NOT NULL CHECK (method IN ('CASH', 'GCASH', 'CARD', 'OTHER')),
          status TEXT NOT NULL DEFAULT 'PENDING'
            CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
          reference TEXT,
          paid_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TRIGGER IF NOT EXISTS bookings_prevent_overlap_insert
        BEFORE INSERT ON bookings
        WHEN NEW.status IN ('RESERVED', 'ACTIVE')
        BEGIN
          SELECT RAISE(ABORT, 'Vehicle is already booked for this period')
          WHERE EXISTS (
            SELECT 1 FROM bookings
            WHERE vehicle_id = NEW.vehicle_id
              AND status IN ('RESERVED', 'ACTIVE')
              AND NEW.pickup_at < return_at
              AND NEW.return_at > pickup_at
          );
        END;

        CREATE TRIGGER IF NOT EXISTS bookings_prevent_overlap_update
        BEFORE UPDATE OF vehicle_id, pickup_at, return_at, status ON bookings
        WHEN NEW.status IN ('RESERVED', 'ACTIVE')
        BEGIN
          SELECT RAISE(ABORT, 'Vehicle is already booked for this period')
          WHERE EXISTS (
            SELECT 1 FROM bookings
            WHERE id <> NEW.id
              AND vehicle_id = NEW.vehicle_id
              AND status IN ('RESERVED', 'ACTIVE')
              AND NEW.pickup_at < return_at
              AND NEW.return_at > pickup_at
          );
        END;
      `);

      for (const vehicle of vehicles) {
        await db.runAsync(
          `INSERT OR IGNORE INTO vehicles
            (id, brand, model, vehicle_type, daily_rate, status, image_asset_key)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          vehicle.id,
          vehicle.brand,
          vehicle.name,
          "Car",
          vehicle.price,
          vehicle.status,
          vehicle.imageAssetKey
        );
      }

      for (const customer of customers) {
        await db.runAsync(
          `INSERT OR IGNORE INTO customers (id, name, phone)
           VALUES (?, ?, ?)`,
          customer.id,
          customer.name,
          customer.phone
        );
      }

      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
    });
    currentVersion = DATABASE_VERSION;
  }

  if (currentVersion > DATABASE_VERSION) {
    throw new Error("RentTrack database version is newer than this app supports.");
  }
}

const VEHICLE_SELECT = `
  SELECT
    id,
    brand,
    model,
    model AS name,
    vehicle_type AS vehicleType,
    plate_number AS plateNumber,
    daily_rate AS price,
    status,
    image_uri AS imageUri,
    image_asset_key AS imageAssetKey
  FROM vehicles
`;

export function getVehicles(db) {
  return db.getAllAsync(`${VEHICLE_SELECT} ORDER BY id`);
}

export function getVehicleById(db, id) {
  return db.getFirstAsync(`${VEHICLE_SELECT} WHERE id = ?`, Number(id));
}

export async function createVehicle(db, vehicle) {
  const result = await db.runAsync(
    `INSERT INTO vehicles
      (brand, model, vehicle_type, plate_number, daily_rate, image_uri)
     VALUES (?, ?, ?, ?, ?, ?)`,
    vehicle.brand.trim(),
    vehicle.model.trim(),
    vehicle.vehicleType.trim(),
    vehicle.plateNumber.trim(),
    vehicle.dailyRate,
    vehicle.imageUri ?? null
  );

  return result.lastInsertRowId;
}

export function getCustomers(db) {
  return db.getAllAsync(
    `SELECT id, name, phone, email FROM customers ORDER BY name`
  );
}

export async function createCustomer(db, customer) {
  const result = await db.runAsync(
    `INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)`,
    customer.name.trim(),
    customer.phone?.trim() || null,
    customer.email?.trim() || null
  );

  return result.lastInsertRowId;
}

export async function createBooking(db, booking) {
  const result = await db.runAsync(
    `INSERT INTO bookings
      (booking_code, customer_id, vehicle_id, pickup_at, return_at, total_amount, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    booking.bookingCode,
    booking.customerId,
    booking.vehicleId,
    new Date(booking.pickupAt).toISOString(),
    new Date(booking.returnAt).toISOString(),
    booking.totalAmount,
    booking.status ?? "RESERVED",
    booking.notes ?? null
  );

  return result.lastInsertRowId;
}

export function getBookings(db) {
  return db.getAllAsync(`
    SELECT
      bookings.id,
      bookings.booking_code AS bookingCode,
      bookings.customer_id AS customerId,
      customers.name AS customerName,
      bookings.vehicle_id AS vehicleId,
      vehicles.brand || ' ' || vehicles.model AS vehicleName,
      vehicles.plate_number AS plateNumber,
      bookings.pickup_at AS pickupAt,
      bookings.return_at AS returnAt,
      bookings.total_amount AS totalAmount,
      bookings.status
    FROM bookings
    JOIN customers ON customers.id = bookings.customer_id
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    ORDER BY bookings.pickup_at DESC
  `);
}

export async function createPayment(db, payment) {
  const result = await db.runAsync(
    `INSERT INTO payments (booking_id, amount, currency, method, status, reference, paid_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    payment.bookingId,
    payment.amount,
    payment.currency ?? "PHP",
    payment.method,
    payment.status ?? "PENDING",
    payment.reference ?? null,
    payment.paidAt ? new Date(payment.paidAt).toISOString() : null
  );

  return result.lastInsertRowId;
}
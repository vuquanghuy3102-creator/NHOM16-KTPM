const bcrypt = require("bcryptjs");
const { getDb } = require("./db");

const SAMPLE_HOTELS = [
  {
    name: "Pangu Grand Hà Nội",
    address: "18 Hàng Trống, Hoàn Kiếm",
    city: "Hà Nội",
    description: "Khách sạn trung tâm phố cổ, phù hợp nghỉ dưỡng, công tác và khám phá hồ Hoàn Kiếm.",
    keywords: "pangu grand ha noi phố cổ hoàn kiếm trung tâm business luxury hồ gươm",
    star: 5,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    rooms: [
      ["101", "Standard", 650000, 2, "Phòng tiêu chuẩn, 1 giường đôi."],
      ["205", "Deluxe City View", 1100000, 2, "Phòng deluxe nhìn thành phố."],
      ["801", "Executive Suite", 2200000, 4, "Suite cao cấp, phòng khách riêng."]
    ]
  },
  {
    name: "Pangu West Lake",
    address: "68 Từ Hoa, Tây Hồ",
    city: "Hà Nội",
    description: "Không gian yên tĩnh cạnh Hồ Tây, nổi bật với phòng hướng hồ và khu nghỉ dưỡng cao cấp.",
    keywords: "pangu west lake hồ tây tây hồ lake view resort luxury couple",
    star: 5,
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    rooms: [
      ["302", "Superior", 900000, 2, "Phòng superior hiện đại."],
      ["505", "Lake View Deluxe", 1450000, 2, "Ban công nhìn Hồ Tây."],
      ["909", "Pangu Suite", 2800000, 4, "Suite cao cấp hướng hồ."]
    ]
  },
  {
    name: "Pangu Ocean Đà Nẵng",
    address: "120 Võ Nguyên Giáp, Sơn Trà",
    city: "Đà Nẵng",
    description: "Khách sạn sát biển với phòng rộng rãi, hồ bơi và tầm nhìn biển Mỹ Khê.",
    keywords: "pangu ocean đà nẵng biển mỹ khê son tra beach sea view family",
    star: 5,
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
    rooms: [
      ["108", "Standard", 700000, 2, "Phòng tiêu chuẩn gần biển."],
      ["606", "Ocean View Deluxe", 1350000, 2, "Phòng hướng biển Mỹ Khê."],
      ["1001", "Family Suite", 2400000, 4, "Suite gia đình rộng rãi."]
    ]
  },
  {
    name: "Pangu Heritage Huế",
    address: "27 Lê Lợi, Thuận Hóa",
    city: "Huế",
    description: "Phong cách di sản thanh lịch, thuận tiện tham quan Đại Nội và sông Hương.",
    keywords: "pangu heritage huế di sản đại nội sông hương heritage culture quiet",
    star: 4,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
    rooms: [
      ["201", "Classic", 520000, 2, "Phòng cổ điển ấm cúng."],
      ["405", "Heritage Deluxe", 950000, 2, "Thiết kế lấy cảm hứng từ di sản Huế."],
      ["707", "River Suite", 1750000, 3, "Suite nhìn về phía sông Hương."]
    ]
  },
  {
    name: "Pangu Nha Trang Bay",
    address: "88 Trần Phú, Lộc Thọ",
    city: "Khánh Hòa",
    description: "Khách sạn ven vịnh Nha Trang, phù hợp nghỉ biển, cặp đôi và gia đình.",
    keywords: "pangu nha trang bay khánh hòa trần phú beach biển family couple resort",
    star: 4,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
    rooms: [
      ["115", "Standard", 600000, 2, "Phòng tiêu chuẩn tiện nghi."],
      ["612", "Bay View", 1250000, 2, "Phòng nhìn vịnh Nha Trang."],
      ["818", "Family Deluxe", 1900000, 4, "Phòng lớn dành cho gia đình."]
    ]
  },
  {
    name: "Pangu Central Sài Gòn",
    address: "45 Lê Thánh Tôn, Quận 1",
    city: "TP. Hồ Chí Minh",
    description: "Vị trí trung tâm Quận 1, thuận tiện công tác, mua sắm và khám phá thành phố.",
    keywords: "pangu central sài gòn ho chi minh quận 1 business shopping city center",
    star: 4,
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80",
    rooms: [
      ["120", "Standard", 750000, 2, "Phòng tiêu chuẩn trung tâm."],
      ["520", "Business Deluxe", 1250000, 2, "Phù hợp khách công tác."],
      ["920", "Executive Suite", 2300000, 4, "Suite cao cấp tại Quận 1."]
    ]
  },
  {
    name: "Pangu Hạ Long View",
    address: "12 Hạ Long, Bãi Cháy",
    city: "Quảng Ninh",
    description: "Khách sạn hướng vịnh Hạ Long, gần khu vui chơi và bến tàu tham quan.",
    keywords: "pangu hạ long quảng ninh bãi cháy vịnh bay view cruise family",
    star: 4,
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    rooms: [
      ["118", "Standard", 580000, 2, "Phòng tiêu chuẩn."],
      ["518", "Bay View Deluxe", 1150000, 2, "Phòng hướng vịnh."],
      ["718", "Family Suite", 1850000, 4, "Suite dành cho gia đình."]
    ]
  },
  {
    name: "Pangu Đà Lạt Garden",
    address: "31 Trần Hưng Đạo, Phường Xuân Hương",
    city: "Lâm Đồng",
    description: "Khách sạn phong cách vườn giữa khí hậu Đà Lạt mát mẻ, phù hợp nghỉ dưỡng cuối tuần.",
    keywords: "pangu đà lạt garden lâm đồng resort garden romantic mountain weekend",
    star: 4,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    rooms: [
      ["103", "Garden Room", 550000, 2, "Phòng nhìn vườn."],
      ["303", "Deluxe Balcony", 980000, 2, "Phòng có ban công."],
      ["603", "Garden Suite", 1680000, 3, "Suite yên tĩnh nhìn vườn."]
    ]
  }
];

async function ensureHotelKeywordsColumn(db) {
  const columns = await db.all("PRAGMA table_info(hotels)");
  if (!columns.some(col => col.name === "keywords")) {
    await db.exec("ALTER TABLE hotels ADD COLUMN keywords TEXT");
  }
}

async function seedHotel(db, hotel) {
  const existing = await db.get("SELECT id FROM hotels WHERE name = ?", [hotel.name]);
  let hotelId;

  if (existing) {
    hotelId = existing.id;
    await db.run(
      `UPDATE hotels SET address=?, city=?, description=?, keywords=?, star_rating=?, image=? WHERE id=?`,
      [hotel.address, hotel.city, hotel.description, hotel.keywords, hotel.star, hotel.image, hotelId]
    );
  } else {
    const result = await db.run(
      `INSERT INTO hotels(name,address,city,description,keywords,star_rating,image)
       VALUES(?,?,?,?,?,?,?)`,
      [hotel.name, hotel.address, hotel.city, hotel.description, hotel.keywords, hotel.star, hotel.image]
    );
    hotelId = result.lastID;
  }

  for (const room of hotel.rooms) {
    const [number, type, price, capacity, description] = room;
    const currentRoom = await db.get(
      "SELECT id FROM rooms WHERE hotel_id=? AND room_number=?",
      [hotelId, number]
    );
    if (!currentRoom) {
      await db.run(
        `INSERT INTO rooms(hotel_id,room_number,room_type,price,capacity,description,status)
         VALUES(?,?,?,?,?,?,'AVAILABLE')`,
        [hotelId, number, type, price, capacity, description]
      );
    }
  }
}

async function initDatabase() {
  const db = await getDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CUSTOMER',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      date_of_birth TEXT,
      identity_number TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      description TEXT,
      keywords TEXT,
      star_rating INTEGER NOT NULL DEFAULT 3,
      image TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER NOT NULL,
      room_number TEXT NOT NULL,
      room_type TEXT NOT NULL,
      price REAL NOT NULL,
      capacity INTEGER NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'AVAILABLE',
      image TEXT,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
      UNIQUE(hotel_id, room_number)
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      guests INTEGER NOT NULL,
      total_price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
  `);

  await ensureHotelKeywordsColumn(db);

  const userCount = await db.get("SELECT COUNT(*) AS count FROM users");
  if (Number(userCount.count) === 0) {
    const adminPassword = await bcrypt.hash("Admin123!", 10);
    const userPassword = await bcrypt.hash("User123!", 10);

    const adminResult = await db.run(
      "INSERT INTO users(email,password,role) VALUES(?,?,'ADMIN')",
      ["admin@hotel.test", adminPassword]
    );
    await db.run(
      "INSERT INTO customers(user_id,full_name,phone,address) VALUES(?,?,?,?)",
      [adminResult.lastID, "System Administrator", "0900000000", "Hà Nội"]
    );

    const userResult = await db.run(
      "INSERT INTO users(email,password,role) VALUES(?,?,'CUSTOMER')",
      ["user@hotel.test", userPassword]
    );
    await db.run(
      "INSERT INTO customers(user_id,full_name,phone,address) VALUES(?,?,?,?)",
      [userResult.lastID, "Nguyễn Văn An", "0912345678", "Hà Nội"]
    );
  }

  for (const hotel of SAMPLE_HOTELS) await seedHotel(db, hotel);

  console.log("Database initialized with Pangu sample hotels.");
}

module.exports = { initDatabase };

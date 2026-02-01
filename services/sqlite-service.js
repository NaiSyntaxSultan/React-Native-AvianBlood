import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("avianblood.db");

// สร้าง Table ลง SQLite
export const initDB = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        username TEXT,
        password TEXT,
        email TEXT,
        phone_number TEXT,
        avatar_uri TEXT,
        role TEXT DEFAULT 'user',
        firebase_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_synced INTEGER DEFAULT 0
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS PendingUploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_id TEXT,
        image_path TEXT, 
        original_filename TEXT,
        batch_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.execSync(`
  CREATE TABLE IF NOT EXISTS PendingDeletes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_id TEXT,
        image_id TEXT,  -- สำหรับลบรูปเดี่ยว (Predict)
        batch_id TEXT,  -- สำหรับลบกลุ่ม (History)
        doc_ids TEXT,   -- สำหรับลบกลุ่ม (History)
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

    db.execSync(`
  CREATE TABLE IF NOT EXISTS PendingPredicts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
  firebase_id TEXT,
  payload TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.execSync(`
      CREATE TABLE IF NOT EXISTS CachedPosts (
        id TEXT PRIMARY KEY,
        data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("SQLite is Connect Already By NaiDev");
  } catch (err) {
    console.error(err);
  }
};

// Code

export const saveLocalUser = async (data) => {
  const {
    name,
    username,
    email,
    password,
    phone_number,
    avatar_uri,
    role,
    firebase_id,
    is_synced,
  } = data;

  try {
    await db.runAsync("DELETE FROM Users");

    await db.runAsync(
      "INSERT INTO Users (name, username, email, password, phone_number, avatar_uri, role, firebase_id, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        username,
        email,
        password,
        phone_number,
        avatar_uri || "",
        role || "user",
        firebase_id,
        is_synced,
      ],
    );

    console.log("Save User to local DB");
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const getLocalUser = () => {
  try {
    const user = db.getFirstSync("SELECT * FROM Users LIMIT 1");
    return user;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const logoutLocalUser = () => {
  try {
    db.runSync("DELETE FROM Users");
    console.log("User Logout");
  } catch (err) {
    console.error(err);
  }
};

export const savePendingUpload = async (data) => {
  try {
    const existing = await db.getFirstAsync(
      "SELECT * FROM PendingUploads WHERE original_filename = ? AND batch_id = ?",
      [data.original_filename, data.batch_id],
    );

    if (existing) {
      console.log("Duplicate pending upload ignored:", data.original_filename);
      return true;
    }

    await db.runAsync(
      "INSERT INTO PendingUploads (firebase_id, image_path, original_filename, batch_id) VALUES (?, ?, ?, ?)",
      [
        data.firebase_id,
        data.image_path,
        data.original_filename,
        data.batch_id,
      ],
    );
    console.log("Saved pending upload to SQLite");
    return true;
  } catch (err) {
    console.error("Save Pending Upload Error:", err);
    return false;
  }
};

export const getPendingUploads = async () => {
  try {
    const results = await db.getAllAsync("SELECT * FROM PendingUploads");
    return results;
  } catch (err) {
    console.error("Get Pending Uploads Error:", err);
    return [];
  }
};

export const deletePendingUpload = async (id) => {
  try {
    await db.runAsync("DELETE FROM PendingUploads WHERE id = ?", [id]);
    return true;
  } catch (err) {
    console.error("Delete Pending Upload Error:", err);
    return false;
  }
};

export const savePendingDelete = async (batchId, docIds) => {
  try {
    const existing = await db.getFirstAsync(
      "SELECT id FROM PendingDeletes WHERE batch_id = ?",
      [batchId],
    );

    if (existing) return true; // กันซ้ำ

    await db.runAsync(
      "INSERT INTO PendingDeletes (batch_id, doc_ids) VALUES (?, ?)",
      [batchId, JSON.stringify(docIds)],
    );
    return true;
  } catch (err) {
    console.error("Save Pending Delete Error:", err);
    return false;
  }
};

export const getPendingDeletes = async () => {
  try {
    return await db.getAllAsync("SELECT * FROM PendingDeletes");
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const deletePendingDelete = async (id) => {
  try {
    await db.runAsync("DELETE FROM PendingDeletes WHERE id = ?", [id]);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};


export const savePendingPredict = async (firebaseId, payload) => {
  await db.runAsync(
    "INSERT INTO PendingPredicts (firebase_id, payload) VALUES (?, ?)",
    [firebaseId, JSON.stringify(payload)]
  );
};

export const getPendingPredicts = async () => {
  return await db.getAllAsync("SELECT * FROM PendingPredicts");
};

export const deletePendingPredict = async (id) => {
  await db.runAsync("DELETE FROM PendingPredicts WHERE id = ?", [id]);
};

export const savePendingDeleteImage = async ({ firebase_id, image_id }) => {
  try {
    await db.runAsync(
      "INSERT INTO PendingDeletes (firebase_id, image_id) VALUES (?, ?)",
      [firebase_id, image_id]
    );
    return true;
  } catch (err) {
    console.error("Save Pending Delete Image Error:", err);
    return false;
  }
};

export const saveCachedPosts = async (posts) => {
  try {
    await db.runAsync("DELETE FROM CachedPosts");
    for (const post of posts) {
      await db.runAsync(
        "INSERT OR REPLACE INTO CachedPosts (id, data) VALUES (?, ?)",
        [post.id, JSON.stringify(post)]
      );
    }
  } catch (err) {
    console.error("Save Cached Posts Error:", err);
  }
};

export const getCachedPosts = async () => {
  try {
    const result = await db.getAllAsync("SELECT data FROM CachedPosts");
    return result.map((row) => JSON.parse(row.data));
  } catch (err) {
    console.error("Get Cached Posts Error:", err);
    return [];
  }
};
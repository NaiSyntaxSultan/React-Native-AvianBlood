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
    console.log("SQLite is Connect Already By NaiDev");
  } catch (err) {
    console.error(err);
  }
};

// Code

export const saveLocalUser = async (data) => {

    const { name, username, email, password, phone_number, avatar_uri, role, firebase_id, is_synced } = data;

    try {
        await db.runAsync(
            "DELETE FROM Users"
        )

        await db.runAsync(
            "INSERT INTO Users (name, username, email, password, phone_number, avatar_uri, role, firebase_id, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)",
            [
                name,
                username,
                email,
                password,
                phone_number,
                avatar_uri || "",
                role || "user",
                firebase_id,
                is_synced
            ]
        )


        console.log("Save User to local DB")
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }

}

export const getLocalUser = () => {
  try {
    const user = db.getFirstSync("SELECT * FROM Users LIMIT 1");
    return user;
  } catch(err) {
    console.error(err);
    return null;
  }
}

export const logoutLocalUser = () => {
  try {
    db.runSync("DELETE FROM Users");
    console.log("User Logout");
  } catch (err) {
    console.error(err);
  }
};

// export const updateLocalUserProfile = (name, username, email, password, phone_number, avatar_uri) => {
//   try {
//     db.runSync(
//       `UPDATE Users SET name = ?, username = ?, email = ?, password = ?, phone_number = ?, avatar_uri = ? , is_synced = 0`,
//       [name, username, email, password, phone_number, avatar_uri],
//     );
//     console.log("Profile updated locally");
//   } catch (err) {
//     console.error(err);
//   }
// };
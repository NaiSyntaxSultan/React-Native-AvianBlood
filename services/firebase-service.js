import { db } from "../config/firebase-config";
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";

export const createUser = async (data) => {
  try {
    const newUserRef = doc(collection(db, "Users"));

    const finalData = {
      ...data,          
      role: "user",         
      created_at: new Date(),
      updated_at: new Date(),
      avatar_uri: data.avatar_uri || "https://www.freeiconspng.com/uploads/go-back--gallery-for--contact-person-icon-png-21.png", 
    };

    await setDoc(newUserRef, finalData);

    console.log("User Created Success:", newUserRef.id);
    return finalData;
  } catch (err) {
    console.error("Create User Error:", err);
    return null;
  }
}

export const checkUser = async (email, password) => {
    try {
        const usersRef = collection(db, "Users");

        const q = query(
        usersRef,
        where("email", "==", email),
        where("password", "==", password),
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        return { ...userData, firebase_id: userDoc.id }
      } else {
      return null;
    }
    } catch(err) {
        console.error(err);
        return null;
    }
}

export const updateUser = async (firebaseId, data) => {
  try {
    if(!firebaseId) return;
    const userRef = doc(db, "Users", firebaseId);
    await updateDoc(userRef, {
      ...data,
      updated_at: new Date(),
    });
    console.log("User Updated");
  } catch(err) {
    console.error(err);
  }
}
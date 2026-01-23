import { db } from "../config/firebase-config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  orderBy,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

export const createUser = async (data) => {
  try {
    const newUserRef = doc(collection(db, "Users"));

    const finalData = {
      ...data,
      role: "user",
      created_at: new Date(),
      updated_at: new Date(),
      avatar_uri:
        data.avatar_uri ||
        "https://www.freeiconspng.com/uploads/go-back--gallery-for--contact-person-icon-png-21.png",
    };

    await setDoc(newUserRef, finalData);

    console.log("User Created Success:", newUserRef.id);
    return finalData;
  } catch (err) {
    console.error("Create User Error:", err);
    return null;
  }
};

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

      return { ...userData, firebase_id: userDoc.id };
    } else {
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const updateUser = async (firebaseId, data) => {
  try {
    if (!firebaseId) return;
    const userRef = doc(db, "Users", firebaseId);
    await updateDoc(userRef, {
      ...data,
      updated_at: new Date(),
    });
    console.log("User Updated");
  } catch (err) {
    console.error(err);
  }
};

export const readPost = async () => {
  try {
    const q = query(
      collection(db, "predictions"),
      orderBy("created_at", "desc"),
    );
    const querySnapshot = await getDocs(q);
    const posts = [];
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });
    return posts;
  } catch (err) {
    console.error("Read Post Error:", err);
    return [];
  }
};


// ฟังก์ชันดึงจำนวนรูปภาพที่มีอยู่ เพื่อเอามาทำ Running ID
export const getUploadedImageCount = async () => {
  try {
    const snapshot = await getDocs(collection(db, "uploaded_images"));
    return snapshot.size;
  } catch (err) {
    console.error("Error getting image count:", err);
    return 0;
  }
};

// ฟังก์ชันบันทึกข้อมูลรูปภาพลง Firestore
export const saveUploadedImage = async (data) => {
  try {

    const payload = {
      firebase_id: data.firebase_id,
      batch_id: data.batch_id,
      image_path: data.image_path,
      original_filename: data.original_filename,                 
      status: "Pending",             
      uploaded_at: serverTimestamp(),             
    }

    await addDoc(collection(db, "Uploaded_images"), payload);
    return true;
  } catch (err) {
    console.error("Save Image Error:", err);
    throw err;
  }
};

// ฟังก์ชันดึงประวัติและจัดกลุ่มข้อมูล
export const getHistoryData = async (userId) => {
  try {
    if (!userId) return [];

    const imagesQ = query(
      collection(db, "Uploaded_images"),
      where("firebase_id", "==", String(userId))
    );

    const predictionsQ = query(
      collection(db, "Predictions"),
      where("firebase_id", "==", String(userId))
    );
    const [imagesSnap, predictionsSnap] = await Promise.all([
      getDocs(imagesQ),
      getDocs(predictionsQ)
    ]);

    const predictionMap = {};
    predictionsSnap.forEach(doc => {
        const data = doc.data();
        if (data.batch_id) {
            predictionMap[data.batch_id] = data;
        }
    });

    const groups = {};

    imagesSnap.forEach((doc) =>{
      const imageData = doc.data();
      const groupKey = imageData.batch_id || doc.id;

      const predData = predictionMap[groupKey] || {};

      const displayData = { ...imageData, ...predData };

      if (!groups[groupKey]) {
        let formattedDate = "";
        const timestamp = imageData.uploaded_at || predData.created_at;
        if (timestamp && timestamp.seconds) {
           const date = new Date(timestamp.seconds * 1000);
           const day = date.getDate().toString().padStart(2, '0');
           const month = (date.getMonth() + 1).toString().padStart(2, '0');
           const year = date.getFullYear();
           const hours = date.getHours().toString().padStart(2, '0');
           const minutes = date.getMinutes().toString().padStart(2, '0');
           formattedDate = `${day}/${month}/${year}, ${hours}:${minutes}`;
        }

        let results = [];
        if (displayData.cell_type && Array.isArray(displayData.cell_type)) {
            results = displayData.cell_type.map((type, index) => ({
                cellType: type,
                confidence: displayData.confidence ? displayData.confidence[index] : 0,
                count: displayData.cell_count ? (Array.isArray(displayData.cell_count) ? displayData.cell_count[index] : 0) : "-"
            }));
        }

        groups[groupKey] = {
          id: groupKey, 
          docIds: [],   
          title: displayData.note || "รอการวิเคราะห์",
          datetime: formattedDate,
          status: displayData.status || "Pending",
          stain: displayData.stain_type || "",
          thumbnailUri: imageData.image_path, 
          images: [],
          results: results,
          note: displayData.note || "",
          
          age: displayData.age,
          weight: displayData.weight,
          chicken_id: displayData.chicken_id,
          total_cells: displayData.number_of_predicted || 0
        };
      }
      groups[groupKey].docIds.push(doc.id);

      if (imageData.image_path) {
        groups[groupKey].images.push(imageData.image_path);
      }
    });

    const groupedData = Object.values(groups);
    groupedData.sort((a, b) => {
        const parseDate = (str) => {
            if(!str) return new Date(0);
            const [d, t] = str.split(', ');
            const [day, month, year] = d.split('/');
            const [hour, minute] = t.split(':');
            return new Date(year, month - 1, day, hour, minute);
        };
        return parseDate(b.datetime) - parseDate(a.datetime);
    });
    return groupedData;
  } catch (error) {
    console.error("Get History Error:", error);
    return [];
  }
}

// ฟังก์ชันลบข้อมูล
export const deleteHistoryGroup = async (batchId, imageDocIds) => {
    try {
        const deletePromises = [];

        imageDocIds.forEach(docId => {
            deletePromises.push(deleteDoc(doc(db, "Uploaded_images", docId)));
        });

        if (batchId) {
            const q = query(
                collection(db, "Predictions"), 
                where("batch_id", "==", String(batchId))
            );

            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((docSnapshot) => {
                deletePromises.push(deleteDoc(doc(db, "Predictions", docSnapshot.id)));
            });
        }
        
        await Promise.all(deletePromises);
        return true;

    } catch (error) {
        console.error("Delete Error:", error);
        throw error;
    }
}
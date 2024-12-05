import { writeBatch, collection, query, orderBy, limit, getDocs, } from 'firebase/firestore';


 export async function deleteCollection(db, collectionPath, batchSize) {
    const collectionRef = collection(db, collectionPath);
    const delQuery = query(collectionRef, orderBy('__name__'), limit(batchSize));

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, delQuery, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db, delQuery, resolve) {
    const snapshot = await getDocs(delQuery);

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        //When there are no documents left, we are done
        resolve();
        return;
    }

    // Delete documents in a batch
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // CANT WORK IN WEB CLIENT 
    // process.nextTick(() => {
    //     deleteQueryBatch(db, query, resolve);
    //   });
}
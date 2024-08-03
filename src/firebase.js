import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, deleteDoc, query, where, getDocs, updateDoc } from "firebase/firestore";
import { deleteObject, getStorage, ref } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
}
const app = initializeApp(firebaseConfig)

export const firestore = getFirestore(app)

export const database = {
    tags: {
        add: async (tag) => {
            try {
                await addDoc(collection(firestore, "tags"), tag)
            } catch (e) {
                console.error("Error adding tag: ", e);
            }
        },
        get: (tagId) => {
            const docRef = doc(collection(firestore, "tags"), tagId)
            return getDoc(docRef)
        },
        remove: async (tagId, currentUser) => {

            const tagRef = doc(collection(firestore, "tags"), tagId)
            try {
                // delete tag
                await deleteDoc(tagRef)
            } catch (e) {
                console.error("Error deleting tag: ", e);
            }

            // remove deleted tag from files
            const childFilesQuery = query(collection(firestore, "files"), where("userId", "==", currentUser.uid), where("tags.id", "==", tagId))
            const childFiles = await getDocs(childFilesQuery)
            childFiles.forEach(doc => {
                try {
                    const data = doc.data();

                    // update file tags
                    updateDoc(doc.ref, {tags: {}})
                } catch (e) {
                    console.error('Error deleting a child file', e)
                }
            })
        },
        update: async (tagId, currentUser, changedTag) => {
            const tagRef = doc(collection(firestore, "tags"), tagId)
            try {
                await updateDoc(tagRef, changedTag)
            } catch (e) {
                console.error(e)
            }

            // update files assigned with this tag
            const childFilesQuery = query(collection(firestore, "files"), where("userId", "==", currentUser.uid), where("tags.id", "==", tagId))
            const childFiles = await getDocs(childFilesQuery)
            childFiles.forEach(doc => {
                try {
                    const data = doc.data();

                    // update file tags
                    updateDoc(doc.ref, {tags: changedTag})
                } catch (e) {
                    console.error('Error deleting a child file', e)
                }
            })
        },
        collection: collection(firestore, "tags")
    },
    folders: {
        add: async (folder) => {
            try {
                await addDoc(collection(firestore, "folders"), folder)
            } catch (e) {
                console.error("Error adding folder: ", e);
            }
        },
        get: (folderId) => {
            const docRef = doc(collection(firestore, "folders"), folderId)
            return getDoc(docRef)
        },
        remove: async (folderId, currentUser) => {

            const folderRef = doc(collection(firestore, "folders"), folderId)
            try {
                await deleteDoc(folderRef)
            } catch (e) {
                console.error("Error deleting folder: ", e);
            }

            // delete all the child files
            const childFilesQuery = query(collection(firestore, "files"), where("folderId", "==", folderId), where("userId", "==", currentUser.uid))
            const childFiles = await getDocs(childFilesQuery)
            childFiles.forEach(doc => {
                try {
                    deleteDoc(doc.ref)
                    const filePath = doc.data().fileStoragePath
                    // delete the file from storage
                    storageManager.delete(filePath)
                } catch (e) {
                    console.error('Error deleting a child file', e)
                }
            })
            // get all the child folders
            const childFoldersQuery = query(collection(firestore, "folders"), where("parentId", "==", folderId), where("userId", "==", currentUser.uid))
            const childFolders = await getDocs(childFoldersQuery)

            childFolders.forEach(doc => {
                // recursive call to delete child files and folders 
                database.folders.remove(doc.id, currentUser)
            })

        },
        update: async (folderId, changedFolder, currentUser) => {
            const folderRef = doc(collection(firestore, "folders"), folderId)
            try {
                await updateDoc(folderRef, changedFolder)
            } catch (e) {
                console.error(e)
            }
            async function updatePath(startFolderId, changedFolder) {
                const childFoldersQuery = query(collection(firestore, "folders"), where("parentId", "==", startFolderId), where("userId", "==", currentUser.uid))
                const childFolders = await getDocs(childFoldersQuery)
                childFolders.forEach(async (doc) => {
                    const childFolderPath = doc.data().path
                    for (let i = 0; i < childFolderPath.length; i++) {
                        if (childFolderPath[i].id === folderId) {
                            childFolderPath[i].name = changedFolder.name
                            try {
                                await updateDoc(doc.ref, { path: childFolderPath })
                            } catch (e) {
                                console.error(e)
                            }
                            break
                        }
                    }
                    updatePath(doc.id, changedFolder)
                })
            }
            updatePath(folderId, changedFolder)
        },
        toggleFav: async (folderId, currentFav) => {
            const folderRef = doc(collection(firestore, "folders"), folderId)
            try {
                await updateDoc(folderRef, { isFavorite: !currentFav })
            } catch (e) {
                console.error(e)
            }
        },
        collection: collection(firestore, "folders")

    },
    files: {
        add: async (file) => {
            try {
                await addDoc(collection(firestore, "files"), file)
            } catch (e) {
                console.error("Error adding file: ", e);
            }
        },
        remove: async (fileId) => {
            const fileRef = doc(collection(firestore, "files"), fileId)
            try {
                await deleteDoc(fileRef)
            } catch (e) {
                console.error("Error deleting file: ", e);
            }
        },
        update: async (fileId, changedFile) => {
            const fileRef = doc(collection(firestore, "files"), fileId)
            try {
                await updateDoc(fileRef, changedFile)
            } catch (e) {
                console.error(e)
            }
        },
        toggleFav: async (fileId, currentFav) => {
            const fileRef = doc(collection(firestore, "files"), fileId)
            try {
                await updateDoc(fileRef, { isFavorite: !currentFav })
            } catch (e) {
                console.error(e)
            }
        },
        selectTag: async (fileId, selectedTag) => {
            const fileRef = doc(collection(firestore, "files"), fileId)
            try {
                await updateDoc(fileRef, { tags: selectedTag })
            } catch (e) {
                console.error(e)
            }
        },
        collection: collection(firestore, "files")
    },
    formatDoc: (doc) => {
        return { id: doc.id, ...doc.data() }
    },
    getCurrentTimestamp: serverTimestamp,
}


export const storageManager = {
    delete: async (filePath) => {
        const fileRef = ref(storage, filePath)
        try {
            await deleteObject(fileRef)
        } catch (error) {
            console.error('Error deleting the file', error)
        }
    },
    download: async (url, fileName) => {
        const data = await fetch(url)
        const blob = await data.blob()
        const objectUrl = URL.createObjectURL(blob)

        const link = document.createElement('a')

        link.setAttribute('href', objectUrl)
        link.setAttribute('download', fileName)
        link.style.display = 'none'

        document.body.appendChild(link)

        link.click()

        document.body.removeChild(link)
    }
}


export const auth = getAuth(app)
export const storage = getStorage(app);
export default app

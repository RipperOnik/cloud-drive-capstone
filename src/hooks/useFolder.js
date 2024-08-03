import { useEffect, useReducer } from "react";
import { database } from "../firebase";
import { where, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

const ACTIONS = {
    SELECT_FOLDER: 'select-folder',
    UPDATE_FOLDER: 'update-folder',
    SET_CHILD_FOLDERS: 'set-child-folders',
    SET_CHILD_FILES: 'set-child-files',
    SET_ALL_FOLDERS: 'set-all-folders',
    SET_ALL_FILES: 'set-all-files'
}
// mimicing the root folder that doesn't exist in database
export const ROOT_FOLDER = { name: 'Root', id: null, path: [] }

function reducer(state, { type, payload }) {
    switch (type) {
        case ACTIONS.SELECT_FOLDER:
            return {
                ...state,
                folderId: payload.folderId,
                folder: payload.folder ?? ROOT_FOLDER,
                childFiles: [],
                childFolders: []
            }
        case ACTIONS.UPDATE_FOLDER:
            return {
                ...state,
                folder: payload.folder
            }
        case ACTIONS.SET_CHILD_FOLDERS:
            return {
                ...state,
                childFolders: payload.childFolders
            }
        case ACTIONS.SET_CHILD_FILES:
            return {
                ...state,
                childFiles: payload.childFiles
            }
        case ACTIONS.SET_ALL_FOLDERS:
            return {
                ...state,
                allFolders: payload.allFolders
            }
        case ACTIONS.SET_ALL_FILES:
            return {
                ...state,
                allFiles: payload.allFiles
            }
        default:
            return state
    }
}

export function useFolder(folderId = null, folder = null) {
    // currentFolder
    const [state, dispatch] = useReducer(reducer, {
        folderId: folderId,
        folder: folder,
        childFolders: [],
        childFiles: [],
        allFolders: [],
        allFiles: []
    })
    const { currentUser } = useAuth()


    // update current folder id
    useEffect(() => {
        dispatch({ type: ACTIONS.SELECT_FOLDER, payload: { folderId, folder } })


    }, [folderId, folder])

    // update current folder
    useEffect(() => {
        // means we are in the root folder
        if (folderId == null) {
            return dispatch({
                type: ACTIONS.UPDATE_FOLDER,
                payload: { folder: ROOT_FOLDER }
            })
        }
        // go to firestore to get a folder and set it to a local state
        database.folders.get(folderId).then(doc => {
            dispatch({
                type: ACTIONS.UPDATE_FOLDER,
                payload: { folder: database.formatDoc(doc) }
            })
            // if folder doesn't exist, set the local state to the root folder
        }).catch((e) => {
            console.error(e)
            dispatch({
                type: ACTIONS.UPDATE_FOLDER,
                payload: { folder: ROOT_FOLDER }
            })
        })
    }, [folderId])

    // update child folders
    useEffect(() => {
        // get all the child folders of the current folder and of the current user
        const q = query(database.folders.collection, where("parentId", "==", folderId), where("userId", "==", currentUser.uid), orderBy("createdAt"))


        // You can listen to a document with the onSnapshot() method. 
        // An initial call using the callback you provide creates a document snapshot immediately with the current contents of the single document. Then, each time the contents change, another call updates the document snapshot.
        return onSnapshot(q, (snapshot) => {
            dispatch({
                type: ACTIONS.SET_CHILD_FOLDERS,
                payload: { childFolders: snapshot.docs.map(database.formatDoc) }
            })
        })
    }, [folderId, currentUser, folder])


    // update child files 
    useEffect(() => {
        // get all the child folders of the current folder and of the current user
        const q = query(database.files.collection, where("folderId", "==", folderId), where("userId", "==", currentUser.uid), orderBy("createdAt"))


        // You can listen to a document with the onSnapshot() method. 
        // An initial call using the callback you provide creates a document snapshot immediately with the current contents of the single document. Then, each time the contents change, another call updates the document snapshot.
        return onSnapshot(q, (snapshot) => {
            dispatch({
                type: ACTIONS.SET_CHILD_FILES,
                payload: { childFiles: snapshot.docs.map(database.formatDoc) }
            })
        })
    }, [folderId, currentUser, folder])

    // get all folders
    useEffect(() => {
        const q = query(database.folders.collection, where("userId", "==", currentUser.uid))

        return onSnapshot(q, (snapshot) => {
            dispatch({
                type: ACTIONS.SET_ALL_FOLDERS,
                payload: { allFolders: snapshot.docs.map(database.formatDoc) }
            })
        })
    }, [currentUser])


    // get all files
    useEffect(() => {
        const q = query(database.files.collection, where("userId", "==", currentUser.uid))
        return onSnapshot(q, (snapshot) => {
            dispatch({
                type: ACTIONS.SET_ALL_FILES,
                payload: { allFiles: snapshot.docs.map(database.formatDoc) }
            })
        })
    }, [currentUser])


    // update folder sizes
    useEffect(() => {
        async function updateSize() {
            for (let i = 0; i < state.allFolders.length; i++) {
                const folder = state.allFolders[i]
                const newSize = calculateFolderSize(folder.id, state.allFolders, state.allFiles)
                if (newSize === folder.size) {
                    continue
                }
                const folderRef = doc(database.folders.collection, folder.id)
                await updateDoc(folderRef, { size: newSize })
            }
        }
        updateSize()

    }, [state.allFiles, state.allFolders])

    function calculateFolderSize(folderId, folders, files) {
        if (folders && files) {
            let sum = 0
            for (let i = 0; i < files.length; i++) {
                if (files[i].folderId === folderId) {
                    sum += files[i].size
                }
            }
            for (let i = 0; i < folders.length; i++) {
                if (folders[i].parentId === folderId) {
                    sum += calculateFolderSize(folders[i].id, folders, files)
                }
            }
            return sum
        }
        return 0
    }



    return state


}
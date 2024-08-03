import React, { useState } from 'react'
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFileUpload } from '@fortawesome/free-solid-svg-icons'
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, database } from "../../firebase"
import { useAuth } from '../../contexts/AuthContext';
import { ROOT_FOLDER } from '../../hooks/useFolder';
import { v4 as uuidV4 } from 'uuid'
import { Toast, ProgressBar } from 'react-bootstrap';
import { query, where, getDocs, updateDoc } from "firebase/firestore";
import { divideFileName } from './File';



const convertToType = {
    ".doc": "word", ".docx": "word", ".odt": "word", ".pages": "word",
    ".pdf": "pdf",
    ".xlsx": "excel", ".xls": "excel", ".csv": "excel",
    ".pptx": "powerpoint", ".pptm": "powerpoint", ".ppt": "powerpoint"
}

export default function AddFileButton({ currentFolder, style }) {

    const { currentUser } = useAuth()

    const [uploadingFiles, setUploadingFiles] = useState([])
    function handleUpload(e) {
        const file = e.target.files[0]
        if (currentFolder == null || file == null) {
            return
        }
        const id = uuidV4()
        setUploadingFiles(prev => [...prev, { id: id, name: file.name, process: 0, error: false }])
        const parentPath = currentFolder.path.map(p => p.id).join('/')
        const filePath =
            currentFolder === ROOT_FOLDER
                ? `${parentPath}/${file.name}`
                : `${parentPath}/${currentFolder.name}/${file.name}`
        const fullPath = `/files/${currentUser.uid}/${filePath}`
        const storageRef = ref(storage, fullPath)
        const uploadTask = uploadBytesResumable(storageRef, file);


        uploadTask.on('state_changed',
            (snapshot) => {
                // Observe state change events such as progress, pause, and resume
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                const progress = snapshot.bytesTransferred / snapshot.totalBytes
                setUploadingFiles(prev => {
                    return prev.map(uploadFile => {
                        if (uploadFile.id === id) {
                            return { ...uploadFile, progress: progress }
                        }
                        return uploadFile
                    })
                })
            },
            () => {
                // Handle unsuccessful uploads
                setUploadingFiles(prev => prev.map(uploadFile => {
                    if (uploadFile.id === id) {
                        return { ...uploadFile, error: true }
                    }
                    return uploadFile
                }))
            },
            () => {
                setUploadingFiles(prev => prev.filter(uploadFile => uploadFile.id !== id))

                // Handle successful uploads on complete
                getDownloadURL(uploadTask.snapshot.ref).then((url) => {
                    // check if file exists in a specified folder
                    const q = query(database.files.collection, where("name", "==", file.name), where("userId", "==", currentUser.uid), where("folderId", "==", currentFolder.id))

                    getDocs(q).then(existingFiles => {
                        const existingFile = existingFiles.docs[0]
                        if (existingFile) {
                            updateDoc(existingFile.ref, { url: url })
                        } else {
                            let fileType = file.type.split("/")[0]
                            if (fileType === "application") {
                                const fileExtension = divideFileName(file.name)[1]
                                fileType = convertToType[fileExtension]
                            }
                            database.files.add({
                                url: url,
                                name: file.name,
                                createdAt: new Date().toString(),
                                folderId: currentFolder.id,
                                userId: currentUser.uid,
                                fileStoragePath: fullPath,
                                type: fileType,
                                size: file.size,
                                isFavorite: false,
                                tags: {}
                            })
                        }
                    })
                });
            }
        );

    }
    function clearFile(e) {
        e.target.value = null
    }
    return (
        <>
            {/*make the label do the job instead of the input itself */}
            <label className='btn btn-outline-success btn-sm mr-2' style={style}>
                <FontAwesomeIcon icon={faFileUpload} />
                {/* hide the ugly upload input  */}
                <input
                    type="file"
                    onChange={handleUpload}
                    onClick={clearFile}
                    style={{ opacity: 0, position: 'absolute', left: '-9999px' }}
                />
            </label>
            {uploadingFiles.length > 0 &&
                createPortal(
                    <div
                        style={{ position: 'absolute', bottom: '1rem', right: '1rem', maxWidth: '250px' }}>
                        {uploadingFiles.map(file => (
                            <Toast key={file.id} onClose={() => setUploadingFiles(prev => prev.filter(uploadFile => uploadFile.id !== file.id))}>
                                <Toast.Header className='d-flex' closeButton={file.error}>
                                    <div className='text-truncate w-100'>
                                        {file.name}
                                    </div>

                                </Toast.Header>
                                <Toast.Body>
                                    <ProgressBar
                                        animated={!file.error}
                                        variant={file.error ? 'danger' : 'primary'}
                                        now={file.error ? 100 : file.progress * 100}
                                        label={file.error ? "Error" : `${Math.round(file.progress * 100)}%`}
                                    />

                                </Toast.Body>
                            </Toast>
                        ))}
                    </div>,
                    document.body
                )}

        </>

    )
}

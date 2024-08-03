import React, { useEffect, useState } from 'react'
import { Stack, Modal, Form, Alert, Button, Toast, ProgressBar } from 'react-bootstrap'
import { v4 as uuidV4 } from 'uuid'
import { ROOT_FOLDER } from '../../hooks/useFolder'
import { useNavigate } from 'react-router-dom'
import "../../styles/sidebar.css"
import ActionButton from './ActionButton'
import { useAuth } from '../../contexts/AuthContext'
import { database, storage } from '../../firebase'
import { createPortal } from 'react-dom';
import { query, where, getDocs, updateDoc } from "firebase/firestore";
import { divideFileName } from './File';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { MenuButton } from './Dashboard'
import TagSideBar from './TagSideBar.js'
import Collapsable from './Collapsable.js'

const convertToType = {
    ".doc": "word", ".docx": "word", ".odt": "word", ".pages": "word",
    ".pdf": "pdf",
    ".xlsx": "excel", ".xls": "excel", ".csv": "excel",
    ".pptx": "powerpoint", ".pptm": "powerpoint", ".ppt": "powerpoint"
}


export default function SideBar({ folders, resetActiveIndex, isMobile = false, onHide, currentFolder, selectedTagIndex, setSelectedTagIndex, tags, setTags}) {
    const [showButtonTooltip, setShowButtonTooltip] = useState(false)
    function closeButtonTooltip() {
        setShowButtonTooltip(false)
    }
    function openButtonTooltip(e) {
        e.stopPropagation()
        setShowButtonTooltip(true)
    }
    const navigate = useNavigate()
    function getAllFolders(folder) {
        if (folders) {
            const isRoot = folder.id === null
            const children = folders.filter(childFolder => childFolder.parentId === folder.id)
            const childFolders = children.map(childFolder => getAllFolders(childFolder))

            function click() {
                if (isRoot) {
                    navigate('/')
                    resetActiveIndex()
                    if (isMobile) {
                        onHide()
                    }



                } else {
                    navigate(`/folder/${folder.id}`, { state: { folder: folder } })
                    resetActiveIndex()
                    if (isMobile) {
                        onHide()
                    }
                }

            }

            return <Collapsable icon={isRoot ? "root-folder" : "folder"} name={isRoot ? "All files" : folder.name} key={folder.id} onClick={click}>
                    {childFolders.length > 0 && childFolders}
                </Collapsable>
        }
    }

    function getAllTags(){
        
    }

    // Add folder
    const [showAddFolderModal, setShowAddFolderModal] = useState(false)
    const [name, setName] = useState("")
    const [showError, setShowError] = useState(false)
    const { currentUser } = useAuth()

    function closeModal() {
        setShowAddFolderModal(false)
        setShowError(false)
        setName('')
    }
    function handleSubmit(e) {
        e.preventDefault()
        if (currentFolder == null) return

        const path = [...currentFolder.path]
        // since root folder doesn't exist in a database
        if (currentFolder !== ROOT_FOLDER) {
            path.push({ name: currentFolder.name, id: currentFolder.id })
        }

        for (const folder of folders) {
            if (folder.name === name) {
                setShowError(true)
                return
            }
        }

        database.folders.add({
            name: name,
            parentId: currentFolder.id,
            userId: currentUser.uid,
            path: path,
            createdAt: new Date().toString(),
            isFavorite: false,
            size: 0,
            tags: {}
        })
        setName("")
        closeModal()
    }
    // add folder ends

    // upload file
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
    // upload file ends


    // temporary tags value

    const handleTagClick = (tagId) => {
        navigate(`/tagged/${tagId}`);
      };

    if (folders) {
        return (
            <>
                <div className={`sidebar flex-shrink-0 ${!isMobile ? 'd-none d-md-block' : 'p-0'}`}>
                    <ButtonTooltip
                        target={
                            <button className='add-button d-flex align-items-center' style={{ gap: "15px", marginBottom: "20px" }} onClick={openButtonTooltip}>
                                <div style={{ fontSize: "26px" }}>+</div>
                                <div>New</div>
                            </button>
                        }
                        show={showButtonTooltip}
                        onHide={closeButtonTooltip}
                        top="0"
                        className='d-none d-md-flex'
                    >
                        <ActionButton icon='add-folder' onClick={() => setShowAddFolderModal(true)}>
                            New folder
                        </ActionButton>
                        <ActionButton>
                            {/*make the label do the job instead of the input itself */}
                            <label style={{ cursor: 'pointer' }}>
                                <Stack gap={2} direction='horizontal'>
                                    {/* <img src={`./images/add-file.svg`} alt='action button' width={20} /> */}
                                    <MenuButton icon='add-file' className='menu-button' />
                                    File upload
                                </Stack>
                                {/* hide the ugly upload input  */}
                                <input
                                    type="file"
                                    onChange={handleUpload}
                                    onClick={clearFile}
                                    style={{ opacity: 0, position: 'absolute', left: '-9999px' }}
                                />
                            </label>
                        </ActionButton>
                    </ButtonTooltip>


                    {getAllFolders(ROOT_FOLDER)}
                    <Collapsable icon='heart' name={"Favorite"} onClick={() => {
                        navigate("/favorites")
                        if (isMobile) {
                            onHide()
                        }
                    }} />
                    {getAllTags()}
                    <Collapsable icon='tag' name={"Tags"} />
                    <TagSideBar tags={tags} setTags={setTags} onTagClick={handleTagClick} selectedTagIndex={selectedTagIndex} setSelectedTagIndex={setSelectedTagIndex}/>
                </div>

                {/* Add folder Modal */}
                <Modal show={showAddFolderModal} onHide={closeModal}>
                    <Form onSubmit={handleSubmit}>
                        <Modal.Body>
                            <Form.Group>
                                <Form.Label>Folder Name</Form.Label>
                                <Form.Control type='text' required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                            </Form.Group>
                            <Alert variant='danger' show={showError} onClose={() => setShowError(false)} dismissible className='mt-2'>
                                <Alert.Heading>Folders in a folder should have unique names!</Alert.Heading>
                            </Alert>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant='danger' onClick={closeModal}>Close</Button>
                            <Button variant='success' type='submit'>Add Folder</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* show uploading files */}
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
}







export function ButtonTooltip({ target, show, onHide, children, top, left, right, bottom, className, style }) {
    useEffect(() => {
        document.body.addEventListener('click', onHide)
        return () => {
            document.body.removeEventListener('click', onHide)
        }
    }, [])
    return (
        <div className={`tooltip--button flex-grow-1 ${className}`} style={style}>
            {target}
            <div className='tooltip-body-button' style={{
                visibility: show ? 'visible' : 'hidden',
                minWidth: "200px",
                top: top,
                left: left,
                right: right,
                bottom: bottom
            }}>
                <Stack className='w-100'>
                    {children}
                </Stack>
            </div>
        </div>

    )
}

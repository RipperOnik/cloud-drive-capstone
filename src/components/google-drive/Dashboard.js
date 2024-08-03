import React, { useState, useRef, useEffect } from 'react'
import Navbar from './Navbar'
import { Offcanvas, Stack, Modal, Form, Button, Alert, Toast, ProgressBar } from 'react-bootstrap'
import { useFolder } from '../../hooks/useFolder'
import Folder from './Folder'
import { useParams, useLocation } from 'react-router-dom'
import FolderBreadcrumbs from './FolderBreadcrumbs'
import File from './File'
import Details from './Details'
import "../../styles/dashboard.css"
import { database, storageManager, storage, firestore } from '../../firebase'
import RenameModal from "./RenameModal"
import { useAuth } from '../../contexts/AuthContext'
import SideBar from './SideBar'
import FilterDropdown from './FilterDropdown'
import ElementBreadcrumbs from './ElementBreadcrumbs'
import DetailsMobile from './DetailsMobile'
import { divideFileName } from './File'
import "../../styles/mobile.css"
import { ButtonTooltip } from './SideBar'
import { ROOT_FOLDER } from '../../hooks/useFolder'
import { createPortal } from 'react-dom';
import { query, where, getDocs, updateDoc, collection } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidV4 } from 'uuid'
import ActionButton from './ActionButton'


export const filters = { DATE: "date", NAME: "name", SIZE: "size" }


export default function Dashboard() {
    const { folderId } = useParams()
    // getting state from links to render paths faster
    const { state = {} } = useLocation()

    const { currentUser } = useAuth()
    const { query: querySearch } = useParams()

    const [chosenFilter, setChosenFilter] = useState(filters.DATE)
    const [isASC, setIsASC] = useState(true)
    const [tags, setTags] = useState([]);
    const { filterTagId } = useParams();


    const isSearch = typeof querySearch !== 'undefined'
    const isFavorites = window.location.href.includes("favorites")
    const isTagged = window.location.href.includes("tagged")


    const { folder, childFolders, childFiles, allFolders, allFiles } = useFolder(folderId, state && state.folder)


    const getAllTags = async () => {
        try {
            const tagsRef = collection(firestore, 'tags');
            const q = query(tagsRef, where('userId', '==', currentUser.uid));
            const querySnapshot = await getDocs(q);
            const tags = [];
            querySnapshot.forEach((doc) => {
                tags.push({ id: doc.id, ...doc.data() });
            });
            return tags;
        } catch (error) {
            console.error("Error getting tags: ", error);
            throw new Error("Failed to retrieve tags");
        }
    };

    // get all tags
    useEffect(() => {
        const fetchTags = async () => {
            if (currentUser) {
                const tagsData = await getAllTags();
                setTags(tagsData);
            }
        };
        fetchTags();
    }, [currentUser]);

    let folders = childFolders
    let files = childFiles

    if (isFavorites) {
        folders = allFolders.filter(f => f.isFavorite)
        files = allFiles.filter(f => f.isFavorite)
    } else if (isSearch) {
        folders = allFolders.filter(f => f.name.toLowerCase().includes(querySearch.toLowerCase()))
        files = allFiles.filter(f => f.name.toLowerCase().includes(querySearch.toLowerCase()))
    } else if (isTagged){
        files = allFiles.filter(file => 
            file.tags
            && null != file.tags.id
            && file.tags.id == filterTagId
          );
    }
    function sortFunc(a, b) {
        if (chosenFilter === filters.DATE) {
            if (isASC) {
                return new Date(a.createdAt) - new Date(b.createdAt)
            } else {
                return new Date(b.createdAt) - new Date(a.createdAt)
            }
        }
        else if (chosenFilter === filters.NAME) {
            if (isASC) {
                return a.name.localeCompare(b.name)
            } else {
                return b.name.localeCompare(a.name)
            }
        }

        else if (chosenFilter === filters.SIZE) {
            if (isASC) {
                return a.size - b.size
            } else {
                return b.size - a.size
            }
        }
    }

    folders.sort(sortFunc)
    files.sort(sortFunc)



    const [activeIndex, setActiveIndex] = useState(-1)
    const [selectedTagIndex, setSelectedTagIndex] = useState(-1);
    const elements = folders ? folders.concat(files) : []
    const [showDetails, setShowDetails] = useState(false)

    const [showModal, setShowModal] = useState(false)
    const inputRef = useRef(null)
    const elementToRename = useRef(null)


    function handleRemoveFile() {
        database.files.remove(elements[activeIndex].id)
        storageManager.delete(elements[activeIndex].fileStoragePath)
    }
    function handleRemoveFolder() {
        database.folders.remove(elements[activeIndex].id, currentUser)
    }

    function handleRename(e) {
        e.preventDefault()
        setShowModal(false)
        const element = elementToRename.current
        const fullFileName = inputRef.current.value + activeFileExtension
        if (element.url) {
            if (element.name !== fullFileName) {
                database.files.update(element.id, { name: fullFileName })
            }
        }
        else {
            if (element.name !== inputRef.current.value) {
                database.folders.update(element.id, { name: inputRef.current.value }, currentUser)
            }
        }
    }
    function handleRemove() {
        if (elements[activeIndex].url) {
            handleRemoveFile()
        } else {
            handleRemoveFolder()
        }
    }
    function toggleDetails(e) {
        e.stopPropagation()
        setShowDetails(prev => !prev)
    }
    function resetActiveIndex() {
        setActiveIndex(-1)
        setSelectedTagIndex(-1);
    }


    const mainRef = useRef(null)
    useEffect(() => {
        const resetClickElement = mainRef.current
        resetClickElement.addEventListener('click', resetActiveIndex)
        return () => {
            resetClickElement.removeEventListener('click', resetActiveIndex)
        }
    }, [])

    function toggleFavFile(e) {
        e.stopPropagation()
        const file = elements[activeIndex]
        database.files.toggleFav(file.id, file.isFavorite)
    }
    function toggleFavFolder(e) {
        e.stopPropagation()
        const folder = elements[activeIndex]
        database.folders.toggleFav(folder.id, folder.isFavorite)
    }
    function handleEdit(e) {
        e.stopPropagation()
        elementToRename.current = elements[activeIndex]
        setShowModal(true)
    }


    function handleDownload() {
        storageManager.download(elements[activeIndex].url, elements[activeIndex].name)
    }

    const [showDetailsMobile, setShowDetailsMobile] = useState(false)

    function openDetailsMobile(e) {
        e.stopPropagation()
        setShowDetailsMobile(true)
    }

    const [activeFileName, activeFileExtension] = divideFileName(elements[activeIndex] ? elements[activeIndex].name : '')

    //floating button
    const [showButtonTooltip, setShowButtonTooltip] = useState(false)
    function closeButtonTooltip() {
        setShowButtonTooltip(false)
    }
    function openButtonTooltip(e) {
        e.stopPropagation()
        setShowButtonTooltip(true)
    }
    //floating buttons ends

    // Add folder
    const [showAddFolderModal, setShowAddFolderModal] = useState(false)
    const [name, setName] = useState("")
    const [showError, setShowError] = useState(false)

    function closeModal() {
        setShowAddFolderModal(false)
        setShowError(false)
        setName('')
    }
    function handleSubmit(e) {
        const currentFolder = folder
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
        const convertToType = {
            ".doc": "word", ".docx": "word", ".odt": "word", ".pages": "word",
            ".pdf": "pdf",
            ".xlsx": "excel", ".xls": "excel", ".csv": "excel",
            ".pptx": "powerpoint", ".pptm": "powerpoint", ".ppt": "powerpoint"
        }
        const currentFolder = folder
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





    return (
        <div className='h-100 d-flex flex-column' style={{ minHeight: '0', overflow: 'hidden' }}>
            <Navbar resetActiveIndex={resetActiveIndex} />
            <div className='d-flex w-100 flex-grow-1 main-content' style={{ gap: "10px", overflow: 'hidden', minHeight: '0', minWidth: '0' }}>
                <SideBar folders={allFolders} resetActiveIndex={resetActiveIndex} currentFolder={folder} selectedTagIndex={selectedTagIndex} setSelectedTagIndex={setSelectedTagIndex} tags={tags} setTags={setTags}/>
                <div className='d-flex flex-grow-1' onClick={resetActiveIndex} style={{ minHeight: '0', overflow: 'hidden', gap: "20px" }}>
                    <div className='d-flex flex-grow-1 flex-column main-content-items' style={{ minHeight: '0', overflow: 'hidden', gap: "10px" }}>
                        <Stack direction='horizontal' className={`${(!isSearch && !isFavorites) ? 'justify-content-end' : ''}`}>
                            {isSearch && <div style={{ fontSize: "24px" }} className='flex-grow-1'>Search results</div>}
                            {isFavorites && <div style={{ fontSize: "24px" }} className='flex-grow-1'>Favorites</div>}
                            {<Stack direction='horizontal' gap={1} className='menu-buttons' style={{ paddingRight: "5px", visibility: elements[activeIndex] ? 'visible' : 'hidden' }}>
                                <MenuButton icon='delete' className="menu-button" onClick={handleRemove} />
                                <MenuButton icon='edit' className="menu-button" onClick={handleEdit} />
                                {elements[activeIndex] && elements[activeIndex].url && <MenuButton icon='download' className="menu-button" onClick={handleDownload} />}
                                <MenuButton icon={elements[activeIndex] && (elements[activeIndex].isFavorite ? 'broken-heart' : 'heart')} className="menu-button" onClick={elements[activeIndex] && (elements[activeIndex].url ? toggleFavFile : toggleFavFolder)} />
                                <MenuButton icon='info' className="menu-button d-md-none" onClick={openDetailsMobile} />
                            </Stack>}
                            <MenuButton icon='info' className="menu-button d-none d-md-block" onClick={toggleDetails} ariaControls='collapsed-details' ariaExpanded={showDetails} style={{ marginLeft: "5px" }} />
                        </Stack>


                        <div style={{ position: "relative", width: "100%", overflow: 'auto', flexGrow: '1' }} ref={mainRef}>
                            <FilterDropdown style={{ position: "absolute", top: "0", right: "0" }} chosenFilter={chosenFilter} setChosenFilter={setChosenFilter} isASC={isASC} setIsASC={setIsASC} />
                            {folders && folders.length > 0 && <div className='mb-4'>Folders</div>}
                            {folders && folders.length > 0 && (
                                <Stack direction="horizontal" className='flex-wrap mb-4' gap={3}>
                                    {folders.map((childFolder, index) => {
                                        return <Folder folder={childFolder} key={childFolder.id} activeIndex={activeIndex} setActiveIndex={setActiveIndex} index={index} setShowDetails={setShowDetails} />
                                    })}
                                </Stack>
                            )}

                            {files && files.length > 0 && <div className='mb-4'>Files</div>}
                            {files && files.length > 0 && (
                                <Stack direction="horizontal" className='flex-wrap' gap={3}>
                                    {files.map((childFile, index) => {
                                        const newIndex = folders.length + index
                                        return <File file={childFile} key={childFile.id} activeIndex={activeIndex} setActiveIndex={setActiveIndex} index={newIndex} setShowDetails={setShowDetails} tags={tags}/>
                                    })}
                                </Stack>
                            )}
                        </div>
                        {elements[activeIndex] && (isSearch || isFavorites) && <ElementBreadcrumbs element={elements[activeIndex]} resetActiveIndex={resetActiveIndex}
                            style={{ borderTop: "1px solid rgba(0, 0, 0, 0.2)", padding: "0 15px" }} />}
                        {!isSearch && !isFavorites && <FolderBreadcrumbs currentFolder={folder} resetActiveIndex={resetActiveIndex}
                            style={{ borderTop: "1px solid rgba(0, 0, 0, 0.2)", padding: "0 15px" }} />}
                    </div>
                    <Details element={elements[activeIndex]} setShowDetails={setShowDetails} showDetails={showDetails} tags={tags}/>
                </div>
                <ButtonTooltip
                    target={
                        <button className='add-button add-button--floating' onClick={openButtonTooltip}>
                            <div style={{ fontSize: "40px", position: "relative", bottom: "3px" }}>+</div>
                        </button>
                    }
                    show={showButtonTooltip}
                    onHide={closeButtonTooltip}
                    bottom="0"
                    right="0"
                    className='d-md-none'
                    style={{ position: "fixed", bottom: "70px", right: "8%", zIndex: "5" }}
                >
                    <ActionButton icon='add-folder' onClick={() => setShowAddFolderModal(true)}>
                        New folder
                    </ActionButton>
                    <ActionButton>

                        <label style={{ cursor: 'pointer' }}>
                            <Stack gap={2} direction='horizontal'>

                                <MenuButton icon='add-file' className='menu-button' />
                                File upload
                            </Stack>

                            <input
                                type="file"
                                onChange={handleUpload}
                                onClick={clearFile}
                                style={{ opacity: 0, position: 'absolute', left: '-9999px' }}
                            />
                        </label>
                    </ActionButton>

                </ButtonTooltip>




            </div>

            <RenameModal show={showModal} closeModal={() => setShowModal(false)} onSubmit={handleRename}
                defaultValue={elements[activeIndex] && (elements[activeIndex].url ? activeFileName : elements[activeIndex].name)} inputRef={inputRef} />
            <Offcanvas show={showDetailsMobile} onHide={() => setShowDetailsMobile(false)} placement='end'>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Details</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <DetailsMobile element={elements[activeIndex]} />
                </Offcanvas.Body>
            </Offcanvas>

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



        </div>

    )
}


export function MenuButton({ icon, className, style, onClick, ariaConrols, ariaExpanded }) {
    return <img src={`./images/${icon}.svg`} alt='menu-button' className={`${className}`} style={style} onClick={onClick} aria-controls={ariaConrols} aria-expanded={ariaExpanded} />

}


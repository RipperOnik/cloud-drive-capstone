import React, { useEffect } from 'react'
import { Overlay, Popover } from 'react-bootstrap'
import { useState, useRef } from 'react'
import "../../styles/popover.css"
import { database, storageManager } from '../../firebase'
import ActionButton from './ActionButton'
import TagComponent from './TagComponent.js'
import RenameModal from './RenameModal'
import "../../styles/file.css"

export default function File({ file, index, activeIndex, setActiveIndex, setShowDetails, tags }) {
    const [showPopover, setShowPopover] = useState(false);
    const target = useRef(null);
    const [showModal, setShowModal] = useState(false)
    const inputRef = useRef(null)
    const [fileName, fileExtension] = divideFileName(file.name)
    const [tag, setTag] = useState({})

    // temporary tags value
    const isActive = index === activeIndex

    function handleRightClick(e) {
        e.preventDefault()
        setShowPopover(true)
    }
    function closeModal() {
        setShowModal(false)
    }
    function closePopover() {
        setShowPopover(false)
    }
    function handleRemove() {
        database.files.remove(file.id)
        storageManager.delete(file.fileStoragePath)
        closePopover()
    }
    function openRenameModal() {
        closePopover()
        setShowModal(true)
    }
    function handleRename(e) {
        e.preventDefault()
        closeModal()
        if (fileName !== inputRef.current.value) {
            database.files.update(file.id, { name: inputRef.current.value + fileExtension })
        }
    }
    function handleDownload() {
        closePopover()
        storageManager.download(file.url, file.name)
    }
    function handleClick(e) {
        e.stopPropagation()
        if (e.detail === 1) {
            setActiveIndex(index)
        }
        else if (e.detail === 2) {
            window.open(file.url, "_blank")
        }
    }

    function toggleFav() {
        database.files.toggleFav(file.id, file.isFavorite)
    }

    useEffect(() => {
        document.body.addEventListener('click', closePopover)
        return () => {
            document.body.removeEventListener('click', closePopover)
        }
    }, [])

    return (
        <>
            <div className={`file text-truncate d-flex align-items-center ${isActive ? "file--active" : ''}`} onContextMenu={handleRightClick} ref={target}
                style={{ gap: "8px" }} onClick={handleClick}
            >
                <img src={`./images/${file.type}.svg`} alt="file" style={{ width: "25px" }} onError={(e) => e.target.src = "./images/file.svg"} />
                <div className='d-flex flex-grow-1 text-truncate'>
                    <div className='text-truncate'>{fileName}</div>
                    <span>{fileExtension}</span>
                </div>
                {file.tags.length == 0 ? <></> :  
                    <div className="tag">
                        {/* read tag color from database and put in background color of this span */}
                        <span className="small-tag-dot" style={{background: file.tags.tagColor}}></span>
                    </div>}
            </div>
            <Overlay target={target.current} show={showPopover} placement="right" rootClose onHide={closePopover}>
                <Popover>
                    <ActionButton icon='delete' onClick={handleRemove}>Remove</ActionButton>
                    <ActionButton icon='edit' onClick={openRenameModal}>Rename</ActionButton>
                    <ActionButton icon='download' onClick={handleDownload}>Download</ActionButton>
                    <ActionButton icon={file.isFavorite ? 'broken-heart' : 'heart'} onClick={toggleFav}>
                        {file.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    </ActionButton>

                    {/* if button already tagged => remove tag else select new tag */}
                    {tags.length == 0 ? <></> : 
                        <TagComponent file={file} tags={tags} selectedTag={file.tags.length == 0 ? [] : file.tags}/>}

                </Popover>
            </Overlay>
            <RenameModal show={showModal} closeModal={closeModal} onSubmit={handleRename} defaultValue={fileName} inputRef={inputRef} />

        </>

    )
}

export function divideFileName(fullFileName) {
    for (let i = fullFileName.length - 1; i >= 0; i--) {
        const code = fullFileName.charCodeAt(i)
        if (code === 46) {
            return [fullFileName.slice(0, i), fullFileName.slice(i)]
        }
    }
    return fullFileName
}



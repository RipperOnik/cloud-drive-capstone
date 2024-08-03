import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Overlay, Popover } from 'react-bootstrap'
import ActionButton from './ActionButton'
import { faTrashCan, faEdit, faHeart } from "@fortawesome/free-regular-svg-icons"
import { faHeartBroken } from '@fortawesome/free-solid-svg-icons'
import { database } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import RenameModal from './RenameModal'




export default function Folder({ folder, index, activeIndex, setActiveIndex, setShowDetails }) {
    const [showPopover, setShowPopover] = useState(false);
    const [showModal, setShowModal] = useState(false)
    const inputRef = useRef(null)
    const target = useRef(null);
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const isActive = index === activeIndex
    function handleRightClick(e) {
        e.preventDefault()
        setShowPopover(true)
    }
    function closePopover() {
        setShowPopover(false)
    }
    function closeModal() {
        setShowModal(false)
    }
    function handleRemove() {
        database.folders.remove(folder.id, currentUser)
        closePopover()
    }

    function openRenameModal() {
        closePopover()
        setShowModal(true)
    }
    function handleRename(e) {
        e.preventDefault()
        closeModal()
        if (folder.name !== inputRef.current.value) {
            database.folders.update(folder.id, { name: inputRef.current.value }, currentUser)
        }
    }
    function handleClick(e) {
        e.stopPropagation()
        if (e.detail === 1) {
            setActiveIndex(index)
        }
        else if (e.detail === 2) {
            navigate(`/folder/${folder.id}`, { state: { folder: folder } })
            setActiveIndex(-1)
        }
    }
    function openDetails(e) {
        e.stopPropagation()
        setShowDetails(true)
        setActiveIndex(index)
        closePopover()
    }
    function toggleFav() {
        database.folders.toggleFav(folder.id, folder.isFavorite)
    }

    useEffect(() => {
        document.body.addEventListener('click', closePopover)
        return () => {
            document.body.removeEventListener('click', closePopover)
        }
    }, [])

    return (
        <>
            <div onClick={handleClick}
                className={`file d-flex align-items-center ${isActive ? "file--active" : ''}`} ref={target} onContextMenu={handleRightClick} style={{ gap: "8px" }}>
                <img src="./images/folder.svg" alt="folder" style={{ width: "25px" }} />
                <span className='text-truncate'>{folder.name}</span>
            </div>
            <Overlay target={target.current} show={showPopover} placement="right" rootClose onHide={closePopover}>
                <Popover>
                    <ActionButton icon='delete' onClick={handleRemove}>
                        Remove
                    </ActionButton>
                    <ActionButton icon='edit' onClick={openRenameModal}>
                        Rename
                    </ActionButton>
                    <ActionButton icon={folder.isFavorite ? 'broken-heart' : 'heart'} onClick={toggleFav}>
                        {folder.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    </ActionButton>
                </Popover>
            </Overlay>
            <RenameModal show={showModal} closeModal={closeModal} onSubmit={handleRename} defaultValue={folder.name} inputRef={inputRef} />
        </>
    )
}

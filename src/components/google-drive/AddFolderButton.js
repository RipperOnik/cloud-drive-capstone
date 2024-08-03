import React, { useState } from 'react'
import { Button, Modal, Form, Alert } from 'react-bootstrap'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFolderPlus } from '@fortawesome/free-solid-svg-icons'
import { database } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { ROOT_FOLDER } from '../../hooks/useFolder'

export default function AddFolderButton({ currentFolder, folders, style }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [showError, setShowError] = useState(false)
    const { currentUser } = useAuth()

    function openModal() {
        setOpen(true)
    }
    function closeModal() {
        setOpen(false)
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
    return (
        <>
            <Button onClick={openModal} variant="outline-success" size='sm' style={style}>
                <FontAwesomeIcon icon={faFolderPlus} />
            </Button>

            <Modal show={open} onHide={closeModal}>
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




        </>

    )
}

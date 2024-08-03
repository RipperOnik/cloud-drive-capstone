import React from 'react'
import { Breadcrumb } from 'react-bootstrap'
import { ROOT_FOLDER } from '../../hooks/useFolder'
import { Link } from 'react-router-dom'

export default function FolderBreadcrumbs({ currentFolder, resetActiveIndex, style }) {
    let path = currentFolder === ROOT_FOLDER ? [] : [ROOT_FOLDER]
    if (currentFolder) {
        path = [...path, ...currentFolder.path]
    }
    return (
        <Breadcrumb listProps={{ className: "pl-0 m-0" }} style={{ minHeight: "40px", ...style }}>
            {path.map((folder, index) => {
                return <Breadcrumb.Item
                    onClick={resetActiveIndex}
                    key={folder.id}
                    className='text-truncate d-inline-block'
                    linkAs={Link}
                    linkProps={{
                        to: folder.id ? `/folder/${folder.id}` : '/',
                        state: { folder: { ...folder, path: path.slice(1, index) } }
                    }}
                    style={{ maxWidth: "150px" }}
                >
                    {folder.name}
                </Breadcrumb.Item>
            })}
            {currentFolder && (
                <Breadcrumb.Item
                    className='text-truncate d-inline-block'
                    style={{ maxWidth: "200px" }}
                    active
                >
                    {currentFolder.name}
                </Breadcrumb.Item>
            )}
        </Breadcrumb>
    )
}



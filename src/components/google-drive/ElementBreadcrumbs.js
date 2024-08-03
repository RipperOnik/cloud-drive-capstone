import React from 'react'
import { Breadcrumb, Stack } from 'react-bootstrap'
import { ROOT_FOLDER, useFolder } from '../../hooks/useFolder'
import { Link } from 'react-router-dom'
import { divideFileName } from './File'

export default function ElementBreadcrumbs({ element, resetActiveIndex, style }) {
    const { allFolders } = useFolder()
    let path = []
    let fileName, fileExtension
    if (element.url && allFolders && allFolders.length > 0) {
        [fileName, fileExtension] = divideFileName(element.name)
        let folder
        for (let i = 0; i < allFolders.length; i++) {
            if (allFolders[i].id === element.folderId) {
                folder = allFolders[i]
                break
            }
        }
        path = typeof folder !== 'undefined' ? [ROOT_FOLDER, ...folder.path, { id: folder.id, name: folder.name }] : [ROOT_FOLDER]
    } else if (!element.url) {
        path = [ROOT_FOLDER, ...element.path]
    }
    function openFile() {
        window.open(element.url, "_blank")
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
                        state: { folder: folder.id ? { ...folder, path: path.slice(1, index) } : null }
                    }}
                    style={{ maxWidth: "150px" }}
                >
                    {folder.name}
                </Breadcrumb.Item>
            })}
            {element.url ?
                <Breadcrumb.Item
                    className='text-truncate'
                    style={{ width: "200px" }}
                    onClick={openFile}>
                    <Stack direction='horizontal' className='text-truncate' gap={1}>
                        <img src={`./images/${element.type}.svg`} alt="file" style={{ width: "25px" }} onError={(e) => e.target.src = "./images/file.svg"} />
                        <div className='d-flex text-truncate'>
                            <div className='text-truncate'>{fileName}</div>
                            <span>{fileExtension}</span>
                        </div>
                    </Stack>

                </Breadcrumb.Item> :
                <Breadcrumb.Item
                    className='text-truncate d-inline-block'
                    onClick={resetActiveIndex}
                    style={{ maxWidth: "200px" }}
                    linkAs={Link}
                    linkProps={{
                        to: element.id ? `/folder/${element.id}` : '/',
                        state: { folder: { ...element, path: path.slice(1) } }
                    }}
                >
                    {element.name}
                </Breadcrumb.Item>
            }
        </Breadcrumb>
    )
}
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFile, faFolder } from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'
import { divideFileName } from './File'

export default function SearchResult({ activeIndex, element, setActiveIndex, index }) {
    const active = activeIndex === index

    function handleMouseEnter() {
        setActiveIndex(index)
    }
    function handleMouseLeave() {
        setActiveIndex(-1)
    }
    const [fileName, fileExtension] = divideFileName(element.name)

    const isFile = element.url


    if (isFile) {
        return <a
            className='d-flex w-100 align-items-center search-result text-truncate py-2'
            target="_blank"
            href={element.url}
            style={{ backgroundColor: active ? 'rgba(0, 0, 0, 0.12)' : '', paddingRight: "20px" }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >

            <div className='d-flex justify-content-between w-100' style={{ gap: "10px" }}>
                <div className='d-flex align-items-center text-truncate' style={{ gap: "15px" }}>
                    {/* <FontAwesomeIcon icon={faFile} /> */}
                    <img src={`./images/${element.type}.svg`} alt="file" style={{ width: "25px" }} onError={(e) => e.target.src = "./images/file.svg"} />
                    <div className='d-flex text-truncate'>
                        <span className='text-truncate'>{fileName}</span>
                        <span>{fileExtension}</span>
                    </div>
                </div>
            </div>
        </a>
    } else {
        return <Link
            className='d-flex w-100 align-items-center search-result py-2'
            to={`/folder/${element.id}`}
            style={{ backgroundColor: active ? 'rgba(0, 0, 0, 0.12)' : '', paddingRight: "20px" }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className='d-flex justify-content-between w-100' style={{ gap: "10px" }}>
                <div className='d-flex align-items-center text-truncate' style={{ gap: "15px" }}>
                    <img src="./images/folder.svg" alt="folder" style={{ width: "25px" }} />
                    <span className='text-truncate'>{element.name}</span>
                </div>
            </div>

        </Link>
    }



}

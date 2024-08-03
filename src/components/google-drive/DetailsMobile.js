import React from 'react'
import "../../styles/detail.css"
import { Detail, convertSize, defineDate, capitalize } from './Details'


export default function DetailsMobile({ element }) {
    if (element) {
        const isFile = element.url
        const size = convertSize(element.size)
        const createdAt = defineDate(element.createdAt)
        return (
            <div className='details border-0 p-0 details--mobile'>
                <a href={element.url} target="_blank" className='details-file d-flex' style={{ gap: "8px" }}>
                    <img src={isFile ? `./images/${element.type}.svg` : "./images/folder.svg"} alt="file" style={{ width: "35px" }} onError={(e) => e.target.src = "./images/file.svg"} />
                    {element.name}
                </a>
                <div className='details-body'>
                    <Detail name="Size" value={size} />
                    <Detail name="Type" value={capitalize(isFile ? element.type : "folder")} />
                    <Detail name="Created" value={createdAt} />
                </div>
            </div>
        )
    }
}

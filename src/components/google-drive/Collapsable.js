import React, { useState } from 'react'
import { Collapse, Stack } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { v4 as uuidV4 } from 'uuid'
import "../../styles/sidebar.css"

export default function Collapsable({ icon, name, children, onClick }) {

    const [isOpen, setIsOpen] = useState(false)
    const id = uuidV4()
    function toggle(e) {
        e.stopPropagation()
        setIsOpen(prev => !prev)
    }
    function open(e) {
        e.stopPropagation()
        setIsOpen(true)
        onClick()
    }
    return (<>
        <div className='collapsable'>
            <Stack direction='horizontal' gap={2} onClick={open}>
                {children && <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} size="xs" onClick={toggle} aria-expanded={isOpen} aria-controls={id} className="chevron" />}
                <img src={`./images/${icon}.svg`} alt="icon" style={{ width: "24px" }} />
                <div className='text-truncate'>{name}</div>
            </Stack>
        </div>

        <Collapse in={isOpen}>
            <div id={id} style={{ paddingLeft: "15px" }}>
                {children}
            </div>
        </Collapse>
    </>)

}
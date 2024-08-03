import React from 'react'
import { Dropdown, Stack } from 'react-bootstrap'

import { filters } from './Dashboard'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons'
import "../../styles/filterDropdown.css"

export default function FilterDropdown({ style, chosenFilter, setChosenFilter, isASC, setIsASC }) {
    function isActive(filter) {
        return filter === chosenFilter
    }

    function chooseFilter(e) {
        setChosenFilter(e.target.dataset.filter)
    }
    function toggle() {
        setIsASC(prev => !prev)
    }
    return (
        <Stack direction='horizontal' style={style}>
            <FontAwesomeIcon icon={isASC ? faArrowUp : faArrowDown} onClick={toggle} className="toggle" />
            <Dropdown className='filter-dropdown'>
                <Dropdown.Toggle variant="white" id="dropdown-filter">
                    {chosenFilter}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    <Dropdown.Item data-filter={filters.DATE} onClick={chooseFilter} active={isActive(filters.DATE)}>{filters.DATE}</Dropdown.Item>
                    <Dropdown.Item data-filter={filters.NAME} onClick={chooseFilter} active={isActive(filters.NAME)}>{filters.NAME}</Dropdown.Item>
                    <Dropdown.Item data-filter={filters.SIZE} onClick={chooseFilter} active={isActive(filters.SIZE)}>{filters.SIZE}</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </Stack>

    )
}

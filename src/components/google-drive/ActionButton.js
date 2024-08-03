import React from 'react'
import { Stack } from 'react-bootstrap'
import { MenuButton } from './Dashboard'


export default function ActionButton({ icon, onClick, children }) {
    return <Stack gap={2} direction='horizontal' onClick={onClick} className="w-100 action-button">
        {icon && <MenuButton icon={icon} className='menu-button' />}
        {children}
    </Stack>
}

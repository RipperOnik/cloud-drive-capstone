import React, { useRef, useState } from 'react'
import { Card, Button, Form, Alert } from "react-bootstrap"
import { useAuth } from '../../contexts/AuthContext'
import { Link } from "react-router-dom"
import CenteredContainer from './CenteredContainer'


export default function ForgotPassword() {
    const emailRef = useRef()

    const { resetPassword } = useAuth()
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)


    async function handleSubmit(e) {
        e.preventDefault()

        try {
            setError('')
            setLoading(true)
            await resetPassword(emailRef.current.value)
            setMessage('Check your inbox for further instructions')

        } catch {
            setError('Failed to reset password')
        }
        setLoading(false)


    }
    return (

        <CenteredContainer>
            <Card>
                <Card.Body>
                    <h2 className='text-center mb-4'>Password Reset</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {message && <Alert variant="success">{message}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group id="email" className='mb-4'>
                            <Form.Label>Email</Form.Label>
                            <Form.Control type='email' required ref={emailRef} />
                        </Form.Group>


                        <Button disabled={loading} className='w-100' type="submit">Reset password</Button>
                    </Form>
                    <div className='w-100 text-center mt-3'>
                        <Link to="/login">Login</Link>
                    </div>
                </Card.Body>
            </Card>
            <div className='w-100 text-center mt-2'>
                Need an account? <Link to="/signup">Sign up</Link>
            </div>

        </CenteredContainer>

    )
}

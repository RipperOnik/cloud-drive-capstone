import React, { useRef, useState } from 'react'
import { Card, Button, Form, Alert } from "react-bootstrap"
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate } from "react-router-dom"
import CenteredContainer from './CenteredContainer'


export default function Login() {
    const emailRef = useRef()
    const passwordRef = useRef()
    const { login } = useAuth()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()

        try {
            setError('')
            setLoading(true)

            await login(emailRef.current.value, passwordRef.current.value)
            navigate('/')
        } catch {
            setError('Failed to login in')
        }
        setLoading(false)


    }
    return (

        <CenteredContainer>
            <Card>
                <Card.Body>
                    <h2 className='text-center mb-4'>Login</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group id="email">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type='email' required ref={emailRef} />
                        </Form.Group>
                        <Form.Group id="password" className='mb-4'>
                            <Form.Label>Password</Form.Label>
                            <Form.Control type='password' required ref={passwordRef} />
                        </Form.Group>

                        <Button disabled={loading} className='w-100' type="submit">Login</Button>
                    </Form>
                    <div className='w-100 text-center mt-3'>
                        <Link to="/forgot-password">Forgot password?</Link>
                    </div>
                </Card.Body>
            </Card>
            <div className='w-100 text-center mt-2'>
                Need an account? <Link to="/signup">Sign up</Link>
            </div>

        </CenteredContainer>

    )
}

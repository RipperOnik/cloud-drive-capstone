import React, { useContext, useEffect, useState } from 'react'
import { auth } from "../firebase"
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateEmail, updatePassword } from "firebase/auth"

const AuthContext = React.createContext()
export function useAuth() {
    return useContext(AuthContext)
}


export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState()
    const [loading, setLoading] = useState(true)
    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password)
    }
    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password)
    }
    function logout() {
        return signOut(auth)
    }
    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email)
    }
    function updateUserEmail(email) {
        return updateEmail(auth.currentUser, email)
    }
    function updateUserPassword(password) {
        return updatePassword(auth.currentUser, password)
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user)
            setLoading(false)
        })
        return unsubscribe
    }, [])

    const value = { currentUser, signup, login, logout, resetPassword, updateUserEmail, updateUserPassword }
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

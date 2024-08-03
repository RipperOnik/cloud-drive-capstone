import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Navbar, Nav, Offcanvas, Stack } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import SearchTooltip from './SearchTooltip'
import SearchResult from './SearchResult'
import { useFolder } from '../../hooks/useFolder'
import SideBar from './SideBar'
import "../../styles/navbar.css"

export default function NavbarComponent({ resetActiveIndex, style }) {
    const [text, setText] = useState("")
    const [width, setWidth] = useState(0)
    const target = useRef()
    const [showToolTip, setShowTooltip] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const [showBurger, setShowBurger] = useState(false)

    const { allFolders, allFiles } = useFolder()

    const [showSearchBar, setShowSearchbar] = useState(false)

    const navigate = useNavigate()
    const initialElements = useMemo(() => {
        return allFiles && allFolders && allFiles.concat(allFolders)
    }, [allFiles, allFolders])

    const [elements, setElements] = useState([])

    useEffect(() => {
        if (initialElements) {
            setElements(initialElements.filter(e => (text === "") || e.name.toLowerCase().includes(text.toLowerCase())))
        }
    }, [initialElements])


    function debouncer(originalFunction) {
        let timeout = null
        return (...args) => {
            if (timeout !== null) {
                clearTimeout(timeout)
            }
            timeout = setTimeout(() => {
                originalFunction(...args)
            }, 200)
        }
    }
    function search(text) {
        if (initialElements) {
            const newElements = initialElements.filter(e => (text === "") || e.name.toLowerCase().includes(text.toLowerCase()))
            setElements(newElements)
        }
    }
    const debouncedSearch = useMemo(() => debouncer(search), [initialElements])

    useEffect(() => {
        debouncedSearch(text)
    }, [text, debouncedSearch])


    function handleSearch(e) {
        e.preventDefault()
        initiateSearch()
    }

    function closeTooltip() {
        setShowTooltip(false)
    }
    const myObserver = useMemo(() => new ResizeObserver(entries => {
        // this will get called whenever div dimension changes
        entries.forEach(entry => {
            setWidth(entry.contentRect.width)
        });
    }), [])

    useEffect(() => {
        myObserver.observe(target.current)
        return () => myObserver.disconnect()
    }, [myObserver])

    function onHideSearchTooltip() {
        setTimeout(closeTooltip, 10)
        resetActiveIndex()
        setActiveIndex(-1)
        closeSearchBar()
    }
    function handleKeyDown(e) {
        const { key } = e;

        // move down
        if (key === "ArrowDown") {
            setActiveIndex(prev => (prev + 1) % elements.length)
        }

        // move up
        if (key === "ArrowUp") {
            setActiveIndex(prev => (prev + elements.length - 1) % elements.length)
        }

        // hide search results
        if (key === "Escape") {
            target.current.blur()
            closeSearchBar()
        }

        // select the current item
        if (key === "Enter") {
            e.preventDefault()
            initiateSearch()
        }
    }
    function initiateSearch() {
        target.current.blur()
        if (activeIndex >= 0) {
            const isFile = typeof elements[activeIndex].url !== 'undefined'
            if (isFile) {
                window.open(elements[activeIndex].url, "_blank")
            } else {
                navigate(`/folder/${elements[activeIndex].id}`)
            }
        } else {
            // go to search dashboard
            if (text.length > 0) {
                navigate(`/search/${text}`)
            }
        }
        closeTooltip()
    }
    function goHome() {
        resetActiveIndex()
        setActiveIndex(-1)
        navigate('/')
    }

    function handleCloseBurger() {
        setShowBurger(false)
    }
    function handleOpenBurger() {
        setShowBurger(true)
    }
    function closeSearchBar() {
        setShowSearchbar(false)
        setText('')
    }


    if (!showSearchBar) {
        return (
            <>
                <Navbar expand="md" style={{ height: "73px", ...style }}>
                    <Stack direction='horizontal' className='w-100' style={{ padding: "0 15px" }}>
                        <Stack direction='horizontal' className='flex-grow-1' gap={2}>
                            <img src="./images/menu.svg" alt="menu" className='navbar-menu d-md-none' onClick={handleOpenBurger} />
                            <Navbar.Brand className='d-flex align-items-center d-none d-md-flex' style={{ gap: "10px", cursor: "pointer", marginRight: "173px" }} onClick={goHome}>
                                CloudDrive
                            </Navbar.Brand>
                            {/* Mobile Navbar */}
                            <Navbar.Brand className='d-flex align-items-center d-md-none' style={{ gap: "10px", cursor: "pointer" }} onClick={goHome}>
                                CloudDrive
                            </Navbar.Brand>
                            <SearchBar handleSearch={handleSearch} showToolTip={showToolTip} setShowTooltip={setShowTooltip} target={target} elements={elements} activeIndex={activeIndex} setActiveIndex={setActiveIndex}
                                setText={setText} text={text}
                                onHideSearchTooltip={onHideSearchTooltip} handleKeyDown={handleKeyDown} width={width}
                            />
                        </Stack>
                        {/* Mobile search button */}
                        <button className='button-search d-md-none' onClick={() => setShowSearchbar(true)}>
                            <FontAwesomeIcon icon={faMagnifyingGlass} size="sm" />
                        </button>
                        <Nav>
                            <Nav.Link as={Link} to="/user" style={{ paddingRight: "0" }} className="d-none d-md-block">
                                Profile
                            </Nav.Link>
                        </Nav>
                    </Stack>
                </Navbar>
                <Offcanvas show={showBurger} onHide={handleCloseBurger}>
                    <Offcanvas.Header closeButton>
                        <Offcanvas.Title><Link to='/user'>Profile</Link></Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body>
                        <SideBar folders={allFolders} resetActiveIndex={resetActiveIndex} isMobile onHide={handleCloseBurger} />
                    </Offcanvas.Body>
                </Offcanvas>

            </>

        )

    } else {
        const mobileStyle = { width: '100%', maxWidth: 'none', height: "73px" }
        function onFocus() {
            setShowTooltip(true)
            document.body.style.backgroundImage = 'none'
        }
        function onHide() {
            onHideSearchTooltip()
            document.body.style.backgroundImage = 'linear-gradient(to right,#c910a9,#b311a1,#8e1191,#6a1282,#4e1276)'
        }

        return (<form className='form-search' onSubmit={handleSearch} style={mobileStyle}>
            <SearchTooltip
                show={showToolTip}
                width={target.current ? target.current.offsetWidth : 0}
                tooltipStyle={{ top: "100%" }}
                target={
                    <input autoFocus style={{ borderRadius: 0, height: "100%" }} type="search" width={width} ref={target} placeholder='Search in Drive' onChange={e => setText(e.target.value)} value={text}
                        onFocus={onFocus} onBlur={onHide} onKeyDown={handleKeyDown} />
                }>
                {elements && elements.slice(0, 7).map((element, index) => {
                    return <SearchResult element={element} activeIndex={activeIndex} setActiveIndex={setActiveIndex} index={index} key={element.id} />
                })}
            </SearchTooltip>
            <img src="./images/left-arrow.svg" alt="left-arrow" style={{ width: "32px", position: 'absolute', left: '10px', top: '30%' }} className='button-circular' onClick={closeSearchBar} />

        </form>)
    }

}


function SearchBar({ handleSearch, showToolTip, setShowTooltip, target, elements, activeIndex, setActiveIndex, setText, text, onHideSearchTooltip, handleKeyDown, width }) {
    const buttonRef = useRef(null)
    function onFocus() {
        setShowTooltip(true)
        buttonRef.current.style.color = 'grey'
    }
    function onBlur() {
        onHideSearchTooltip()
        buttonRef.current.style.color = '#f4c7ec'
    }

    return (<form className='form-search d-none d-md-flex flex-grow-1' onSubmit={handleSearch} >
        <SearchTooltip
            show={showToolTip}
            width={target.current ? target.current.offsetWidth : 0}
            target={<input type="search" width={width} ref={target} placeholder='Search in Drive' onChange={e => setText(e.target.value)} value={text} onFocus={onFocus} onBlur={onBlur} onKeyDown={handleKeyDown} />}>
            {elements && elements.slice(0, 7).map((element, index) => {
                return <SearchResult element={element} activeIndex={activeIndex} setActiveIndex={setActiveIndex} index={index} key={element.id} />
            })}
        </SearchTooltip>

        <button type='submit' className='button-search' style={{ position: 'absolute', left: '10px', top: '6px' }} ref={buttonRef}>
            <FontAwesomeIcon icon={faMagnifyingGlass} size="sm" />
        </button>
    </form>)

}
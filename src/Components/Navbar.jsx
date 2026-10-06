import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../Context/AuthContext'
import { useCart } from '../Context/CartContext'

const Navbar = () => {
    const sidebar = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => sidebar.current?.close();

    useEffect(() => {
        if (!menuOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const desktop = window.matchMedia('(min-width: 769px)');
        const handleResize = () => { if (desktop.matches) sidebar.current?.close(); };
        desktop.addEventListener('change', handleResize);
        return () => {
            document.body.style.overflow = previousOverflow;
            desktop.removeEventListener('change', handleResize);
        };
    }, [menuOpen]);
    const { user, logout } = useAuth();
    const { cartItems } = useCart();
    const cartQuantity = cartItems.reduce(
        (total, item) => total + item.quantity, 0
    );
    return (
        <nav className='navbar'>
            <div className='navbar-container'>
                <Link to='/' className='navbar-brand'>
                    D's NutShop
                </Link>
                <button type='button' className='navbar-menu-toggle' aria-label='Open navigation menu' aria-haspopup='dialog' aria-controls='mobile-navigation' aria-expanded={menuOpen} onClick={() => { sidebar.current.showModal(); setMenuOpen(true); }}>
                    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'><path d='M4 6h16M4 12h16M4 18h16' /></svg>
                    <span>Menu</span>
                </button>
                <div className='navbar-links'>
                    <Link to='/' className="navbar-link">Home</Link>
                    <Link to='/checkout'
                        className="navbar-link navbar-cart"
                        aria-label={`Cart, ${cartQuantity} ${cartQuantity === 1 ? 'item' : 'items'}`}
                    >
                        Cart
                        {cartQuantity > 0 && (
                            <span className='cart-badge' aria-hidden='true'>
                                {cartQuantity}
                            </span>
                        )}
                    </Link>
                </div>
                {!user ? (<div className="navbar-auth">
                    <div className="navbar-auth-links">
                        <Link className="navbar-login" to='/auth' state={{ initialMode: 'login' }}>Login</Link>
                        <Link className="navbar-signup" to='/auth' state={{ initialMode: 'signup' }}>Sign Up</Link>
                    </div>
                </div>) : (
                    <div className='navbar-user'>
                        <span className='navbar-greeting'>Hello, {user.username}</span>
                        <button className='btn btn-secondary' onClick={logout}>Logout</button>
                    </div>
                )}

            </div>
            <dialog ref={sidebar} id='mobile-navigation' className='navbar-sidebar' aria-labelledby='mobile-menu-title' onClose={() => setMenuOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu(); } }}>
                <div className='navbar-sidebar-header'>
                    <h2 id='mobile-menu-title'>D&apos;s NutShop</h2>
                    <button type='button' className='navbar-menu-close' aria-label='Close navigation menu' onClick={closeMenu} autoFocus>×</button>
                </div>
                <div className='navbar-sidebar-links'>
                    <NavLink to='/' end onClick={closeMenu}>Home</NavLink>
                    <NavLink to='/checkout' onClick={closeMenu} aria-label={`Cart, ${cartQuantity} ${cartQuantity === 1 ? 'item' : 'items'}`}>
                        Cart {cartQuantity > 0 && <span className='cart-badge' aria-hidden='true'>{cartQuantity}</span>}
                    </NavLink>
                </div>
                <div className='navbar-sidebar-account'>
                    {user ? <>
                        <p className='navbar-greeting'>Hello, {user.username}</p>
                        <button type='button' className='navbar-login' onClick={() => { logout(); closeMenu(); }}>Logout</button>
                    </> : <>
                        <p>Welcome to D&apos;s NutShop</p>
                        <Link className='navbar-login' to='/auth' state={{ initialMode: 'login' }} onClick={closeMenu}>Login</Link>
                        <Link className='navbar-signup' to='/auth' state={{ initialMode: 'signUp' }} onClick={closeMenu}>Sign Up</Link>
                    </>}
                </div>
            </dialog>
        </nav>
    )
}

export default Navbar

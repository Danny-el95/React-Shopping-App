import { Link } from 'react-router-dom'
import { useAuth } from '../Context/AuthContext'

const Navbar = () => {
    const { user, logout } = useAuth();
    return (
        <nav className='navbar'>
            <div className='navbar-container'>
                <Link to='/' className='navbar-brand'>
                    D's NutShop
                </Link>
                <div className='navbar-links'>
                    <Link to='/' className="navbar-link">Home</Link>
                    <Link to='/checkout' className="navbar-link">Cart</Link>
                </div>
                {!user ? (<div className="navbar-auth">
                    <div className="navbar-auth-links">
                        <Link className="btn btn-secondary" to='/auth'>Login</Link>
                        <Link className="btn btn-primary" to='/auth'>Sign Up</Link>
                    </div>
                </div>) : (
                    <div className='navbar-user'>
                        <span className='navbar-greeting'>Hello, {user.username}</span>
                        <button className='btn btn-secondary' onClick={logout}>Logout</button>
                    </div>
                )}

            </div>
        </nav>
    )
}

export default Navbar
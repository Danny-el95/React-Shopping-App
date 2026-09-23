import { Link } from 'react-router-dom'

const NotFound = () => {
    return (
        <section className='Not-found'>
            <h1>404 Not Found</h1>
            <p>This page does not exist. </p>

            <Link
                to='/' className='Not-found-link'>
                Go back
            </Link>
        </section>
    )
}

export default NotFound
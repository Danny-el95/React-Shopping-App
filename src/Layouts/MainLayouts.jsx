import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MainLayouts = () => {
    return (
        <>
            <Outlet />
            <ToastContainer />
        </>
    )
}

export default MainLayouts
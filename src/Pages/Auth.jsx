import { useContext, useEffect } from 'react'
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
// import { useLocation } from 'react-router-dom';


const Auth = () => {
    const [mode, setMode] = useState('signUp');
    const [error, setError] = useState(null);
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { signUp, user, logout, login } = useContext(AuthContext);

    const navigate = useNavigate();
    // const location = useLocation();

    // useEffect(() => {
    //     if (location.state && location.state.initialMode) {
    //         setMode(location.state.initialMode);
    //     }
    // }, [location]);

    const onSubmit = (data) => {
        setError(null)
        let result;
        if (mode === "signUp") {
            result = signUp(data.username, data.email, data.password);
        } else {
            result = login(data.email, data.password)
        };

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }

        console.log(result);
    }

    return (
        <div className='page'>
            <div className='container'>
                <div className='auth-container'>
                    {user && <p>User is logged in as {user.email}</p>}
                    <button onClick={() => logout()}>Logout</button>
                    <h1 className='page-title'>
                        {mode === 'signUp' ? 'Sign up' : 'Login'}
                    </h1>
                    <form className='auth-form' onSubmit={handleSubmit(onSubmit)}>
                        {error && <div className='error-message'>{error}</div>}
                        {mode === 'signUp' && (
                            <div className='form-group'>
                                <label className='form-label' htmlFor='username'>
                                    Username
                                </label>
                                <input type='text' name='username' className='form-input' id='username' {...register('username', { required: "Username is required" })} />
                                {errors.username && <span className='form-error'>{errors.username.message}</span>}
                            </div>
                        )}
                        <div className='form-group'>
                            <label className='form-label' htmlFor='email'>
                                Email
                            </label>
                            <input type='email' className='form-input' id='email' {...register('email', { required: "Email is required" })} />
                            {errors.email && <span className='form-error'>{errors.email.message}</span>}
                        </div>
                        <div className='form-group'>
                            <label className='form-label' htmlFor='password'>
                                Password
                            </label>
                            <input type='password' className='form-input' id='password' {...register('password', {
                                required: "Password is required",
                                minLength: {
                                    value: 6,
                                    message: "Password should be at least 6 characters.",
                                },
                                maxLength: {
                                    value: 12,
                                    message: "Password should be at most 12 characters.",
                                },
                            })} />
                            {errors.password && <span className='form-error'>{errors.password.message}</span>}
                        </div>
                        <button type='submit' className='btn btn-primary btn-large'>
                            {mode === 'signUp' ? 'Sign Up' : 'Login'}
                        </button>
                    </form>

                    <div className='auth-switch'>
                        {mode === 'signUp' ? (
                            <p>Already have an account?
                                <button type='button' className='auth-link' onClick={() => setMode('login')}>
                                    Login
                                </button></p>
                        ) : (
                            <p>Don't have an account? <button type='button' className='auth-link' onClick={() => setMode('signUp')}>Sign Up</button></p>
                        )}
                    </div>
                </div>
            </div>
        </div>

    )
}

export default Auth
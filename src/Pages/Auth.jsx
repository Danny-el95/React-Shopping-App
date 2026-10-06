import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../Context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';


const Auth = () => {
    const location = useLocation();

    return (
        <AuthForm
            key={location.key}
            initialMode={location.state?.initialMode === 'login' ? 'login' : 'signUp'}
        />
    );
};

const AuthForm = ({ initialMode }) => {
    const [mode, setMode] = useState(initialMode);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { signUp, login } = useAuth();
    const navigate = useNavigate();

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
        <div className='page auth-page'>
            <div className='container'>
                <div className='auth-container'>
                    <p className='product-card-eyebrow auth-brand'>D&apos;s NutShop</p>
                    <h1 className='auth-title'>
                        {mode === 'signUp' ? 'Create your account' : 'Welcome back'}
                    </h1>
                    <p className='auth-subtitle'>{mode === 'signUp' ? 'Sign up for D’s NutShop.' : 'Log in to continue shopping.'}</p>
                    <form className='auth-form' onSubmit={handleSubmit(onSubmit)}>
                        {error && <div className='error-message' role='alert'>{error}</div>}
                        {mode === 'signUp' && (
                            <div className='form-group'>
                                <label className='form-label' htmlFor='username'>
                                    Username
                                </label>
                                <input type='text' autoComplete='username' aria-invalid={!!errors.username} aria-describedby={errors.username ? 'username-error' : undefined} className='form-input' id='username' {...register('username', { required: "Username is required" })} />
                                {errors.username && <span id='username-error' className='form-error' role='alert'>{errors.username.message}</span>}
                            </div>
                        )}
                        <div className='form-group'>
                            <label className='form-label' htmlFor='email'>
                                Email
                            </label>
                            <input type='email' autoComplete='email' aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} className='form-input' id='email' {...register('email', { required: "Email is required" })} />
                            {errors.email && <span id='email-error' className='form-error' role='alert'>{errors.email.message}</span>}
                        </div>
                        <div className='form-group'>
                            <label className='form-label' htmlFor='password'>
                                Password
                            </label>
                            <div className='auth-password-field'>
                                <input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} className='form-input' id='password' {...register('password', {
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
                                <button type='button' className='auth-password-toggle' aria-controls='password' aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
                            </div>
                            {errors.password && <span id='password-error' className='form-error' role='alert'>{errors.password.message}</span>}
                        </div>
                        <button type='submit' className='auth-submit'>
                            {mode === 'signUp' ? 'Create Account' : 'Log In'}
                        </button>
                    </form>

                    <div className='auth-switch'>
                        {mode === 'signUp' ? (
                            <p>Already have an account?
                                <button type='button' className='auth-link' onClick={() => { setMode('login'); setError(null); setShowPassword(false); }}>
                                    Log in
                                </button></p>
                        ) : (
                            <p>New here? <button type='button' className='auth-link' onClick={() => { setMode('signUp'); setError(null); setShowPassword(false); }}>Create an account</button></p>
                        )}
                    </div>
                </div>
            </div>
        </div>

    )
}

export default Auth

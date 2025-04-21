import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { sendPasswordResetEmail } from '../../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(email);
      setSuccess('Password reset link sent to your email.');
      setError('');
    } catch (err) {
      setError('Failed to send password reset email.');
      setSuccess('');
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input w-full"
            placeholder="Enter your email"
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}
        <button type="submit" className="button w-full mt-4">
          Send Reset Link
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
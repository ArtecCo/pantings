import { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost/paintings/api';

export default function AdminLogin() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/admin/request-otp.php`,
        { email, password },
        { withCredentials: true }
      );

      if (response.data.success) {
        setStep(2);

        // Temporary local-development OTP
        if (response.data.development_otp) {
          setMessage(`Development OTP: ${response.data.development_otp}`);
        }
      } else {
        setMessage(response.data.message || 'Unable to send OTP.');
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Unable to connect to the server.'
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/admin/verify-otp.php`,
        { otp },
        { withCredentials: true }
      );

      if (response.data.success) {
        window.location.href = '/';
      } else {
        setMessage(response.data.message || 'Invalid OTP.');
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Unable to verify OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
      <div className="admin-login-mark">A</div>
        <div className="admin-login-header">
          <h1>Admin Portal</h1>
          <p>
            {step === 1
              ? 'Sign in to continue'
              : 'Enter the verification code'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={requestOtp}>

            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Continue'}
            </button>

          </form>
        ) : (
          <form onSubmit={verifyOtp}>

            <label>OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit OTP"
              maxLength="6"
              inputMode="numeric"
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>

            <button
              type="button"
              className="back-button"
              onClick={() => {
                setStep(1);
                setOtp('');
                setMessage('');
              }}
            >
              Back
            </button>

          </form>
        )}

        {message && (
          <div className="login-message">
            {message}
          </div>
        )}

      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { signUp } from '../../lib/auth';

const SignUp = () => {
  const { register, handleSubmit, errors } = useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await signUp(data);
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Sign Up</h2>
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label htmlFor="name" className="block mb-2">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            ref={register({ required: true })}
            className="input w-full"
          />
          {errors.name && <p className="error">Name is required</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            ref={register({ required: true })}
            className="input w-full"
          />
          {errors.email && <p className="error">Email is required</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block mb-2">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            ref={register({ required: true })}
            className="input w-full"
          />
          {errors.password && <p className="error">Password is required</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="membership" className="block mb-2">Membership Plan</label>
          <select id="membership" name="membership" required className="input w-full">
            <option value="BASIC">Basic</option>
            <option value="AMBASSADOR">Ambassador</option>
            <option value="VIP">VIP</option>
            <option value="BUSINESS">Business</option>
          </select>
        </div>
        <button type="submit" className="button w-full mt-4">
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignUp;
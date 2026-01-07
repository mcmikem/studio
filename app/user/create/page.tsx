'use client';

import { createUser } from './actions';
import { useState } from 'react';

export default function CreateUserPage() {
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const result = await createUser(email, password);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage('User created successfully!');
    }
  }

  return (
    <div>
      <h1>Create User</h1>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" />
        </div>
        <button type="submit">Create User</button>
      </form>
    </div>
  );
}

'use client';

import { getUser, updateUser } from '../../actions';
import { useEffect, useState } from 'react';

export default function EditUserPage({ params }) {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    getUser(params.uid).then((user) => {
      setUser(user);
      setEmail(user.email);
    });
  }, [params.uid]);

  async function handleSubmit(event) {
    event.preventDefault();
    await updateUser(params.uid, email);
    alert('User updated successfully!');
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Edit User</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit">Update User</button>
      </form>
    </div>
  );
}

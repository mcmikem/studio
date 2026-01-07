'use client';

import { getUsers, deleteUser, updateUserStatus } from './actions';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  async function handleDelete(uid) {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await deleteUser(uid);
      setUsers(users.filter((user) => user.uid !== uid));
    }
  }

  async function handleToggle(uid, disabled) {
    await updateUserStatus(uid, !disabled);
    setUsers(
      users.map((user) =>
        user.uid === uid ? { ...user, disabled: !disabled } : user
      )
    );
  }

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.uid}>
            {user.email} ({user.disabled ? 'Disabled' : 'Enabled'}){' '}
            <Link href={`/user/edit/${user.uid}`}>Edit</Link>{' '}
            <button onClick={() => handleDelete(user.uid)}>Delete</button>{' '}
            <button onClick={() => handleToggle(user.uid, user.disabled)}>
              {user.disabled ? 'Enable' : 'Disable'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

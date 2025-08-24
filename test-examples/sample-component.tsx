import React, { useState, useEffect } from 'react';

// Example component for testing extraction
function UserProfile() {
  const [user, setUser] = useState({ name: 'John Doe', email: 'john@example.com' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="profile-container">
      {/* Select this JSX block to test component extraction */}
      <div className="user-card">
        <img src={user.avatar} alt={user.name} />
        <h3>{user.name}</h3>
        <p>{user.email}</p>
        <span className="status">{isLoading ? 'Loading...' : 'Active'}</span>
      </div>
      
      <div className="actions">
        <button onClick={() => console.log('Edit')}>Edit Profile</button>
        <button onClick={() => console.log('Delete')}>Delete</button>
      </div>
    </div>
  );
}

// Example hook logic for testing extraction
function Counter() {
  // Select this hook logic to test hook extraction
  const [count, setCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setCount(prevCount => prevCount + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]);

  const toggle = () => setIsRunning(!isRunning);
  const reset = () => {
    setCount(0);
    setIsRunning(false);
  };

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={toggle}>{isRunning ? 'Pause' : 'Start'}</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

export { UserProfile, Counter };
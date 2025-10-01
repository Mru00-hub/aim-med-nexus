// src/pages/SimpleRegisterTest.tsx

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Make sure this path is correct

const SimpleRegisterTest = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSimpleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('Attempting to register...');

    try {
      // Step 1: Basic Supabase Auth Signup (NO metadata)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        // If the user already exists, this will fail here.
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Sign up succeeded but no user object was returned.');
      }

      console.log('Auth user created successfully:', authData.user);

      // Step 2: Basic Profile Insert (only required fields)
      // IMPORTANT: Using the 'user_profiles' table name we decided on.
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          // We are NOT sending full_name, user_role, etc.
          // This relies on those columns being nullable or having defaults.
        });
      
      if (profileError) {
        // If this fails, the error is definitely in the database rules.
        throw profileError;
      }

      console.log('Profile row created successfully!');
      setMessage('SUCCESS! User and profile were created.');

    } catch (error: any) {
      console.error('Test failed:', error);
      setMessage(`ERROR: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Simple Registration Test</h1>
      <p>This page bypasses all complex logic from the main registration form.</p>
      <form onSubmit={handleSimpleSubmit}>
        <div>
          <label>Email:</label><br/>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required 
            style={{ padding: '8px', minWidth: '300px' }}
          />
        </div>
        <div style={{ marginTop: '20px' }}>
          <label>Password:</label><br/>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            style={{ padding: '8px', minWidth: '300px' }}
          />
        </div>
        <button type="submit" disabled={isLoading} style={{ marginTop: '20px', padding: '10px 20px' }}>
          {isLoading ? 'Testing...' : 'Run Simple Test'}
        </button>
      </form>
      {message && <pre style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', border: '1px solid #ccc' }}>{message}</pre>}
    </div>
  );
};

export default SimpleRegisterTest;

import React from 'react';

export default function AttachmentTestPage() {
  const handleTestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If this alert appears, we have found the problem.
    alert('SUCCESS: The onChange event fired!');
    
    if (e.target.files && e.target.files.length > 0) {
      alert(`You selected ${e.target.files.length} file(s). The first one is: ${e.target.files[0].name}`);
    } else {
      alert('The files list is empty for some reason.');
    }
  };

  return (
    <div style={{ padding: '40px', backgroundColor: 'white', height: '100vh', color: 'black' }}>
      <h1>Attachment Isolation Test</h1>
      <p>Click the label below to select a file. An alert should appear immediately after you select one.</p>
      
      <hr style={{ margin: '20px 0' }} />

      <label 
        htmlFor="test-input" 
        style={{ 
          padding: '10px 15px', 
          border: '2px solid blue', 
          cursor: 'pointer', 
          backgroundColor: '#ddd',
          fontSize: '1.2rem' 
        }}
      >
        Click me to select a file
      </label>

      <input
        type="file"
        id="test-input"
        onChange={handleTestChange}
        style={{ display: 'none' }} // Hiding it simply
      />
    </div>
  );
}

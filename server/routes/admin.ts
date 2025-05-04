const express = require('express');
const app = express();
const port = 3000;

app.get('/admin/dashboard', (req, res) => {
  // Sample data (replace with your actual data fetching logic)
  const data = {
    users: [{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }],
    reports: [{ id: 1, title: 'Report 1' }],
  };

  // Sanitize the data before sending
  const sanitizedData = JSON.parse(JSON.stringify(data));

  return res.status(200).json(sanitizedData);
});

app.listen(port, () => {
  console.log(`Admin dashboard API listening on port ${port}`);
});
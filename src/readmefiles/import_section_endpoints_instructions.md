# Instructions for Importing Section Endpoints in server.js

## Step 1: Find the Import Section in server.js

Look for the section near the top of your `backend/server.js` file where other route modules are imported and used. This should be around lines 30-40 in your file. You'll find code similar to this:

```javascript
// Import routes
const teacherRoutes = require('./routes/teacher');
const cronRoutes = require('./routes/cron');

// Use routes
app.use('/', teacherRoutes);
app.use('/', cronRoutes);
// Import and initialize subject coordinator endpoints
const subjectCoordinatorRoutes = require('./routes/subject-coordinator-endpoints');
subjectCoordinatorRoutes(app, db);
```

## Step 2: Add the Section Endpoints Import

Add the following code right after the subject coordinator routes initialization:

```javascript
// Import and initialize section endpoints
const sectionRoutes = require('./routes/section-endpoints');
sectionRoutes(app, db);
```

Your imports section should now look like this:

```javascript
// Import routes
const teacherRoutes = require('./routes/teacher');
const cronRoutes = require('./routes/cron');

// Use routes
app.use('/', teacherRoutes);
app.use('/', cronRoutes);
// Import and initialize subject coordinator endpoints
const subjectCoordinatorRoutes = require('./routes/subject-coordinator-endpoints');
subjectCoordinatorRoutes(app, db);

// Import and initialize section endpoints
const sectionRoutes = require('./routes/section-endpoints');
sectionRoutes(app, db);
```

## Step 3: Restart Your Backend Server

After making these changes, you need to restart your backend server for the changes to take effect:

1. Stop your current backend server (Ctrl+C in the terminal where it's running)
2. Start it again with your usual command (e.g., `node server.js` or `npm start`)

## Verification

You can verify that the endpoint is working by:

1. Starting your frontend application
2. Logging in as a teacher or administrator
3. Going to the Teacher Management page
4. Finding a class adviser with an assigned section
5. Checking that the "Edit Section" button appears instead of "Assign Section"
6. Clicking the button and making sure the current section is pre-selected in the modal
7. Updating the section and verifying that the change is reflected after saving 
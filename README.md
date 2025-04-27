<h1 align="center"> SCHOOL VACCINATION MANAGEMENT SYSTEM </h1> 

<h3 align="center"> Simplify student vaccination tracking and management in schools.
<br> Easily add students, schedule vaccination drives, and maintain vaccination records.
<br> Admins can monitor vaccination status and ensure health compliance effortlessly. </h3>
<br><br>

About
The School Vaccination Management System is a web-based application developed using the MERN (MongoDB, Express.js, React.js, Node.js) stack.
It is designed to help schools manage student vaccination records, conduct vaccination drives, and monitor immunization statuses.

This system allows:

Admins to add schools and manage students.

Students to register and submit their vaccination details.

Tracking of vaccinated and non-vaccinated students.

Organized scheduling and reporting for vaccination drives.

Features:

User Roles: Admin and Student roles with specific access.

Admin Dashboard:

Add new students.

View vaccination status.

Schedule vaccination drives.

Student Dashboard:

Students can submit their vaccination details.

View scheduled vaccination drives.

Vaccination Drive Management:

Admins can create and manage vaccination drives.

Reports:

Admins can view lists of vaccinated and non-vaccinated students.

Technologies Used
Frontend: React.js, Material UI

Backend: Node.js, Express.js

Database: MongoDB

<br>
Installation
Clone the repository:

sh
Copy
Edit
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
Open 2 terminals.

Terminal 1: Backend setup

sh
Copy
Edit
cd backend
npm install
npm start
Create a .env file inside the backend folder and add:

env
Copy
Edit
MONGO_URL = mongodb://127.0.0.1:27017/school_vaccination
If you are using MongoDB Atlas, replace this URL with your own.

Terminal 2: Frontend setup

sh
Copy
Edit
cd frontend
npm install
npm start
Now:

Frontend will run at http://localhost:3000

Backend will run at http://localhost:5000

<br>
Important Notes
Ensure MongoDB is running locally on your machine.

Create some Admin and Student users through signup.

Admin can add students and create vaccination drives.

Students can log in and update their vaccination status.

Troubleshooting
If you face frontend API issues:

Create a .env file inside the frontend/ folder and add:

env
Copy
Edit
REACT_APP_BASE_URL=http://localhost:5000
Restart the frontend server.

Common error: Port 5000 already in use
Solution:
Either kill the process running on port 5000 or change the backend port in backend/index.js.
<<<<<<< HEAD
# Recipe Video App

A Flask web application for sharing and viewing recipe videos.

## Features
- **User Authentication**: Register and login for secure access.
- **Admin Dashboard**: Admins can view and delete all videos.
- **Recipe Upload**: Users can upload their own recipe videos with descriptions.
- **Video Player**: Modern video player for viewing recipes.
- **Responsive Design**: Beautiful dark-themed UI.

## Setup Instructions

### 1. Database Setup
Ensure you have MySQL installed and running.
Create a database (default name: `recipe_video_app`) or let the script do it.

Edit the `.env` file with your database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=recipe_video_app
SECRET_KEY=your_secret_key
```

### 2. Install Dependencies
Open a terminal in this folder and run:
```bash
pip install -r requirements.txt
```

### 3. Initialize Database
Run the setup script to create the necessary tables and default admin account:
```bash
python db_setup.py
```
*Note: A default admin account will be created with username: `admin` and password: `admin123`.*

### 4. Run the Application
Start the Flask development server:
```bash
python app.py
```

Visit `http://127.0.0.1:5000` in your browser.

## Project Structure
- `app.py`: Main application logic.
- `db_setup.py`: Database initialization script.
- `templates/`: HTML files.
- `static/css/`: Styling.
- `static/uploads/`: Storage for uploaded videos.
=======
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
>>>>>>> 880e6813fe6a077474948ba95292568d08a04496

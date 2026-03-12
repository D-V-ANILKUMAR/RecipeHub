import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_kA0uD5SOmMhP@ep-lucky-cherry-aib8pb05-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require")

def create_tables():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            full_name VARCHAR(100),
            password VARCHAR(255) NOT NULL,
            email VARCHAR(100),
            gender VARCHAR(20),
            phone_number VARCHAR(20),
            profile_photo VARCHAR(255),
            role VARCHAR(20) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        print("Users table checked/created.")
        
        # Create recipes table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS recipes (
            id SERIAL PRIMARY KEY,
            title VARCHAR(100) NOT NULL,
            description TEXT NOT NULL,
            video_filename VARCHAR(255),
            user_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)
        print("Recipes table checked/created.")

        # Check if admin exists, if not create one
        cursor.execute("SELECT * FROM users WHERE role='admin'")
        if not cursor.fetchone():
            # Create a default admin
            from werkzeug.security import generate_password_hash
            hashed_pw = generate_password_hash("admin123")
            cursor.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, %s)", ('admin', hashed_pw, 'admin'))
            print("Default admin created (username: admin, password: admin123)")
            conn.commit()

        conn.commit()
        cursor.close()
        conn.close()
        print("Database setup complete.")
    except Exception as e:
        print(f"Error setting up tables: {e}")

if __name__ == "__main__":
    create_tables()

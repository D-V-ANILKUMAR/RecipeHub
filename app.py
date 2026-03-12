import os
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from youtubesearchpython import VideosSearch
import time

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "your_secret_key")

# Enable CORS for the React app running on localhost:5173
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5175", "http://127.0.0.1:5175"])

app.config['UPLOAD_FOLDER'] = 'static/uploads/videos'
app.config['PROFILE_FOLDER'] = 'static/uploads/profiles'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max upload size

# Ensure upload directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['PROFILE_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    return psycopg2.connect(
        os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_kA0uD5SOmMhP@ep-lucky-cherry-aib8pb05-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"),
        cursor_factory=RealDictCursor
    )

@app.route('/')
def index():
    return jsonify({
        'message': 'RecipeVideoApp API Server is running.',
        'frontend_url': 'http://localhost:5175',
        'endpoints': {
            'status': '/api/auth/status',
            'recipes': '/api/recipes',
            'search': '/api/search'
        }
    })

@app.route('/api/auth/status')
def auth_status():
    if 'user_id' in session:
        return jsonify({
            'isAuthenticated': True,
            'user': {
                'id': session.get('user_id'),
                'username': session.get('username'),
                'role': session.get('role')
            }
        })
    return jsonify({'isAuthenticated': False}), 401

@app.route('/api/recipes', methods=['GET'])
def get_recipes():
    conn = get_db_connection()
    recipes = []
    youtube_recipes = []
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT recipes.*, users.username, users.profile_photo FROM recipes JOIN users ON recipes.user_id = users.id ORDER BY created_at DESC")
            recipes = cursor.fetchall()
            
            # Always fetch some popular cooking videos from YouTube for the home page
            try:
                videosSearch = VideosSearch("popular cooking recipes", limit = 100)
                youtube_recipes = videosSearch.result().get('result', [])
                for _ in range(2): # Up to 60 results
                    if videosSearch.next():
                        youtube_recipes.extend(videosSearch.result().get('result', []))
            except Exception as e:
                print(f"YouTube search error in get_recipes: {e}")
                youtube_recipes = []
    finally:
        conn.close()
    return jsonify({
        'recipes': recipes,
        'youtube_recipes': youtube_recipes
    })

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    hashed_pw = generate_password_hash(password)
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
            if cursor.fetchone():
                return jsonify({'error': 'Username already exists!'}), 400
            else:
                cursor.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, 'user')", (username, hashed_pw))
                conn.commit()
                return jsonify({'message': 'Registration successful!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
            user = cursor.fetchone()
            
            if user and check_password_hash(user['password'], password):
                session['user_id'] = user['id']
                session['username'] = user['username']
                session['role'] = user['role']
                return jsonify({
                    'message': 'Logged in successfully!',
                    'user': {
                        'id': user['id'],
                        'username': user['username'],
                        'role': user['role']
                    }
                })
            else:
                return jsonify({'error': 'Invalid credentials!'}), 401
    finally:
        conn.close()

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully.'})

@app.route('/api/upload', methods=['POST'])
def upload_recipe():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    title = request.form.get('title')
    description = request.form.get('description')
    
    if 'video' not in request.files:
        return jsonify({'error': 'No video file part'}), 400
        
    file = request.files['video']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filename = f"{int(time.time())}_{filename}"
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO recipes (title, description, video_filename, user_id) VALUES (%s, %s, %s, %s)",
                    (title, description, filename, session['user_id'])
                )
                conn.commit()
            return jsonify({'message': 'Recipe uploaded successfully!'})
        finally:
            conn.close()
    else:
        return jsonify({'error': 'Allowed file types are mp4, avi, mov, wmv'}), 400

@app.route('/api/recipes/<int:id>', methods=['GET'])
def get_recipe(id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM recipes WHERE id=%s", (id,))
            recipe = cursor.fetchone()
            if not recipe:
                return jsonify({'error': 'Recipe not found.'}), 404
            return jsonify({'recipe': recipe})
    finally:
        conn.close()

@app.route('/api/edit/<int:id>', methods=['POST', 'PUT'])
def edit_recipe(id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM recipes WHERE id=%s", (id,))
            recipe = cursor.fetchone()
            
            if not recipe:
                return jsonify({'error': 'Recipe not found.'}), 404
                
            if session['role'] != 'admin' and recipe['user_id'] != session['user_id']:
                return jsonify({'error': 'Permission denied.'}), 403
                
            title = request.form.get('title')
            description = request.form.get('description')
            
            new_video_filename = recipe['video_filename']
            if 'video' in request.files:
                file = request.files['video']
                if file and file.filename != '' and allowed_file(file.filename):
                    old_video_path = os.path.join(app.config['UPLOAD_FOLDER'], recipe['video_filename'])
                    if os.path.exists(old_video_path):
                        os.remove(old_video_path)
                        
                    filename = secure_filename(file.filename)
                    filename = f"{int(time.time())}_{filename}"
                    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                    new_video_filename = filename

            cursor.execute(
                "UPDATE recipes SET title=%s, description=%s, video_filename=%s WHERE id=%s",
                (title, description, new_video_filename, id)
            )
            conn.commit()
            return jsonify({'message': 'Recipe updated successfully!'})
    finally:
        conn.close()

@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if session['role'] == 'admin':
                 cursor.execute("SELECT recipes.*, users.username FROM recipes JOIN users ON recipes.user_id = users.id ORDER BY created_at DESC")
            else:
                cursor.execute("SELECT recipes.*, users.username FROM recipes JOIN users ON recipes.user_id = users.id WHERE recipes.user_id=%s ORDER BY created_at DESC", (session['user_id'],))
            recipes = cursor.fetchall()
            return jsonify({'recipes': recipes})
    finally:
        conn.close()

@app.route('/api/delete/<int:id>', methods=['DELETE'])
def delete_recipe(id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM recipes WHERE id=%s", (id,))
            recipe = cursor.fetchone()
            
            if recipe:
                if session['role'] == 'admin' or recipe['user_id'] == session['user_id']:
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], recipe['video_filename'])
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        
                    cursor.execute("DELETE FROM recipes WHERE id=%s", (id,))
                    conn.commit()
                    return jsonify({'message': 'Recipe deleted successfully.'})
                else:
                    return jsonify({'error': 'Permission denied.'}), 403
            else:
                return jsonify({'error': 'Recipe not found.'}), 404
    finally:
        conn.close()

@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('q', '')
    local_recipes = []
    youtube_recipes = []
    
    if query:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT recipes.*, users.username FROM recipes JOIN users ON recipes.user_id = users.id WHERE title LIKE %s OR description LIKE %s", (f"%{query}%", f"%{query}%"))
                local_recipes = cursor.fetchall()
        finally:
            conn.close()
            
        try:
            videosSearch = VideosSearch(query + " recipe", limit = 100)
            youtube_recipes = videosSearch.result().get('result', [])
            
            # Fetch more results to provide a truly extensive list
            for _ in range(2): # Up to 60 results (20 * 3)
                if videosSearch.next():
                    youtube_recipes.extend(videosSearch.result().get('result', []))
        except Exception as e:
            print(f"YouTube search error: {e}")
            youtube_recipes = []
            
    return jsonify({
        'local_recipes': local_recipes,
        'youtube_recipes': youtube_recipes,
        'query': query
    })

@app.route('/api/profile', methods=['GET'])
def profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, username, full_name, email, gender, phone_number, profile_photo, role, created_at FROM users WHERE id=%s", (session['user_id'],))
            user = cursor.fetchone()
            return jsonify({'user': user})
    finally:
        conn.close()

@app.route('/api/update_profile', methods=['POST', 'PUT'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    full_name = request.form.get('full_name')
    email = request.form.get('email')
    gender = request.form.get('gender')
    phone_number = request.form.get('phone_number')
    
    profile_photo = None
    if 'profile_photo' in request.files:
        file = request.files['profile_photo']
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            filename = f"{int(time.time())}_{filename}"
            file.save(os.path.join(app.config['PROFILE_FOLDER'], filename))
            profile_photo = filename

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if profile_photo:
                cursor.execute(
                    "UPDATE users SET full_name=%s, email=%s, gender=%s, phone_number=%s, profile_photo=%s WHERE id=%s",
                    (full_name, email, gender, phone_number, profile_photo, session['user_id'])
                )
            else:
                cursor.execute(
                    "UPDATE users SET full_name=%s, email=%s, gender=%s, phone_number=%s WHERE id=%s",
                    (full_name, email, gender, phone_number, session['user_id'])
                )
            conn.commit()
            
            cursor.execute("SELECT id, username, full_name, email, gender, phone_number, profile_photo, role, created_at FROM users WHERE id=%s", (session['user_id'],))
            updated_user = cursor.fetchone()
            
        return jsonify({'message': 'Profile updated successfully!', 'user': updated_user})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/admin/users', methods=['GET'])
def admin_users():
    if 'user_id' not in session or session['role'] != 'admin':
        return jsonify({'error': 'Unauthorized access!'}), 403
        
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, username, full_name, email, role, created_at FROM users ORDER BY created_at DESC")
            users = cursor.fetchall()
            return jsonify({'users': users})
    finally:
        conn.close()

@app.route('/api/admin/toggle_role/<int:user_id>', methods=['POST', 'PUT'])
def toggle_role(user_id):
    if 'user_id' not in session or session['role'] != 'admin':
        return jsonify({'error': 'Unauthorized access!'}), 403
        
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if user_id == session['user_id']:
                return jsonify({'error': 'You cannot change your own role!'}), 400
                
            cursor.execute("SELECT role FROM users WHERE id=%s", (user_id,))
            user = cursor.fetchone()
            if user:
                new_role = 'admin' if user['role'] == 'user' else 'user'
                cursor.execute("UPDATE users SET role=%s WHERE id=%s", (new_role, user_id))
                conn.commit()
                return jsonify({'message': 'User role updated!'})
            return jsonify({'error': 'User not found!'}), 404
    finally:
        conn.close()

@app.route('/api/admin/delete_user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    if 'user_id' not in session or session['role'] != 'admin':
        return jsonify({'error': 'Unauthorized access!'}), 403
        
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if user_id == session['user_id']:
                return jsonify({'error': 'You cannot delete yourself!'}), 400
                
            cursor.execute("DELETE FROM users WHERE id=%s", (user_id,))
            conn.commit()
            return jsonify({'message': 'User deleted successfully.'})
    finally:
        conn.close()

# Add route to serve media files
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

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

# Enable CORS - On Vercel, we can allow all origins or specify the deployment domain
CORS(app, supports_credentials=True)

# Vercel has a read-only filesystem except for /tmp
# Note: Files saved to /tmp are ephemeral and will be lost between requests
UPLOAD_FOLDER = 'static/uploads/videos'
PROFILE_FOLDER = 'static/uploads/profiles'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROFILE_FOLDER'] = PROFILE_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max upload size

# Ensure upload directories exist (may fail on Vercel production, which is expected for local storage)
try:
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['PROFILE_FOLDER'], exist_ok=True)
except Exception as e:
    print(f"Directory creation warning: {e}")

ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    # Production database should be configured via environment variables in Vercel Dashboard
    return psycopg2.connect(
        os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_kA0uD5SOmMhP@ep-lucky-cherry-aib8pb05-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"),
        cursor_factory=RealDictCursor
    )

@app.route('/')
def index():
    return jsonify({
        'message': 'RecipeHub API (Vercel) is running.',
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
            
            try:
                videosSearch = VideosSearch("popular cooking recipes", limit = 100)
                youtube_recipes = videosSearch.result().get('result', [])
                for _ in range(2):
                    if videosSearch.next():
                        youtube_recipes.extend(videosSearch.result().get('result', []))
            except Exception as e:
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
        
        # NOTE: This will fail on Vercel unless using cloud storage (S3/Cloudinary)
        try:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
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
        except Exception as e:
            return jsonify({'error': f"File upload failed (Vercel limitation): {str(e)}"}), 500
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
        except Exception as e:
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

# Add route to serve media files (Fallback for static files in the repo)
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

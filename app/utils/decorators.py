from functools import wraps
from flask import session, redirect, url_for, flash, request, jsonify

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({"success": False, "error": "Login required"}), 401
            flash('Please log in to access this page.', 'error')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({"success": False, "error": "Login required"}), 401
            return redirect(url_for('auth.login'))
        
        from app.models.user import User
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin:
            if request.path.startswith('/api/'):
                return jsonify({"success": False, "error": "Admin access required"}), 403
            flash('Admin access required.', 'error')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function

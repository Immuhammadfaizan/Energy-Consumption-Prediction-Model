from flask import Blueprint, render_template, session, redirect, url_for, flash
from app.utils.decorators import login_required
from app.models.user import User

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/prediction')
@login_required
def prediction():
    return render_template('prediction.html')

@main_bp.route('/statistics')
@login_required
def statistics():
    return render_template('statistics.html')

@main_bp.route('/about')
@login_required
def about():
    return render_template('about.html')

@main_bp.route('/admin')
@login_required
def admin():
    user = User.query.get(session.get('user_id'))
    if not user or not user.is_admin:
        flash("Unauthorized: Admin access required.", "error")
        return redirect(url_for('main.index'))
    return render_template('admin.html')

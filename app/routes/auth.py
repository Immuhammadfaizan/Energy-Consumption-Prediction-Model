from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from app.models.user import User, create_user, get_user_by_email, update_last_login

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = get_user_by_email(email)
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['fullname'] = user.fullname
            update_last_login(user.id)
            flash('Login successful!', 'success')
            return redirect(url_for('main.index'))
        else:
            flash('Invalid email or password', 'error')
            
    return render_template('login.html')

@auth_bp.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        fullname = request.form.get('fullname')
        email = request.form.get('email')
        phone = request.form.get('phone', '')
        organization = request.form.get('organization')
        city = request.form.get('city')
        category = request.form.get('category', 'general')
        password = request.form.get('password')
        confirm_password = request.form.get('confirmPassword') or request.form.get('confirm_password')
        
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('signup.html')
            
        existing_user = get_user_by_email(email)
        if existing_user:
            flash('Email already exists', 'error')
            return render_template('signup.html')
            
        success = create_user(fullname, email, phone, organization, city, password, category)
        if success:
            flash('Account created successfully! Please login.', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash('An error occurred during registration. Please try again.', 'error')
            
    return render_template('signup.html')

@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))

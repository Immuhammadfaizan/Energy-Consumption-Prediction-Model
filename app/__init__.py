from flask import Flask
from .extensions import db

def create_app(config_class='app.config.Config'):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)

    # Register blueprints
    from .routes.main import main_bp
    from .routes.auth import auth_bp
    from .routes.api import api_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(api_bp, url_prefix='/api')

    # Inject current user into all templates
    @app.context_processor
    def inject_user():
        from flask import session
        from .models.user import User
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
            return dict(current_user=user.to_dict() if user else None)
        return dict(current_user=None)

    # Create tables if they don't exist
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"Failed to create tables (DB might not be ready yet): {e}")

    return app

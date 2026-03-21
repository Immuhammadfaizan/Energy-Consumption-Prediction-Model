from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    fullname = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    organization = db.Column(db.String(150))
    city = db.Column(db.String(100))
    category = db.Column(db.String(50), default='general')
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    # Relationships
    predictions = db.relationship('Prediction', backref='owner', cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'fullname': self.fullname,
            'email': self.email,
            'phone': self.phone,
            'organization': self.organization,
            'city': self.city,
            'category': self.category,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

# Legacy helper functions for minimal refactoring in routes
def get_user_by_email(email):
    return User.query.filter_by(email=email).first()

def get_user_by_id(user_id):
    return User.query.get(user_id)

def create_user(fullname, email, phone, organization, city, password, category='general'):
    # Check if first user (make admin)
    is_first = User.query.count() == 0
    
    user = User(
        fullname=fullname,
        email=email,
        phone=phone,
        organization=organization,
        city=city,
        category=category,
        is_admin=is_first
    )
    user.set_password(password)
    
    try:
        db.session.add(user)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error creating user: {e}")
        return False

def update_last_login(user_id):
    user = User.query.get(user_id)
    if user:
        user.last_login = datetime.utcnow()
        db.session.commit()

def create_user_table():
    # SQLAlchemy handles this via db.create_all()
    pass
